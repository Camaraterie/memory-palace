import { saveMemory } from './save';
import { generateImage } from './generate';
import { API_BASE } from './config';
import fs from 'fs';

// Add validation before generating image
function validatePromptFormat(prompt: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const required = [
        '3×3 grid',
        'TOP-LEFT PANEL',
        'TOP-CENTER PANEL',
        'TOP-RIGHT PANEL',
        'MIDDLE-LEFT PANEL',
        'MIDDLE-CENTER PANEL',
        'MIDDLE-RIGHT PANEL',
        'BOTTOM-LEFT PANEL',
        'BOTTOM-CENTER PANEL',
        'BOTTOM-RIGHT PANEL'
    ];

    for (const section of required) {
        if (!prompt.includes(section)) {
            errors.push(`Missing: ${section}`);
        }
    }

    if (!prompt.includes('FORGE') && !prompt.includes('FLUX') && !prompt.includes('ATLAS') && !prompt.includes('INDEX')) {
        errors.push('Missing recognized character portrait (e.g. FORGE, FLUX)');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Combined store command: save memory JSON + generate image in one shot.
 *
 * Usage: mempalace store <prompt_file> <payload_json> [--secure]
 *
 *   prompt_file   — .palace/prompts/mem-NNN.txt  (comic strip panel description)
 *   payload_json  — /tmp/mem-NNN-payload.json     (12-field memory payload)
 *
 * Steps:
 *  1. Save POST the JSON payload → gets short_id
 *  2. Fetch QR PNG for short_id
 *  3. Call gemini-3.1-flash-image-preview with prompt + QR reference
 *  4. Save image to .palace/memories/<short_id>.png
 *  5. Upload to Supabase storage via /api/upload
 */
export async function storeCommand(promptFile: string, payloadFile: string, secure: boolean = false) {
    try {
        if (!fs.existsSync(promptFile)) {
            throw new Error(`Prompt file not found: ${promptFile}`);
        }

        const promptContent = fs.readFileSync(promptFile, 'utf8');
        const validation = validatePromptFormat(promptContent);
        
        if (!validation.valid) {
            throw new Error(`Prompt format invalid. Must use 3x3 layout. Errors:\n  - ${validation.errors.join('\n  - ')}`);
        }

        console.log('── Step 1/2: Storing memory payload ─────────────────────');
        const { short_id, short_url } = await saveMemory(payloadFile, secure);

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
