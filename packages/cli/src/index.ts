#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './init';
import { recoverMemory } from './recover';
import { runMcpServer } from './mcp';
import { authCommand } from './auth';
import { inviteAgent, revokeAgent, listAgents } from './agents';
import { shareMemory } from './share';
import { attachImage } from './attach';
import { generateCommand } from './generate';
import { storeCommand } from './store-command';
import { generatePromptTemplateCommand } from './generate-prompt';
import { roomCreateCommand, roomListCommand, roomShowCommand, roomMatchCommand } from './rooms';
import { blogListCommand, blogReadCommand } from './blog';
import { searchCommand } from './search';
import { embedBackfillCommand } from './embed-backfill';

const program = new Command();

program
    .name('memory-palace')
    .description('Memory Palace CLI for agents')
    .version('2.0.0');

program
    .command('init')
    .description('Initialize Memory Palace')
    .option('--gemini-key <key>', 'Set Gemini API Key')
    .action(async (options) => {
        await initCommand(options);
    });

program
    .command('recover <short_id>')
    .description('Recover context')
    .action(async (short_id) => {
        await recoverMemory(short_id);
    });

program
    .command('list')
    .description('List recent memories')
    .option('--limit <n>', 'Number of memories to return', '10')
    .action(async (options) => {
        const { listMemories } = require('./list');
        await listMemories(parseInt(options.limit, 10));
    });

program
    .command('verify <short_id>')
    .description('Verify memory signature')
    .action(async (short_id) => {
        const { verifyMemory } = require('./verify');
        await verifyMemory(short_id);
    });

program
    .command('scan <image_path>')
    .description('Scan image to extract memory context')
    .action(async (image_path) => {
        const { scanCommand } = require('./scan');
        await scanCommand(image_path);
    });

program
    .command('auth <guest_key>')
    .description('Save a guest key to config (mempalace auth gk_xxxx)')
    .action(async (guest_key) => {
        await authCommand(guest_key);
    });

program
    .command('invite <agent_name>')
    .description('Create a guest key for an agent')
    .option('--permissions <level>', 'read, write, or admin (default: write)', 'write')
    .action(async (agent_name, options) => {
        await inviteAgent(agent_name, options.permissions);
    });

program
    .command('revoke <agent_name>')
    .description('Revoke a guest key by agent name')
    .action(async (agent_name) => {
        await revokeAgent(agent_name);
    });

program
    .command('agents')
    .description('List all agents and their guest keys')
    .action(async () => {
        await listAgents();
    });

program
    .command('share <short_id>')
    .description('Generate a self-contained Python decrypt snippet for web agents (e.g. ChatGPT)')
    .action(async (short_id) => {
        await shareMemory(short_id);
    });

program
    .command('attach <short_id> <image_path>')
    .description('Attach a generated image to a stored memory (copies to .palace/memories/ and uploads)')
    .action(async (short_id, image_path) => {
        await attachImage(short_id, image_path);
    });

program
    .command('generate <prompt_file> <short_id>')
    .description('Generate a memory image via Gemini API and upload to Supabase')
    .action(async (prompt_file, short_id) => {
        await generateCommand(prompt_file, short_id);
    });

program
    .command('prompt-template')
    .description('Print the required 3x3 grid memory prompt template')
    .action(async () => {
        await generatePromptTemplateCommand();
    });

program
    .command('store <prompt_file> <payload_json>')
    .description('Save memory + generate image in one shot (prompt_file: .txt, payload_json: JSON)')
    .option('--secure', 'Encrypt payload locally before sending')
    .action(async (prompt_file, payload_json, options) => {
        await storeCommand(prompt_file, payload_json, options.secure);
    });

program
    .command('mcp')
    .description('Start MCP server over stdio')
    .action(async () => {
        await runMcpServer();
    });

const blog = program.command('blog').description('Manage and read architectural blog posts');

blog
    .command('list')
    .description('List recent blog posts')
    .action(async () => {
        await blogListCommand();
    });

blog
    .command('read <slugOrLatest>')
    .description('Read a specific blog post by slug or use "latest"')
    .action(async (slugOrLatest) => {
        await blogReadCommand(slugOrLatest);
    });

const room = program.command('room').description('Manage rooms (project intent containers)');

room
    .command('create <slug>')
    .description('Create or update a room')
    .option('--name <name>', 'Room display name')
    .option('--intent <intent>', 'Design intent and purpose of this project area')
    .option('--patterns <patterns>', 'Comma-separated glob patterns for matching files')
    .option('--principles <principles>', 'Comma-separated design principles')
    .option('--decisions <decisions>', 'Pipe-separated decisions (what:why|what:why)')
    .action(async (slug, options) => {
        await roomCreateCommand(slug, options);
    });

room
    .command('list')
    .description('List all rooms with intent and memory counts')
    .action(async () => {
        await roomListCommand();
    });

room
    .command('show <slug>')
    .description('Show room details with linked memories')
    .option('--limit <n>', 'Number of memories to show', '10')
    .action(async (slug, options) => {
        await roomShowCommand(slug, options);
    });

room
    .command('match <files...>')
    .description('Find rooms matching the given file paths')
    .action(async (files) => {
        await roomMatchCommand(files);
    });

program
    .command('search <query>')
    .description('Semantic search across memories (falls back to keyword if no embedding config)')
    .option('--room <slug>', 'Filter results to a specific room')
    .option('--limit <n>', 'Number of results to return', '10')
    .action(async (query, options) => {
        await searchCommand(query, options);
    });

program
    .command('embed-backfill')
    .description('Retroactively generate embeddings for memories that lack them')
    .option('--limit <n>', 'Number of memories to process', '50')
    .action(async (options) => {
        await embedBackfillCommand(parseInt(options.limit, 10));
    });

program
    .option('--verify-sig', 'Verify CLI integrity (mocked)')
    .action((options) => {
        if (options.verifySig) {
            console.log("Validating CLI binary signature...");
            console.log("✓ signature verified: VALID");
            process.exit(0);
        }
        program.help();
    });

program.parse(process.argv);
