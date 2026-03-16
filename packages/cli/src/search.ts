import fetch from 'node-fetch';
import { API_BASE, getConfig } from './config';
import { generateEmbedding } from './embed';

export async function searchCommand(query: string, options: { room?: string; limit?: string; federation?: boolean } = {}) {
    const config = getConfig();
    const useFederation = options.federation && config.federation_key;
    const authToken = useFederation ? config.federation_key : (config.guest_key || config.palace_id);
    const limit = parseInt(options.limit || '10', 10);

    // Try semantic search first
    const embedding = await generateEmbedding(query, 'query');

    const body: any = { limit };
    if (embedding) {
        body.embedding = embedding;
    } else {
        body.query = query;
    }
    if (options.room) body.room = options.room;

    const res = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Search failed: ${await res.text()}`);
    const data = await res.json() as any;

    const mode = data.mode === 'semantic' ? 'semantic (vector)' : 'keyword (fallback)';
    const scope = data.federation ? ' (federation — cross-palace)' : '';
    console.log(`\nSearch mode: ${mode}${scope}  query: "${query}"\n`);

    if (!data.memories?.length) {
        console.log('No results found.');
        return;
    }

    for (const m of data.memories) {
        const date = new Date(m.created_at).toLocaleDateString();
        const sim = m.similarity !== undefined ? `  sim=${(m.similarity * 100).toFixed(1)}%` : '';
        const room = m.room_slug ? `  [${m.room_slug}]` : '';
        const palace = m.palace_id && data.federation ? `  palace=${m.palace_id.slice(0, 8)}` : '';
        console.log(`${m.short_id}  ${date}  ${m.agent}${room}${palace}${sim}`);
        console.log(`  ${m.session_name}`);
        if (m.latent_intent) {
            console.log(`  latent_intent: ${m.latent_intent}`);
        }
    }

    console.log(`\nTo view a memory: mempalace recover <short_id>`);
}
