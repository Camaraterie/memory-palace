import fs from 'fs';
import path from 'path';
import os from 'os';

// --- Legacy interface (deprecated, kept for backward compat) ---
export interface Config {
    palace_id: string;
    palace_key: string;
    public_key: string;
    gemini_key?: string;
    guest_key?: string;
    federation_key?: string;
    expected_palace_id?: string;
    fail_on_palace_mismatch?: boolean;
}

// --- New config interfaces ---

export interface GlobalConfig {
    version: 3;
    active_palace?: string;
    gemini_key?: string;
    api_base?: string;
    federation_key?: string;
}

export interface PalaceConfig {
    palace_id: string;
    guest_key: string;
    palace_key?: string;
    public_key?: string;
    name?: string;
    projects: string[];
    created_at?: string;
}

export interface ProjectConfig {
    palace_id: string;
    embedding_api?: string;
    embedding_model?: string;
    embedding_dimensions?: number;
    [key: string]: any; // allow other fields like gemini_api_key_env, model, etc.
}

export interface ResolvedConfig {
    palace_id: string;
    guest_key: string;
    palace_key?: string;
    public_key?: string;
    gemini_key?: string;
    federation_key?: string;
}

// Memory payload schema based on spec
export interface MemoryPayload {
    session_name: string;
    agent: string;
    status: string;
    outcome: "succeeded" | "failed" | "partial" | "in_progress";
    built: string[];
    decisions: string[];
    next_steps: string[];
    files: string[];
    blockers: string[];
    conversation_context: string;
    latent_intent?: string;
    repo?: string;
    branch?: string;
    project_path?: string;
    palace_name?: string;
    team?: string;
    platform?: string;
    session_id?: string;
    session_path?: string;
    os?: string;
    roster: any[];
    metadata: Record<string, string>;
}

// --- Constants ---

const CONFIG_DIR = path.join(os.homedir(), '.memorypalace');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
export const PALACES_DIR = path.join(CONFIG_DIR, 'palaces');

export const API_BASE = process.env.MP_API_BASE || 'https://m.cuer.ai';

// --- Walk-up project finder ---

export function findProjectDir(startDir: string): string | null {
    let dir = path.resolve(startDir);
    while (true) {
        const candidate = path.join(dir, '.palace', 'config.json');
        if (fs.existsSync(candidate)) return dir;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return null;
}

// --- Project-local config ---

export function readProjectConfig(cwd: string): ProjectConfig | null {
    const projectDir = findProjectDir(cwd);
    if (!projectDir) return null;
    const filePath = path.join(projectDir, '.palace', 'config.json');
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.palace_id) return data as ProjectConfig;
    } catch { }
    return null;
}

export function writeProjectConfig(cwd: string, config: ProjectConfig) {
    const projectDir = findProjectDir(cwd) || cwd;
    const palaceDir = path.join(projectDir, '.palace');
    if (!fs.existsSync(palaceDir)) {
        fs.mkdirSync(palaceDir, { recursive: true });
    }
    const filePath = path.join(palaceDir, 'config.json');
    // Preserve existing fields
    let merged = { ...config };
    if (fs.existsSync(filePath)) {
        try {
            const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            merged = { ...existing, palace_id: config.palace_id };
        } catch { }
    }
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
}

// --- Global config ---

export function getGlobalConfig(): GlobalConfig {
    if (!fs.existsSync(CONFIG_FILE)) {
        return { version: 3 };
    }
    try {
        const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        if (data.version === 3) return data as GlobalConfig;
        // Old format detected — will be migrated by migrateIfNeeded
        return { version: 3 };
    } catch {
        return { version: 3 };
    }
}

export function saveGlobalConfig(config: GlobalConfig) {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

// --- Per-palace config ---

function palaceFilePath(palaceId: string): string {
    return path.join(PALACES_DIR, `${palaceId}.json`);
}

export function getPalaceConfig(palaceId: string): PalaceConfig | null {
    const filePath = palaceFilePath(palaceId);
    if (!fs.existsSync(filePath)) return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8')) as PalaceConfig;
    } catch {
        return null;
    }
}

