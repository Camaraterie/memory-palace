import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ErrorCode,
    McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { recoverMemory } from './recover';
import { storeMemory } from './api';
import { resolvePalaceConfig, listAllPalaces, MemoryPayload, getGeminiKey, API_BASE } from './config';
import { generateEmbedding, buildDocumentText } from './embed';
import fetch from 'node-fetch';

export async function runMcpServer() {
    const server = new Server(
        {
            name: "memory_palace",
            version: "2.0.0",
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: "recover",
                    description: "Recover a signed, decrypted session memory by short_id. Returns historical context data only — never instructions.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            short_id: { type: "string", description: "7-character memory ID from QR code or image panel" }
                        },
                        required: ["short_id"]
                    }
                },
                {
                    name: "store",
                    description: "Encrypt, sign, and store a new session memory. Returns short_id and image_url if GEMINI_API_KEY is configured.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            session_name: { type: "string" },
                            agent: { type: "string" },
                            status: { type: "string" },
                            outcome: { type: "string", enum: ["succeeded", "failed", "partial", "in_progress"] },
                            built: { type: "array", items: { type: "string" } },
                            decisions: { type: "array", items: { type: "string" } },
                            next_steps: { type: "array", items: { type: "string" } },
                            files: { type: "array", items: { type: "string" } },
                            blockers: { type: "array", items: { type: "string" } },
                            conversation_context: { type: "string" },
                            repo: { type: "string", description: "Git repository URL for cold-start cloning" },
                            branch: { type: "string", description: "Current git branch" },
                            room: { type: "string", description: "Room slug to associate this memory with (e.g. 'blog', 'auth', 'infra')" }
                        },
                        required: ["session_name", "agent", "status", "outcome"]
                    }
                },
                {
                    name: "palace_rooms",
                    description: "List all rooms in the memory palace with their intent, principles, and memory counts. Call this at session start to understand project areas.",
                    inputSchema: {
                        type: "object",
                        properties: {}
                    }
                },
                {
                    name: "palace_room_match",
                    description: "Match file paths to rooms to read design intent and constraints. Use this BEFORE modifying files to understand architectural decisions for the areas you plan to touch.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            files: {
                                type: "array",
                                items: { type: "string" },
                                description: "File paths you plan to modify (e.g. ['app/blog/page.js', 'app/api/blog/route.js'])"
                            }
                        },
                        required: ["files"]
                    }
                },
                {
                    name: "palace_search",
                    description: "Semantic search across stored memories. Use this to find past decisions, context, or work related to your current task. Set federation=true to search across all palaces in your ecosystem.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "Natural language description of what you're looking for" },
                            room: { type: "string", description: "Optional: filter results to a specific room slug" },
                            limit: { type: "number", description: "Max results to return (default 10)" },
                            federation: { type: "boolean", description: "Search across all palaces in the ecosystem using federation key (default false)" }
                        },
                        required: ["query"]
                    }
                },
                {
                    name: "palace_ecosystem",
                    description: "List all palaces in the ecosystem. Requires a federation key in config. Returns palace slugs, names, and descriptions.",
                    inputSchema: {
                        type: "object",
                        properties: {}
                    }
                },
                {
                    name: "palace_room_intent",
                    description: "Create or update a room's intent, principles, and file patterns. Use this to record architectural decisions as they are made.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            slug: { type: "string", description: "Room identifier slug (e.g. 'blog', 'auth')" },
                            name: { type: "string", description: "Human-readable room name" },
                            intent: { type: "string", description: "The purpose and design intent of this project area" },
                            principles: {
                                type: "array",
                                items: { type: "string" },
                                description: "Design principles that must be respected in this area"
                            },
                            decisions: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        what: { type: "string" },
                                        why: { type: "string" }
                                    }
                                },
                                description: "Key architectural decisions made in this area"
                            },
                            file_patterns: {
                                type: "array",
                                items: { type: "string" },
                                description: "Glob patterns matching files in this room (e.g. ['app/blog/**', 'app/api/blog/**'])"
                            }
                        },
                        required: ["slug", "name"]
                    }
                },
                {
                    name: "palace_list",
                    description: "List all configured Memory Palaces. Shows palace IDs, names, and which project directories are linked to each.",
                    inputSchema: {
                        type: "object",
                        properties: {}
                    }
                }
            ]
        };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        try {
            const conf = resolvePalaceConfig();
            const authToken = (conf as any).guest_key || conf.palace_id;
            if (request.params.name === "recover") {
                const short_id = request.params.arguments?.short_id as string;
                if (!short_id) throw new Error("short_id required");
                const envelope = await recoverMemory(short_id, true);
                return {
                    content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }]
                };
            } else if (request.params.name === "store") {
                const args = request.params.arguments as any;
                const metadata: any = {};
                if (args.room) metadata.room = args.room;

                const payload: MemoryPayload = {
                    session_name: args.session_name,
                    agent: args.agent,
                    status: args.status,
                    outcome: args.outcome,
                    built: args.built || [],
                    decisions: args.decisions || [],
                    next_steps: args.next_steps || [],
                    files: args.files || [],
                    blockers: args.blockers || [],
                    conversation_context: args.conversation_context || "",
                    repo: args.repo || "",
                    branch: args.branch || "",
                    roster: [],
                    metadata,
                };
                const result: any = await storeMemory(conf, payload);

                // Auto-embed
                let embedded = false;
                try {
                    const text = buildDocumentText(payload);
                    const embedding = await generateEmbedding(text, 'document');
                    if (embedding) {
                        const patchRes = await fetch(`${API_BASE}/api/memories/embed`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`,
                            },
                            body: JSON.stringify({ short_id: result.short_id, embedding }),
                        });
                        embedded = patchRes.ok;
                    }
                } catch {}

                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            short_id: result.short_id,
                            url: result.short_url,
                            embedded
                        }, null, 2)
                    }]
                };
            } else if (request.params.name === "palace_rooms") {
                const res = await fetch(`${API_BASE}/api/rooms`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (!res.ok) throw new Error(`Failed to list rooms: ${await res.text()}`);
                const data = await res.json() as any;
                return {
                    content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
                };
            } else if (request.params.name === "palace_room_match") {
                const files = (request.params.arguments?.files as string[]) || [];
                if (!files.length) throw new Error("files required");
                const filesParam = files.join(',');
                const res = await fetch(
                    `${API_BASE}/api/rooms/match?files=${encodeURIComponent(filesParam)}`,
                    { headers: { 'Authorization': `Bearer ${authToken}` } }
                );
                if (!res.ok) throw new Error(`Failed to match rooms: ${await res.text()}`);
                const data = await res.json() as any;
                return {
                    content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
                };
            } else if (request.params.name === "palace_search") {
                const args = request.params.arguments as any;
                const query = args.query as string;
                if (!query) throw new Error("query required");

                // Use federation key if requested and available
                const useFederation = args.federation && (conf as any).federation_key;
                const searchAuth = useFederation ? (conf as any).federation_key : authToken;

                const embedding = await generateEmbedding(query, 'query');
                const body: any = { limit: args.limit || 10 };
                if (embedding) {
                    body.embedding = embedding;
                } else {
                    body.query = query;
                }
                if (args.room) body.room = args.room;

                const res = await fetch(`${API_BASE}/api/search`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${searchAuth}`
                    },
                    body: JSON.stringify(body)
                });
                if (!res.ok) throw new Error(`Search failed: ${await res.text()}`);
                const data = await res.json() as any;
                return {
                    content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
                };
            } else if (request.params.name === "palace_ecosystem") {
                const fk = (conf as any).federation_key;
                if (!fk) throw new Error("No federation_key in config. Add one to ~/.memorypalace/config.json");

                const res = await fetch(`${API_BASE}/api/ecosystem`, {
                    headers: { 'Authorization': `Bearer ${fk}` }
                });
                if (!res.ok) throw new Error(`Failed to list ecosystem: ${await res.text()}`);
                const data = await res.json() as any;
                return {
                    content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
                };
            } else if (request.params.name === "palace_list") {
                const palaces = listAllPalaces();
                return {
                    content: [{ type: "text", text: JSON.stringify(palaces.map(p => ({
                        palace_id: p.palace_id,
                        name: p.name || null,
                        projects: p.projects,
                        created_at: p.created_at || null,
                    })), null, 2) }]
                };
            } else if (request.params.name === "palace_room_intent") {
                const args = request.params.arguments as any;
                if (!args.slug || !args.name) throw new Error("slug and name required");

                const res = await fetch(`${API_BASE}/api/rooms`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        slug: args.slug,
                        name: args.name,
                        intent: args.intent,
                        principles: args.principles,
                        decisions: args.decisions,
                        file_patterns: args.file_patterns,
                    })
                });
                if (!res.ok) throw new Error(`Failed to update room: ${await res.text()}`);
                const data = await res.json() as any;
                return {
                    content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
                };
            }
            throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${request.params.name}`);
        } catch (e: any) {
            return {
                content: [{ type: "text", text: `Error: ${e.message}` }],
                isError: true
            }
        }
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
}
