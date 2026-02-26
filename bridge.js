const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const REPO_ROOT = __dirname;
const PORT = 3005;
const API_BASE = 'https://m.cuer.ai';
const CONFIG_FILE = path.join(os.homedir(), '.memorypalace', 'config.json');

// 1x1 transparent PNG for browser feedback
const TRANSPARENT_PNG = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000b49444154789c6360000200000500017a5eab3f0000000049454e44ae426082',
    'hex'
);

function log(msg) {
    const ts = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${ts}] [BRIDGE] ${msg}`);
}

function safePath(p) {
    if (!p) throw new Error('Missing file path');
    return path.normalize(p).replace(/^(\.\.(\/|\\|$))+/, '');
}

function loadConfig() {
    if (!fs.existsSync(CONFIG_FILE)) throw new Error(`Config not found at ${CONFIG_FILE}. Run \`mempalace init\`.`);
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

function apiRequest(method, urlPath, body, authToken) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + urlPath);
        const reqBody = body ? JSON.stringify(body) : null;
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                ...(reqBody ? { 'Content-Length': Buffer.byteLength(reqBody) } : {}),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        if (reqBody) req.write(reqBody);
        req.end();
    });
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = reqUrl.pathname;
    const query = Object.fromEntries(reqUrl.searchParams);

    const sendImg = () => {
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
        res.end(TRANSPARENT_PNG);
    };

    const sendText = (txt) => {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(txt);
    };

    const sendError = (err) => {
        log(`❌ Error: ${err.message}`);
        res.writeHead(500);
        res.end(err.message);
    };

    if (req.method === 'GET') {
        (async () => {
            try {
                if (pathname === '/read') {
                    const file = safePath(query.file);
                    const fullPath = path.join(REPO_ROOT, file);
                    if (fs.existsSync(fullPath)) {
                        sendText(fs.readFileSync(fullPath, 'utf8'));
                    } else {
                        res.writeHead(404);
                        res.end(`File not found: ${file}`);
                    }
                }
                else if (pathname === '/status') {
                    const status = execFileSync('git', ['status', '--porcelain'], { cwd: REPO_ROOT }).toString();
                    log('Checked git status');
                    sendText(status || 'Clean working tree');
                }
                else if (pathname === '/patch') {
                    const file = safePath(query.file);
                    if (!query.data) throw new Error('Missing diff data');
                    const diff = Buffer.from(query.data, 'base64').toString('utf8');
                    const patchFile = path.join(REPO_ROOT, 'cuer_temp.patch');
                    fs.writeFileSync(patchFile, diff);
                    try {
                        execFileSync('patch', ['-u', file, '-i', 'cuer_temp.patch'], { cwd: REPO_ROOT });
                        log(`💠 Patched: ${file}`);
                    } finally {
                        if (fs.existsSync(patchFile)) fs.unlinkSync(patchFile);
                    }
                    sendImg();
                }
                else if (pathname === '/stage') {
                    const file = safePath(query.file);
                    execFileSync('git', ['add', file], { cwd: REPO_ROOT });
                    log(`🔹 Staged: ${file}`);
                    sendImg();
                }
                else if (pathname === '/commit') {
                    const msg = query.message || 'bridge: automated update';
                    try {
                        execFileSync('git', ['commit', '-m', msg], { cwd: REPO_ROOT });
                        log(`✅ Committed: "${msg}"`);
                    } catch (e) {
                        if (!e.message.includes('nothing to commit')) throw e;
                    }
                    sendImg();
                }
                else if (pathname === '/push') {
                    log('🚀 Pushing...');
                    execFileSync('git', ['push', 'origin', 'HEAD'], { cwd: REPO_ROOT });
                    log('☁️ Push complete.');
                    sendImg();
                }
                else if (pathname === '/proxy-store') {
                    // AI Studio sends base64-encoded memory payload (no auth).
                    // Bridge adds palace_id from local config and proxies to /api/store.
                    // Credentials never touch git or AI Studio's context.
                    if (!query.json) throw new Error('Missing json param');
                    const payload = JSON.parse(Buffer.from(query.json, 'base64').toString('utf8'));
                    const config = loadConfig();
                    const result = await apiRequest('POST', '/api/store', payload, config.palace_id);
                    if (result.status >= 400) throw new Error(`Store failed (${result.status}): ${JSON.stringify(result.body)}`);
                    log(`💾 Stored: ${result.body?.short_id || '?'}`);
                    sendImg();
                }
                else if (pathname === '/sync-state') {
                    // Fetch live palace context, strip ALL credentials, write sanitized
                    // data to .palace/palace-state.json, commit and push.
                    // Optionally fetch fork skill and write to agent folder.
                    // AI Studio reads both files via GitHub raw URL — no credentials in git.
                    const config = loadConfig();
                    const result = await apiRequest('GET', '/api/context?limit=20', null, config.palace_id);
                    if (result.status >= 400) throw new Error(`Context fetch failed (${result.status})`);
                    const ctx = result.body;

                    const stateFile = path.join(REPO_ROOT, '.palace', 'palace-state.json');
                    let state = {};
                    try { state = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch {}

                    // Merge live data — no palace.id, no guest keys, no auth-bearing URLs
                    state.rooms = ctx.rooms || state.rooms || {};
                    state.open_next_steps = ctx.open_next_steps || [];
                    state.repo = ctx.repo || state.repo || null;
                    state.agents_roster = (ctx.agents || []).map(a => ({
                        name: a.name,
                        permissions: a.permissions,
                        joined: a.joined,
                    }));
                    state.live_chain = (ctx.chain || []).map(m => ({
                        short_id: m.short_id,
                        agent: m.agent,
                        summary: m.summary,
                        outcome: m.outcome,
                        room: m.room,
                        created_at: m.created_at,
                        capsule_url: m.capsule_url,
                    }));
                    state.synced_at = new Date().toISOString();

                    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
                    execFileSync('git', ['add', '.palace/palace-state.json'], { cwd: REPO_ROOT });

                    // If fork_id provided, fetch the fork skill and write to agent folder
                    // so AI Studio can read it via GitHub raw URL without hitting m.cuer.ai
                    if (query.fork_id) {
                        const forkId = query.fork_id;
                        if (!/^[a-z0-9]+$/i.test(forkId)) throw new Error('Invalid fork_id');
                        const forkResult = await apiRequest('GET', `/api/fork?id=${forkId}`, null, config.palace_id);
                        if (forkResult.status === 200 && typeof forkResult.body === 'string') {
                            const forkFile = path.join(REPO_ROOT, '.palace', 'agents', 'gemini-ai-studio', 'fork-skill.md');
                            fs.writeFileSync(forkFile, forkResult.body);
                            execFileSync('git', ['add', forkFile], { cwd: REPO_ROOT });
                            log(`📄 Fork skill written for ${forkId}`);
                        }
                    }

                    try {
                        execFileSync('git', ['commit', '-m', 'bridge: sync palace state'], { cwd: REPO_ROOT });
                    } catch (e) {
                        if (!e.message.includes('nothing to commit')) throw e;
                    }
                    execFileSync('git', ['push', 'origin', 'HEAD'], { cwd: REPO_ROOT });
                    log('🔄 Palace state synced to GitHub (no credentials).');
                    sendImg();
                }
                else {
                    res.writeHead(404);
                    res.end('Unknown endpoint');
                }
            } catch (e) {
                sendError(e);
            }
        })();
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n❖ BRIDGE v6 ONLINE ❖`);
    console.log(`Listening on http://127.0.0.1:${PORT}`);
    console.log(`Config: ${CONFIG_FILE}`);
    console.log(`Endpoints: /read /status /patch /stage /commit /push /proxy-store /sync-state`);
    console.log(`\nNote: /reflect and /capsule-reflect removed.`);
    console.log(`Credentials are loaded from local config and NEVER written to git.`);
});
