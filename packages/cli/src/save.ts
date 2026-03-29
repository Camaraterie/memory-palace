import { resolvePalaceConfig, findProjectDir, getPalaceConfig, MemoryPayload } from './config';
import { storeMemory, secureStoreMemory } from './api';
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

export interface SaveResult {
    short_id: string;
    short_url: string;
    qr_path?: string;
}

/** Run a git command quietly, return trimmed output or undefined on failure. */
function git(cmd: string, cwd: string): string | undefined {
    try {
        return execSync(`git ${cmd}`, { cwd, stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim() || undefined;
    } catch { return undefined; }
}

// --- Platform detection ---

type Platform = 'claude-code' | 'codex-cli' | 'gemini-cli' | 'google-antigravity' | 'cursor' | 'claude-cowork' | 'unknown';

function detectPlatform(): Platform {
    if (process.env.CLAUDECODE === '1' || process.env.CLAUDE_CODE_ENTRYPOINT) return 'claude-code';
    if (process.env.CODEX || process.env.CODEX_CLI) return 'codex-cli';
    if (process.env.GEMINI_CLI) return 'gemini-cli';
    if (process.env.ANTIGRAVITY) return 'google-antigravity';
    if (process.env.CURSOR_SESSION_ID || process.env.CURSOR) return 'cursor';
    if (process.env.CLAUDE_COWORK) return 'claude-cowork';
    return 'unknown';
}

// --- Session detection ---

interface SessionInfo {
    session_id?: string;
    session_path?: string;
}

/** Detect Claude Code session: most recently modified .jsonl in the project sessions dir. */
function detectClaudeCodeSession(projectDir: string): SessionInfo {
    // Claude Code stores sessions at: ~/.claude/projects/[path-with-dashes]/[uuid].jsonl
    const slug = projectDir.replace(/^\//, '').replace(/\//g, '-');
    const sessionsDir = path.join(os.homedir(), '.claude', 'projects', slug);
    if (!fs.existsSync(sessionsDir)) return {};
    try {
        const files = fs.readdirSync(sessionsDir)
            .filter(f => f.endsWith('.jsonl'))
            .map(f => ({ name: f, mtime: fs.statSync(path.join(sessionsDir, f)).mtimeMs }))
            .sort((a, b) => b.mtime - a.mtime);
        if (files.length === 0) return {};
        const sessionId = files[0].name.replace('.jsonl', '');
        return { session_id: sessionId, session_path: path.join(sessionsDir, files[0].name) };
    } catch { return {}; }
}

/** Detect Codex CLI session: most recent .jsonl in ~/.codex/sessions/YYYY/MM/ */
function detectCodexSession(): SessionInfo {
    const now = new Date();
    const sessionsDir = path.join(os.homedir(), '.codex', 'sessions',
        String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
    if (!fs.existsSync(sessionsDir)) return {};
    try {
        const files = fs.readdirSync(sessionsDir)
            .filter(f => f.endsWith('.jsonl'))
            .map(f => ({ name: f, mtime: fs.statSync(path.join(sessionsDir, f)).mtimeMs }))
            .sort((a, b) => b.mtime - a.mtime);
        if (files.length === 0) return {};
        // Extract session ID from filename: rollout-YYYY-MM-DDT#-#-#-#[sessionID].jsonl
        const match = files[0].name.match(/rollout-[\d\-T]+\[([^\]]+)\]/);
        const sessionId = match ? match[1] : files[0].name.replace('.jsonl', '');
        return { session_id: sessionId, session_path: path.join(sessionsDir, files[0].name) };
    } catch { return {}; }
}

/** Detect Gemini CLI session: most recent chat in ~/.gemini/tmp/[project]/chats/ */
function detectGeminiSession(projectDir: string): SessionInfo {
    const projectName = path.basename(projectDir);
    // Gemini uses project name or a hash — try both
    const candidates = [
        path.join(os.homedir(), '.gemini', 'tmp', projectName, 'chats'),
    ];
    // Also try hash-based dirs
    const geminiTmp = path.join(os.homedir(), '.gemini', 'tmp');
    if (fs.existsSync(geminiTmp)) {
        try {
            for (const dir of fs.readdirSync(geminiTmp)) {
                const chatsDir = path.join(geminiTmp, dir, 'chats');
                if (fs.existsSync(chatsDir) && !candidates.includes(chatsDir)) {
                    candidates.push(chatsDir);
                }
            }
        } catch { }
    }

    for (const chatsDir of candidates) {
        if (!fs.existsSync(chatsDir)) continue;
        try {
            const files = fs.readdirSync(chatsDir)
                .map(f => ({ name: f, mtime: fs.statSync(path.join(chatsDir, f)).mtimeMs }))
                .sort((a, b) => b.mtime - a.mtime);
            if (files.length === 0) continue;
            return { session_id: files[0].name, session_path: path.join(chatsDir, files[0].name) };
        } catch { continue; }
    }
    return {};
}

function detectSession(platform: Platform, projectDir: string): SessionInfo {
    switch (platform) {
        case 'claude-code': return detectClaudeCodeSession(projectDir);
        case 'codex-cli': return detectCodexSession();
        case 'gemini-cli': return detectGeminiSession(projectDir);
        default: return {};
    }
}

// --- Team detection ---

/** Detect Claude Code agent team from ~/.claude/teams/ */
function detectTeam(): string | undefined {
    const teamsDir = path.join(os.homedir(), '.claude', 'teams');
    if (!fs.existsSync(teamsDir)) return undefined;
    try {
        const teams = fs.readdirSync(teamsDir)
            .filter(f => {
                const configPath = path.join(teamsDir, f, 'config.json');
                return fs.existsSync(configPath);
            })
            .map(f => ({
                name: f,
                mtime: fs.statSync(path.join(teamsDir, f, 'config.json')).mtimeMs,
            }))
            .sort((a, b) => b.mtime - a.mtime);
        return teams.length > 0 ? teams[0].name : undefined;
    } catch { return undefined; }
}

// --- OS detection ---

function detectOS(): string {
    const platform = os.platform(); // 'linux', 'darwin', 'win32'
    const release = os.release();
    if (platform === 'linux' && release.includes('microsoft')) return `wsl2 (${release})`;
    if (platform === 'linux') return `linux (${release})`;
    if (platform === 'darwin') return `macos (${release})`;
    if (platform === 'win32') return `windows (${release})`;
    return `${platform} (${release})`;
}

// --- Context injection ---

/**
 * Auto-inject project context into a memory payload.
 * Only fills fields that are missing or empty — never overwrites agent-provided values.
 */
function injectContext(payload: MemoryPayload, conf: { palace_id: string }): MemoryPayload {
    const cwd = process.cwd();
    const projectDir = findProjectDir(cwd) || cwd;

    // Git context
    if (!payload.repo) payload.repo = git('remote get-url origin', projectDir);
    if (!payload.branch) payload.branch = git('branch --show-current', projectDir);

    // Project context
    if (!payload.project_path) payload.project_path = projectDir;
    if (!payload.palace_name) {
        const palace = getPalaceConfig(conf.palace_id);
        if (palace?.name) payload.palace_name = palace.name;
    }

    // Platform & session context
    const platform = payload.platform as Platform || detectPlatform();
    if (!payload.platform) payload.platform = platform;
    if (!payload.os) payload.os = detectOS();

    if (!payload.session_id) {
        const session = detectSession(platform, projectDir);
        payload.session_id = session.session_id;
        if (!payload.session_path) payload.session_path = session.session_path;
    }

    // Team context (Claude Code agent teams)
    if (!payload.team) payload.team = detectTeam();

    return payload;
}

/** Internal: encrypt (optional), sign, and store a payload. Returns result without exiting. */
export async function saveMemory(filePath: string, secure: boolean = false): Promise<SaveResult> {
    const conf = resolvePalaceConfig();
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const payload: MemoryPayload = JSON.parse(fileContent);

    // Auto-inject project context for fields the agent didn't provide
    injectContext(payload, conf);

    let result: any;
    if (secure) {
        console.log('  Encrypting and signing memory...');
        result = await secureStoreMemory(conf, payload);
    } else {
        console.log('  Saving plaintext memory...');
        result = await storeMemory(conf, payload);
    }

    console.log(`✓ Memory stored — short_id: ${result.short_id}`);
    console.log(`  URL: ${result.short_url}`);

    let qr_path: string | undefined;
    if (result.qr_code && result.short_id) {
        const b64 = result.qr_code.replace(/^data:image\/png;base64,/, '');
        const dir = path.join(os.homedir(), '.memorypalace', 'memories');
        fs.mkdirSync(dir, { recursive: true });
        qr_path = path.join(dir, `${result.short_id}-qr.png`);
        fs.writeFileSync(qr_path, Buffer.from(b64, 'base64') as any);
        console.log(`  QR:  ${qr_path}`);
    }

    return { short_id: result.short_id, short_url: result.short_url, qr_path };
}

/** CLI entry point for `mempalace save <json_file> [--secure]` */
export async function saveMemoryCommand(filePath: string, secure: boolean = false) {
    try {
        await saveMemory(filePath, secure);
    } catch (e: any) {
        console.error('Save failed:', e.message);
        process.exit(1);
    }
}
