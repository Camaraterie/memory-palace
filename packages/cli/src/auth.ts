import { resolvePalaceConfig, savePalaceConfig, getPalaceConfig, getGlobalConfig, saveGlobalConfig, PalaceConfig } from './config';

export async function authCommand(guestKey: string) {
    if (!guestKey.startsWith('gk_')) {
        console.error('Invalid guest key format. Expected gk_<hex>');
        process.exit(1);
    }

    try {
        // Update the currently resolved palace's guest key
        const resolved = resolvePalaceConfig();
        const palace = getPalaceConfig(resolved.palace_id);
        if (palace) {
            palace.guest_key = guestKey;
            savePalaceConfig(palace);
            console.log(`Guest key updated for palace ${palace.name || palace.palace_id.slice(0, 8)}.`);
        } else {
            // Fallback: save to global config for bootstrapping
            const global = getGlobalConfig();
            const newPalace: PalaceConfig = {
                palace_id: resolved.palace_id,
                guest_key: guestKey,
                projects: [],
            };
            savePalaceConfig(newPalace);
            global.active_palace = resolved.palace_id;
            saveGlobalConfig(global);
            console.log('Guest key saved to new palace config.');
        }
    } catch (e) {
        // No palace at all — create a minimal one
        const global = getGlobalConfig();
        const newPalace: PalaceConfig = {
            palace_id: 'pending-init',
            guest_key: guestKey,
            projects: [],
        };
        savePalaceConfig(newPalace);
        console.log('Guest key saved. Run `mempalace init` to complete setup.');
        return;
    }

    console.log('You can now run: mempalace recover <short_id>');
}
