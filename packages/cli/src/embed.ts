import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

interface EmbedConfig {
    embedding_api?: string;
    embedding_model?: string;
    embedding_dimensions?: number;
}

function getEmbedConfig(): EmbedConfig {
    // Try project-level .palace/config.json first
    const projectConfig = path.join(process.cwd(), '.palace', 'config.json');
    if (fs.existsSync(projectConfig)) {
        try {
            const data = JSON.parse(fs.readFileSync(projectConfig, 'utf8'));
            if (data.embedding_api) return data;
        } catch {}
    }
    return {};
}

// Task prefix for nomic-embed-text-v1.5
const DOCUMENT_PREFIX = 'search_document: ';
const QUERY_PREFIX = 'search_query: ';

export function buildDocumentText(payload: any): string {
    const parts: string[] = [];
    if (payload.session_name) parts.push(payload.session_name);
    if (payload.outcome) parts.push(`Outcome: ${payload.outcome}`);
    if (payload.built?.length) parts.push(`Built: ${payload.built.join(', ')}`);
    if (payload.decisions?.length) parts.push(`Decisions: ${payload.decisions.join(', ')}`);
    if (payload.next_steps?.length) parts.push(`Next: ${payload.next_steps.join(', ')}`);
    if (payload.metadata?.room) parts.push(`Room: ${payload.metadata.room}`);
    if (payload.conversation_context) {
        parts.push(payload.conversation_context.slice(0, 500));
    }
    return parts.join('\n');
}

export async function generateEmbedding(text: string, mode: 'document' | 'query' = 'document'): Promise<number[] | null> {
    const config = getEmbedConfig();
    if (!config.embedding_api || !config.embedding_model) {
        return null;
    }

    const prefix = mode === 'document' ? DOCUMENT_PREFIX : QUERY_PREFIX;
    const input = prefix + text;

    try {
        const res = await fetch(config.embedding_api, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.embedding_model,
                input,
            }),
            // Short timeout — if LM Studio isn't running, fail fast
            signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
            process.stderr.write(`[embed] Warning: embedding API returned ${res.status}\n`);
            return null;
        }

        const data = await res.json() as any;
        const embedding = data?.data?.[0]?.embedding;

        if (!Array.isArray(embedding)) {
            process.stderr.write('[embed] Warning: unexpected embedding response shape\n');
            return null;
        }

        const dims = config.embedding_dimensions || 768;
        if (embedding.length !== dims) {
            process.stderr.write(`[embed] Warning: expected ${dims} dims, got ${embedding.length}\n`);
            return null;
        }

        return embedding as number[];
    } catch (e: any) {
        // LM Studio not running — graceful degradation
        process.stderr.write(`[embed] Warning: embedding failed (${e.message}) — storing without embedding\n`);
        return null;
    }
}
