import {
    findProjectDir, readProjectConfig,
    getGlobalConfig, saveGlobalConfig,
    getPalaceConfig, savePalaceConfig,
    resolvePalaceConfig, writeProjectConfig, ProjectConfig,
} from './config';
import path from 'path';

export async function mergeCommand(sourcePalaceId: string) {
    const cwd = process.cwd();

    // Validate source palace exists
    const sourceConfig = getPalaceConfig(sourcePalaceId);
    if (!sourceConfig) {
        console.error(`Palace ${sourcePalaceId} not found in ~/.memorypalace/palaces/`);
        process.exit(1);
    }

    // Find current project's palace
    const resolved = resolvePalaceConfig(cwd);
    if (resolved.palace_id === sourcePalaceId) {
        console.error('This project is already linked to that palace.');
        process.exit(1);
    }

    const projectDir = findProjectDir(cwd);
    if (!projectDir) {
        console.error('No .palace/ directory found. Run `mempalace init` first.');
        process.exit(1);
    }

    const oldPalaceId = resolved.palace_id;
    const resolvedCwd = projectDir;

    // Point current project at the source palace
    writeProjectConfig(cwd, { palace_id: sourcePalaceId } as ProjectConfig);

    // Add cwd to source palace's projects list
    if (!sourceConfig.projects.includes(resolvedCwd)) {
        sourceConfig.projects.push(resolvedCwd);
        savePalaceConfig(sourceConfig);
    }

    // Remove cwd from old palace's projects list
    const oldPalace = getPalaceConfig(oldPalaceId);
    if (oldPalace) {
        oldPalace.projects = oldPalace.projects.filter(p => p !== resolvedCwd);
        savePalaceConfig(oldPalace);
    }

    // Update global active
    const global = getGlobalConfig();
    global.active_palace = sourcePalaceId;
    saveGlobalConfig(global);

    const sourceName = sourceConfig.name || sourcePalaceId.slice(0, 8);
    console.log(`✓ Merged: this project now shares palace "${sourceName}"`);
    console.log(`  Old palace ${oldPalaceId} is now orphaned (no projects pointing to it)`);
    console.log(`  Credentials preserved in ~/.memorypalace/palaces/${oldPalaceId}.json`);
}
