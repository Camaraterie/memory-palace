import { listAllPalaces, getGlobalConfig } from './config';

export async function palacesListCommand(options: { verbose?: boolean }) {
    const globalConfig = getGlobalConfig();
    const allPalaces = listAllPalaces();

    if (!allPalaces.length) {
        console.log('No palaces configured. Run `mempalace init` to create one.');
        return;
    }

    for (const palace of allPalaces) {
        const active = palace.palace_id === globalConfig.active_palace ? ' *' : '';
        const name = palace.name || palace.palace_id.slice(0, 8);
        console.log(`  ${name}${active}`);
        console.log(`    ID:       ${palace.palace_id}`);
        if (palace.projects.length) {
            console.log(`    Projects: ${palace.projects.join(', ')}`);
        }
        if (options.verbose) {
            console.log(`    Key:      ${palace.guest_key ? palace.guest_key.slice(0, 12) + '...' : 'none'}`);
            console.log(`    Created:  ${palace.created_at || 'unknown'}`);
        }
    }

    console.log(`\n  ${allPalaces.length} palace(s). * = active global default`);
}