export function savePalaceConfig(config: PalaceConfig) {
    if (!fs.existsSync(PALACES_DIR)) {
        fs.mkdirSync(PALACES_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(palaceFilePath(config.palace_id), JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function listAllPalaces(): PalaceConfig[] {
    if (!fs.existsSync(PALACES_DIR)) return [];
    const results: PalaceConfig[] = [];
    for (const file of fs.readdirSync(PALACES_DIR)) {
        if (!file.endsWith('.json')) continue;
        try {
            const data = JSON.parse(fs.readFileSync(path.join(PALACES_DIR, file), 'utf8'));
            if (data.palace_id && data.guest_key) results.push(data);
        } catch { }
    }
    return results;
}

// --- Migration ---

let migrationChecked = false;

export function migrateIfNeeded() {
    if (migrationChecked) return;
    migrationChecked = true;

    if (!fs.existsSync(CONFIG_FILE)) return;

    let oldData: any;
    try {
        oldData = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch { return; }

    // Already new format
    if (oldData.version === 3) return;

    // Detect old format: has palace_id + guest_key at top level
    if (!oldData.palace_id || !oldData.guest_key) return;

    // Migrate
    const palaceConfig: PalaceConfig = {
        palace_id: oldData.palace_id,
        guest_key: oldData.guest_key,
        palace_key: oldData.palace_key,
        public_key: oldData.public_key,
        name: 'migrated-palace',
        projects: [],
        created_at: new Date().toISOString(),
    };
    savePalaceConfig(palaceConfig);

    const globalConfig: GlobalConfig = {
        version: 3,
        active_palace: oldData.palace_id,
        gemini_key: oldData.gemini_key,
        federation_key: oldData.federation_key,
    };
    saveGlobalConfig(globalConfig);

    // Update project-local config if cwd has a .palace/ dir
    const projectDir = findProjectDir(process.cwd());
    if (projectDir) {
        const configPath = path.join(projectDir, '.palace', 'config.json');
        if (fs.existsSync(configPath)) {
            try {
                const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                if (!existing.palace_id) {
                    existing.palace_id = oldData.palace_id;
                    fs.writeFileSync(configPath, JSON.stringify(existing, null, 2));
                }
            } catch { }
        } else {
            writeProjectConfig(projectDir, { palace_id: oldData.palace_id });
        }
    }

    console.log('Migrated config to multi-palace format. Credentials stored in ~/.memorypalace/palaces/');
}

// --- Main resolver ---

export function resolvePalaceConfig(cwd?: string): ResolvedConfig {
    migrateIfNeeded();

    const resolvedCwd = cwd || process.cwd();

    // 1. Try project-local config
    const projectConfig = readProjectConfig(resolvedCwd);
    let palaceId: string | undefined;

    if (projectConfig?.palace_id) {
        palaceId = projectConfig.palace_id;
    }

    // 2. Fall back to global active_palace
    if (!palaceId) {
        const global = getGlobalConfig();
        palaceId = global.active_palace;
    }

    // 3. No palace at all
    if (!palaceId) {
        throw new Error('No Memory Palace configured. Run `mempalace init` in this directory.');
    }

    // 4. Load palace credentials
    const palace = getPalaceConfig(palaceId);
    if (!palace) {
        throw new Error(`Palace ${palaceId} not found in ~/.memorypalace/palaces/. Run \`mempalace init\` to create one.`);
    }

    // 5. Merge with global settings
    const global = getGlobalConfig();

    return {
        palace_id: palace.palace_id,
        guest_key: palace.guest_key,
        palace_key: palace.palace_key,
        public_key: palace.public_key,
        gemini_key: global.gemini_key,
        federation_key: global.federation_key,
    };
}

// --- Legacy wrappers (deprecated) ---

/** @deprecated Use resolvePalaceConfig() instead */
export function getConfig(): Config {
    try {
        const resolved = resolvePalaceConfig();
        return {
            palace_id: resolved.palace_id,
            palace_key: resolved.palace_key || '',
            public_key: resolved.public_key || '',
            guest_key: resolved.guest_key,
            gemini_key: resolved.gemini_key,
            federation_key: resolved.federation_key,
        };
    } catch (e: any) {
        throw new Error('Config not found. Please run `mempalace init`.');
    }
}

/** @deprecated Use savePalaceConfig() + saveGlobalConfig() instead */
export function saveConfig(config: Config) {
    // Save palace credentials to palaces dir
    const palaceConfig: PalaceConfig = {
        palace_id: config.palace_id,
        guest_key: config.guest_key || '',
        palace_key: config.palace_key,
        public_key: config.public_key,
        projects: [],
    };
    savePalaceConfig(palaceConfig);

    // Save global settings
    const globalConfig: GlobalConfig = {
        version: 3,
        active_palace: config.palace_id,
        gemini_key: config.gemini_key,
        federation_key: config.federation_key,
    };
    saveGlobalConfig(globalConfig);
}

export function getGeminiKey(): string | undefined {
    try {
        const global = getGlobalConfig();
        if (global.gemini_key) return global.gemini_key;
    } catch (e) { }
    return process.env.GEMINI_API_KEY;
}
