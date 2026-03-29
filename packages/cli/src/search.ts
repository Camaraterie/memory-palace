import fetch from 'node-fetch';
import { API_BASE, resolvePalaceConfig, listAllPalaces } from './config';
import { generateEmbedding } from './embed';

export async function searchCommand(query: string, options: { room?: string; limit?: string; federation?: boolean; all?: boolean } = {}) {
    const limit = parseInt(options.limit || '10', 10);

    if (options.all) {
        // Search across ALL configured palaces
        const allPalaces = listAllPalaces();
        if (!allPalaces.length) {
            console.log('No palaces configured.');
            return;
        }

        const embedding = await generateEmbedding(query, 'query');
        let allResults: any[] = [];

        for (const palace of allPalaces) {
            const body: any = { limit };
            if (embedding) body.embedding = embedding;
            else body.query = query;
            if (options.room) body.room = options.room;

            try {
                const res = await fetch(`${API_BASE}/api/search`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${palace.guest_key}`,
                    },
                    body: JSON.stringify(body),
                });
                if (!res.ok) continue;
                const data = await res.json() as any;
                const tagged = (data.memories || []).map((m: any) => ({
                    ...m,
                    palace_id: palace.palace_id,
                    palace_name: palace.name || palace.palace_id.slice(0, 8),
                }));
                allResults = allResults.concat(tagged);
            } catch { continue; }
        }

        // Sort by similarity if available, then deduplicate by short_id
        allResults.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
        const seen = new Set<string>();
        allResults = allResults.filter(m => {
            if (seen.has(m.short_id)) return false;
            seen.add(m.short_id);
            return true;
        }).slice(0, limit);

        console.log(`\nSearch: ALL palaces (${allPalaces.length})  query: "${query}"\n`);
        if (!allResults.length) {
            console.log('No results found.');
            return;
        }
        for (const m of allResults) {
            const date = new Date(m.created_at).toLocaleDateString();
            const sim = m.similarity !== undefined ? `  sim=${(m.similarity * 100).toFixed(1)}%` : '';
            const palace = `  palace=${m.palace_name}`;
            console.log(`${m.short_id}  ${date}  ${m.agent}${palace}${sim}`);
            console.log(`  ${m.session_name}`);
        }
        console.log(`\nTo view a memory: mempalace recover <short_id>`);
        return;
    }

    // Default: search current palace only
    const config = resolvePalaceConfig();
    const useFederation = options.federation && config.federation_key;
    const authToken = useFederation ? config.federation_key : (config.guest_key || config.palace_id);

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
