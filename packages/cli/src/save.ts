import { getConfig, MemoryPayload } from './config';
import { storeMemory } from './api';
import fs from 'fs';
import os from 'os';
import path from 'path';

export interface SaveResult {
    short_id: string;
    short_url: string;
    qr_path?: string;
}

/** Internal: encrypt, sign, and store a payload. Returns result without exiting. */
export async function saveMemory(filePath: string): Promise<SaveResult> {
    const conf = getConfig();
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const payload: MemoryPayload = JSON.parse(fileContent);

    console.log('  Encrypting and signing memory...');
    const result: any = await storeMemory(conf, payload);

    console.log(`✓ Memory stored — short_id: ${result.short_id}`);
    console.log(`  URL: ${result.short_url}`);

    let qr_path: string | undefined;
    if (result.qr_code && result.short_id) {
        const b64 = result.qr_code.replace(/^data:image\/png;base64,/, '');
        const dir = path.join(os.homedir(), '.memorypalace', 'memories');
        fs.mkdirSync(dir, { recursive: true });
        qr_path = path.join(dir, `${result.short_id}-qr.png`);
        fs.writeFileSync(qr_path, Buffer.from(b64, 'base64'));
        console.log(`  QR:  ${qr_path}`);
    }

    return { short_id: result.short_id, short_url: result.short_url, qr_path };
}

/** CLI entry point for `mempalace save <json_file>` */
export async function saveMemoryCommand(filePath: string) {
    try {
        await saveMemory(filePath);
    } catch (e: any) {
        console.error('Save failed:', e.message);
        process.exit(1);
    }
}
