import {
    findProjectDir, readProjectConfig,
    getGlobalConfig, saveGlobalConfig,
    savePalaceConfig, PalaceConfig, GlobalConfig,
    writeProjectConfig,
} from './config';
import { generateKeys } from './crypto';
import { createPalace } from './api';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function checkMcpConfig(binPath: string) {
    // Attempt to configure Claude Desktop MCP
    const claudeDir = path.join(os.homedir(), '.config', 'Claude');
    const claudeConfigPath = path.join(claudeDir, 'claude_desktop_config.json');
    if (fs.existsSync(claudeDir)) {
        let conf: any = { mcpServers: {} };
        if (fs.existsSync(claudeConfigPath)) {
            try {
                conf = JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'));
            } catch (e) { }
        }
        if (!conf.mcpServers) conf.mcpServers = {};
        conf.mcpServers["memory_palace"] = {
            command: "node",
            args: [binPath, "mcp"]
        };
        fs.writeFileSync(claudeConfigPath, JSON.stringify(conf, null, 2));
        console.log(`✓ Configured Claude Desktop MCP at ${claudeConfigPath}`);
    } else {
        console.log(`ℹ Claude Desktop not found. To configure MCP manually, add:`);
        console.log(`
"mcpServers": {
  "memory_palace": {
    "command": "node",
    "args": ["${binPath}", "mcp"]
  }
}
`);
    }
}

export async function initCommand(options: { geminiKey?: string; name?: string }) {
    try {
        const cwd = process.cwd();

        // --- Overwrite guard ---
        const existingProject = readProjectConfig(cwd);
        if (existingProject?.palace_id) {
            console.error("This directory is already linked to a Memory Palace.");
            console.error(`  Palace: ${existingProject.palace_id}`);
            console.error("  To reinitialize, delete .palace/config.json first.");
            console.error("  To use a different palace, run: mempalace switch <palace_id>");
            process.exit(1);
        }

        // Preserve existing global gemini_key
        let existingGeminiKey: string | undefined;
        try {
            const global = getGlobalConfig();
            existingGeminiKey = global.gemini_key;
        } catch (e) { }

        console.log("Generating local cryptography keys...");
        const keys = generateKeys();

        console.log("Registering Palace with m.cuer.ai...");
        const { palace_id: palaceId, admin_key: adminKey } = await createPalace(keys.public_key);

        const palaceName = options.name || path.basename(cwd);

        // Save palace credentials to per-palace file
        const palaceConfig: PalaceConfig = {
            palace_id: palaceId,
            guest_key: adminKey,
            palace_key: keys.palace_key,
            public_key: keys.public_key,
            name: palaceName,
            projects: [cwd],
            created_at: new Date().toISOString(),
        };
        savePalaceConfig(palaceConfig);

        // Save global config
        const geminiKey = options.geminiKey || existingGeminiKey;
        const globalConfig: GlobalConfig = {
            version: 3,
            active_palace: palaceId,
            ...(geminiKey ? { gemini_key: geminiKey } : {}),
        };
        saveGlobalConfig(globalConfig);

        // Write project-local pointer
        writeProjectConfig(cwd, {
            palace_id: palaceId,
        });

        console.log(`✓ Palace initialized! Palace ID: ${palaceId}`);
        console.log(`  Name: ${palaceName}`);
        console.log(`  Credentials: ~/.memorypalace/palaces/${palaceId}.json`);
        console.log();

        // Try to guess global installed bin path. Since we are local for now:
        const currentBinPath = path.resolve(__dirname, 'index.js');
        await checkMcpConfig(currentBinPath);

        console.log(`\nYou are now ready to store and retrieve signed memory context locally and across agents.`);
    } catch (e: any) {
        console.error("Initialization failed:", e.message);
        process.exit(1);
    }
}
