import fetch from 'node-fetch';
import { API_BASE, resolvePalaceConfig } from './config';

function getAuthToken() {
    const config = resolvePalaceConfig();
    return config.guest_key || config.palace_id;
}

function authHeaders(token: string) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

export async function roomCreateCommand(
    slug: string,
    options: { name?: string; intent?: string; patterns?: string; principles?: string; decisions?: string }
) {
    const token = getAuthToken();

    const name = options.name || slug;
    const body: any = { slug, name };
    if (options.intent) body.intent = options.intent;
    if (options.patterns) body.file_patterns = options.patterns.split(',').map((p: string) => p.trim());
    if (options.principles) body.principles = options.principles.split(',').map((p: string) => p.trim());
    if (options.decisions) {
        body.decisions = options.decisions.split('|').map((d: string) => {
            const [what, why] = d.split(':').map((s: string) => s.trim());
            return why ? { what, why } : { what };
        });
    }

    const res = await fetch(`${API_BASE}/api/rooms`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Failed to create room: ${await res.text()}`);
    const data = await res.json() as any;

    console.log(`Room ${data.room.slug} created/updated:`);
    console.log(`  Name:    ${data.room.name}`);
    if (data.room.intent) console.log(`  Intent:  ${data.room.intent}`);
    if (data.room.file_patterns?.length) {
        console.log(`  Patterns: ${data.room.file_patterns.join(', ')}`);
    }
}

export async function roomListCommand() {
    const token = getAuthToken();

    const res = await fetch(`${API_BASE}/api/rooms`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to list rooms: ${await res.text()}`);
    const data = await res.json() as any;

    if (!data.rooms?.length) {
        console.log('No rooms found. Create one with: mempalace room create <slug>');
        return;
    }

    for (const room of data.rooms) {
        const memCount = room.memory_count || 0;
        const last = room.last_activity ? new Date(room.last_activity).toLocaleDateString() : 'never';
        console.log(`\n[${room.slug}] ${room.name}`);
        if (room.intent) console.log(`  Intent:   ${room.intent}`);
        if (room.file_patterns?.length) console.log(`  Patterns: ${room.file_patterns.join(', ')}`);
        console.log(`  Memories: ${memCount}  Last: ${last}`);
    }
}

export async function roomShowCommand(slug: string, options: { limit?: string } = {}) {
    const token = getAuthToken();
    const limit = options.limit || '10';

    const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(slug)}?limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    if (res.status === 404) throw new Error(`Room not found: ${slug}`);
    if (!res.ok) throw new Error(`Failed to show room: ${await res.text()}`);
    const data = await res.json() as any;

    const { room, memories } = data;
    console.log(`\n[${room.slug}] ${room.name}`);
    if (room.intent) console.log(`\nIntent:\n  ${room.intent}`);
    if (room.principles?.length) {
        console.log('\nPrinciples:');
        room.principles.forEach((p: string) => console.log(`  • ${p}`));
    }
    if (room.decisions?.length) {
        console.log('\nDecisions:');
        room.decisions.forEach((d: any) => {
            if (typeof d === 'object' && d.what) {
                console.log(`  • ${d.what}${d.why ? ' — ' + d.why : ''}`);
            } else {
                console.log(`  • ${d}`);
            }
        });
    }
    if (room.file_patterns?.length) {
        console.log(`\nFile patterns: ${room.file_patterns.join(', ')}`);
    }

    if (memories?.length) {
        console.log(`\nRECENT STATE (Linked History):`);
        memories.forEach((m: any) => {
            const date = new Date(m.created_at).toLocaleDateString();
            console.log(`- [${m.short_id}] ${date} (${m.agent}): ${m.session_name}`);
            if (m.payload && m.payload.decisions && m.payload.decisions.length > 0) {
                m.payload.decisions.forEach((d: string) => {
                    console.log(`    Decision: ${d}`);
                });
            }
        });
    } else {
        console.log('\nNo memories linked to this room yet.');
    }
}

export async function roomMatchCommand(files: string[]) {
    const token = getAuthToken();
    const filesParam = files.join(',');

    const res = await fetch(`${API_BASE}/api/rooms/match?files=${encodeURIComponent(filesParam)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to match rooms: ${await res.text()}`);
    const data = await res.json() as any;

    let anyMatch = false;
    for (const match of data.matches || []) {
        if (match.rooms?.length) {
            anyMatch = true;
            console.log(`\n${match.file}`);
            for (const room of match.rooms) {
                console.log(`  → [${room.slug}] ${room.name}`);
                if (room.intent) console.log(`     Intent: ${room.intent}`);
                if (room.principles?.length) {
                    console.log(`     Principles: ${room.principles.join(' | ')}`);
                }
            }
        } else {
            console.log(`${match.file} — (no room match)`);
        }
    }

    if (!anyMatch) {
        console.log('No files matched any room patterns.');
    }
}
