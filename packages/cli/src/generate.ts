import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { getGeminiKey, API_BASE } from './config';
import { attachImage } from './attach';

const MEMORIES_DIR = path.join(process.cwd(), '.palace', 'memories');
const GEMINI_MODEL = 'gemini-3.1-flash-image-preview';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Generate a memory image using the Gemini API.
 *
 * Steps:
 *  1. Read the image generation prompt from promptFile
 *  2. Fetch the QR PNG for shortId from the palace API
 *  3. Call gemini-3.1-flash-image-preview with prompt + QR as reference image
 *  4. Save the result to .palace/memories/<shortId>.png
 *  5. Upload to Supabase storage via /api/upload (attachImage)
 *
 * @param promptFile  Path to the .txt image generation prompt (the comic strip description)
 * @param shortId     The short_id returned by mempalace save
 * @returns           Absolute path to the saved image
 */
export async function generateImage(promptFile: string, shortId: string): Promise<string> {
    // 1. Read prompt
    if (!fs.existsSync(promptFile)) {
        throw new Error(`Prompt file not found: ${promptFile}`);
    }
    const prompt = fs.readFileSync(promptFile, 'utf8').trim();
    console.log(`✓ Prompt loaded (${prompt.length} chars)`);

    // 2. Get Gemini API key
    const geminiKey = getGeminiKey();
    if (!geminiKey) {
        throw new Error(
            'No Gemini API key found.\n' +
            '  Set GEMINI_API_KEY env var, or run: mempalace init --gemini-key <key>'
        );
    }

    // 3. Fetch QR PNG from palace API (no auth required)
    console.log(`  Fetching QR code for ${shortId}...`);
    const qrRes = await fetch(`${API_BASE}/q/${shortId}/qr`);
    if (!qrRes.ok) {
        throw new Error(`QR fetch failed (${qrRes.status}): ${await qrRes.text()}`);
    }
    const qrBuffer = Buffer.from(await qrRes.arrayBuffer());
    const qrBase64 = qrBuffer.toString('base64');
    console.log(`✓ QR PNG fetched (${qrBuffer.length} bytes)`);

    // 4. Call Gemini image generation API
    console.log(`  Generating image with ${GEMINI_MODEL}...`);
    const requestBody = {
        contents: [{
            parts: [
                { text: prompt },
                { inlineData: { mimeType: 'image/png', data: qrBase64 } }
            ]
        }],
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
        }
    };

    const geminiRes = await fetch(
        `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        }
    );

    if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        throw new Error(`Gemini API error (${geminiRes.status}): ${errText}`);
    }

    const geminiData = await geminiRes.json() as any;
    const parts: any[] = geminiData?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

    if (!imgPart) {
        // Surface any text from Gemini to help diagnose refusals or errors
        const textPart = parts.find((p: any) => typeof p.text === 'string');
        if (textPart) console.error(`  Gemini said: ${textPart.text}`);
        console.error(`  Response parts: ${JSON.stringify(parts.map((p: any) => Object.keys(p)))}`);
        throw new Error(
            'No image returned by Gemini. The prompt may have been refused or the model ' +
            'is unavailable. Try again or check your GEMINI_API_KEY has image generation access.'
        );
    }

    // 5. Save image locally
    if (!fs.existsSync(MEMORIES_DIR)) {
        fs.mkdirSync(MEMORIES_DIR, { recursive: true });
    }
    const imagePath = path.join(MEMORIES_DIR, `${shortId}.png`);
    const imageBuffer = Buffer.from(imgPart.inlineData.data, 'base64');
    fs.writeFileSync(imagePath, imageBuffer);
    console.log(`✓ Image saved: ${imagePath} (${imageBuffer.length} bytes)`);

    // 6. Upload to Supabase storage via /api/upload
    await attachImage(shortId, imagePath);

    return imagePath;
}

/** CLI entry point for `mempalace generate <prompt_file> <short_id>` */
export async function generateCommand(promptFile: string, shortId: string) {
    try {
        const imagePath = await generateImage(promptFile, shortId);
        console.log(`\n✓ Done.`);
        console.log(`  Memory:  ${API_BASE}/q/${shortId}`);
        console.log(`  Image:   ${imagePath}`);
    } catch (e: any) {
        console.error(`✗ Generate failed: ${e.message}`);
        process.exit(1);
    }
}
