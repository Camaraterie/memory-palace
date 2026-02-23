import { getConfig } from './config';
import { getMemoryRaw } from './api';
import { decryptPayload, verifySignature } from './crypto';

export async function verifyMemory(shortId: string) {
    try {
        const conf = getConfig();
        const authToken = conf.guest_key || conf.palace_id;
        const raw = await getMemoryRaw(authToken, shortId);

        // Plaintext (legacy) detection
        try {
            JSON.parse(raw.ciphertext);
            console.log("UNVERIFIED (plaintext memory — no cryptographic signature possible)");
            return "UNVERIFIED";
        } catch (e) {
            // encrypted
        }

        const parts = raw.ciphertext.split(':');
        if (parts.length !== 3) {
            console.log(`TAMPERED (Invalid structural ciphertext)`);
            return "TAMPERED";
        }

        const [ivB64, authTagB64, ciphertextB64] = parts;

        const payload = decryptPayload(conf.palace_key, conf.palace_id, ciphertextB64, ivB64, authTagB64);

        if (raw.signature && conf.public_key) {
            const isValid = verifySignature(conf.public_key, raw.signature, payload);
            if (isValid) {
                console.log("VALID");
                return "VALID";
            }
        }

        console.log("TAMPERED");
        return "TAMPERED";
    } catch (e: any) {
        if (e.message === 'NOT_FOUND') {
            console.log("NOT_FOUND");
            return "NOT_FOUND";
        }
        console.error(`Verification error:`, e.message);
        process.exit(1);
    }
}
