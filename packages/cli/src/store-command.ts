import { saveMemory } from './save';
import { generateImage } from './generate';
import { API_BASE } from './config';

/**
 * Combined store command: save memory JSON + generate image in one shot.
 *
 * Usage: mempalace store <prompt_file> <payload_json>
 *
 *   prompt_file   — .palace/prompts/mem-NNN.txt  (comic strip panel description)
 *   payload_json  — /tmp/mem-NNN-payload.json     (12-field memory payload)
 *
 * Steps:
 *  1. Encrypt, sign, and POST the JSON payload → gets short_id
 *  2. Fetch QR PNG for short_id
 *  3. Call gemini-3.1-flash-image-preview with prompt + QR reference
 *  4. Save image to .palace/memories/<short_id>.png
 *  5. Upload to Supabase storage via /api/upload
 */
export async function storeCommand(promptFile: string, payloadFile: string) {
    try {
        console.log('── Step 1/2: Storing memory payload ─────────────────────');
        const { short_id, short_url } = await saveMemory(payloadFile);

        console.log('\n── Step 2/2: Generating memory image ────────────────────');
        const imagePath = await generateImage(promptFile, short_id);

        console.log('\n✓ Memory complete.');
        console.log(`  Short ID: ${short_id}`);
        console.log(`  Capsule:  ${short_url}`);
        console.log(`  Image:    ${imagePath}`);
        console.log(`  QR:       ${API_BASE}/q/${short_id}/qr`);
    } catch (e: any) {
        console.error(`✗ Store failed: ${e.message}`);
        process.exit(1);
    }
}
