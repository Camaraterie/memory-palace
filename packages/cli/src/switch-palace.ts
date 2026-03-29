import {
    findProjectDir, readProjectConfig,
    getGlobalConfig, saveGlobalConfig,
    getPalaceConfig, savePalaceConfig,
    listAllPalaces, writeProjectConfig, ProjectConfig,
} from './config';
import fs from 'fs';
import path from 'path';

export async function switchCommand(targetPalaceId?: string) {
    const cwd = process.cwd();

    // Must have a .palace/ directory (or be willing to create one)
    const projectDir = findProjectDir(cwd);
    if (!projectDir) {
        console.error('No .palace/ directory found. Run `mempalace init` first.');
        process.exit(1);
    }

    const allPalaces = listAllPalaces();
    if (!allPalaces.length) {
        console.error('No palaces configured. Run `mempalace init` first.');
        process.exit(1);
    }

    // Determine target palace
    let target = targetPalaceId
        ? allPalaces.find(p => p.palace_id === targetPalaceId || p.palace_id.startsWith(targetPalaceId))
        : undefined;

    if (targetPalaceId && !target) {
        console.error(`Palace "${targetPalaceId}" not found. Available:`);
        for (const p of allPalaces) {
            console.error(`  ${p.palace_id} (${p.name || 'unnamed'})`);
        }
        process.exit(1);
    }

    if (!target) {
        // No argument — list and ask
        console.log('Available palaces:');
        for (const p of allPalaces) {
            const active = p.palace_id === getGlobalConfig().active_palace ? ' (active)' : '';
            console.log(`  ${p.palace_id}  ${p.name || ''}${active}`);
        }
        console.log('\nUsage: mempalace switch <palace_id>');
        return;
    }

    const resolvedCwd = projectDir || cwd;

    // Read current palace BEFORE overwriting
    const currentProject = readProjectConfig(cwd);
    const oldPalaceId = currentProject?.palace_id;

    // Update .palace/config.json
    writeProjectConfig(cwd, { palace_id: target.palace_id } as ProjectConfig);

    // Update global active_palace
    const globalConfig = getGlobalConfig();
    globalConfig.active_palace = target.palace_id;
    saveGlobalConfig(globalConfig);

    // Update target palace's projects list
    if (!target.projects.includes(resolvedCwd)) {
        target.projects.push(resolvedCwd);
        savePalaceConfig(target);
    }

    // Remove cwd from old palace's projects
    if (oldPalaceId && oldPalaceId !== target.palace_id) {
        const oldPalace = getPalaceConfig(oldPalaceId);
        if (oldPalace) {
            oldPalace.projects = oldPalace.projects.filter(p => p !== resolvedCwd);
            savePalaceConfig(oldPalace);
        }
    }

    console.log(`✓ Switched to palace ${target.name || target.palace_id.slice(0, 8)}`);
    console.log(`  Updated ${path.join(projectDir, '.palace', 'config.json')}`);
}
