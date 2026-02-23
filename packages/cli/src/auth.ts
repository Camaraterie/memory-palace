import { getConfig, saveConfig } from './config';

export async function authCommand(guestKey: string) {
    if (!guestKey.startsWith('gk_')) {
        console.error('Invalid guest key format. Expected gk_<hex>');
        process.exit(1);
    }

    let config: any = {};
    try {
        config = getConfig();
    } catch (e) {
        // No config yet — that's OK for guest-only usage
    }

    config.guest_key = guestKey;
    saveConfig(config);
    console.log('Guest key saved to config.');
    console.log('You can now run: mempalace recover <short_id>');
}
