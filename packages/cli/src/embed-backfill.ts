import fetch from 'node-fetch';
import { API_BASE, getConfig } from './config';
import { generateEmbedding, buildDocumentText } from './embed';

export async function embedBackfillCommand(limit: number = 50) {
    const config = getConfig();
    const authToken = config.palace_id;

    console.log(`Fetching up to ${limit} memories without embeddings...`);

    // Fetch memories without embeddings
    const listRes = await fetch(`${API_BASE}/api/memories/embed?limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
    });

    if (!listRes.ok) {
        throw new Error(`Failed to fetch memories: ${await listRes.text()}`);
    }

    const { memories } = await listRes.json() as any;

    if (!memories || memories.length === 0) {
        console.log('No memories found without embeddings.');
        return;
    }

    console.log(`Found ${memories.length} memories to embed.`);

    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    for (const memory of memories) {
        try {
            // Parse the plaintext payload from ciphertext
            let payload: any;
            try {
                payload = JSON.parse(memory.ciphertext);
            } catch {
                console.warn(`  [skip] ${memory.short_id} — could not parse ciphertext`);
                skipped++;
                continue;
            }

            const text = buildDocumentText(payload);
            const embedding = await generateEmbedding(text, 'document');

            if (!embedding) {
                console.warn(`  [skip] ${memory.short_id} — embedding API unavailable`);
                skipped++;
                // If first memory fails, the API is probably down — abort early
                if (skipped === 1) {
                    console.error('Embedding API appears unavailable. Check .palace/config.json and LM Studio.');
                    return;
                }
                continue;
            }

            const patchRes = await fetch(`${API_BASE}/api/memories/embed`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({ short_id: memory.short_id, embedding }),
            });

            if (!patchRes.ok) {
                console.warn(`  [fail] ${memory.short_id} — ${await patchRes.text()}`);
                failed++;
            } else {
                console.log(`  [ok]   ${memory.short_id} — ${memory.session_name}`);
                succeeded++;
            }
        } catch (e: any) {
            console.warn(`  [fail] ${memory.short_id} — ${e.message}`);
            failed++;
        }
    }

    console.log(`\nDone. succeeded=${succeeded} failed=${failed} skipped=${skipped}`);
}
