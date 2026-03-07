import fetch from 'node-fetch';
import { API_BASE, getConfig } from './config';

function getAuthToken() {
    const config = getConfig();
    return config.guest_key || config.palace_id;
}

export async function blogListCommand() {
    const res = await fetch(`${API_BASE}/api/blog/posts?limit=5`);
    if (!res.ok) throw new Error(`Failed to list blog posts: ${await res.text()}`);
    const data = await res.json() as any;

    if (!data.posts?.length) {
        console.log('No recent architectural briefings found.');
        return;
    }

    console.log('\nRecent Architectural Briefings:');
    for (const post of data.posts) {
        const date = new Date(post.published_at || post.created_at).toLocaleDateString();
        console.log(`[${date}] ${post.title} (slug: ${post.slug})`);
    }
    console.log('');
}

export async function blogReadCommand(slugOrLatest: string) {
    let targetSlug = slugOrLatest;

    if (targetSlug.toLowerCase() === 'latest') {
        const res = await fetch(`${API_BASE}/api/blog/posts?limit=1`);
        if (!res.ok) throw new Error(`Failed to fetch latest post: ${await res.text()}`);
        const data = await res.json() as any;
        if (!data.posts?.length) {
            console.log('No published posts found.');
            return;
        }
        targetSlug = data.posts[0].slug;
    }

    const res = await fetch(`${API_BASE}/api/blog/posts/${encodeURIComponent(targetSlug)}`);
    if (res.status === 404) throw new Error(`Blog post not found: ${targetSlug}`);
    if (!res.ok) throw new Error(`Failed to fetch blog post: ${await res.text()}`);
    const data = await res.json() as any;

    if (!data.success || !data.post) {
        throw new Error('Invalid response from blog API');
    }

    const post = data.post;
    const date = new Date(post.published_at || post.created_at).toLocaleDateString();

    console.log(`\n======================================================`);
    console.log(`TITLE:    ${post.title}`);
    if (post.subtitle) console.log(`SUBTITLE: ${post.subtitle}`);
    console.log(`AUTHOR:   ${post.author_persona || 'Unknown'}`);
    console.log(`DATE:     ${date}`);
    console.log(`======================================================\n`);

    // Basic terminal rendering with highlighting for directives
    let content = post.content || '';
    const lines = content.split('\n');

    const cyanBold = '\x1b[1;36m';
    const yellowBold = '\x1b[1;33m';
    const reset = '\x1b[0m';

    let inDirectiveSection = false;

    for (let line of lines) {
        const lowerLine = line.toLowerCase();
        
        // Check if we are entering a directive section
        if (lowerLine.match(/#+\s+(next steps|what comes next|directives)/i)) {
            inDirectiveSection = true;
            console.log(`${cyanBold}${line}${reset}`);
            continue;
        } else if (line.match(/^#+\s+/)) {
            // New header, exit directive section
            inDirectiveSection = false;
        }

        if (inDirectiveSection) {
            // Highlight list items in directive section
            if (line.match(/^(\s*[-*]|\s*\d+\.)/)) {
                console.log(`${yellowBold}${line}${reset}`);
            } else {
                console.log(`${cyanBold}${line}${reset}`);
            }
        } else {
            console.log(line);
        }
    }
    console.log(`\n======================================================\n`);
}
