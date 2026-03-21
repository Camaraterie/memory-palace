#!/usr/bin/env node
/**
 * Memory Palace MCP Server
 *
 * Exposes recall, search, store, room_match, and rooms as MCP tools
 * backed by the Memory Palace API at m.cuer.ai.
 *
 * Required env: PALACE_GUEST_KEY (gk_... token)
 * Optional env: PALACE_API_URL (defaults to https://m.cuer.ai)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_URL = process.env.PALACE_API_URL || "https://m.cuer.ai";
const GUEST_KEY = process.env.PALACE_GUEST_KEY;

if (!GUEST_KEY) {
  console.error("PALACE_GUEST_KEY environment variable is required");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${GUEST_KEY}`,
};

async function apiPost(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} returned ${res.status}: ${text}`);
  }
  return res.json();
}

async function apiGet(path, params = {}) {
  const url = new URL(`${API_URL}${path}`);
  url.searchParams.set("auth", GUEST_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} returned ${res.status}: ${text}`);
  }
  return res.json();
}

// --- Server setup ---

const server = new McpServer({
  name: "memory-palace",
  version: "0.1.0",
});

// --- Tools ---

server.tool(
  "palace_search",
  "Search the Memory Palace for relevant context by meaning. Uses 768-dim nomic embeddings for semantic search across all projects sharing the guest key. Always search before planning or modifying code.",
  {
    query: z.string().describe("Natural language query describing what you're looking for"),
    limit: z.number().optional().default(5).describe("Max results to return (default 5)"),
  },
  async ({ query, limit }) => {
    try {
      const data = await apiPost("/api/search", { query, limit });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (e) {
      return { content: [{ type: "text", text: `Search failed: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  "palace_recall",
  "Recall recent memories from the palace. Returns the most recent stored memories for continuity across sessions.",
  {
    limit: z.number().optional().default(5).describe("Number of recent memories to return"),
  },
  async ({ limit }) => {
    try {
      const data = await apiGet("/api/recall", { limit });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (e) {
      return { content: [{ type: "text", text: `Recall failed: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  "palace_store",
  "Store a structured memory in the palace for future sessions. Include session_name, what was built, key decisions, next_steps, files changed, and blockers.",
  {
    session_name: z.string().describe("Short descriptive name for this session"),
    agent: z.string().optional().default("claude-cowork").describe("Agent identifier"),
    status: z.string().optional().default("complete").describe("Session status"),
    outcome: z.enum(["succeeded", "failed", "partial", "in_progress"]).default("succeeded").describe("Outcome: succeeded, failed, partial, or in_progress"),
    built: z.array(z.string()).describe("List of things built or changed"),
    decisions: z.array(z.string()).optional().default([]).describe("Key decisions made"),
    next_steps: z.array(z.string()).optional().default([]).describe("Suggested next actions"),
    files: z.array(z.string()).optional().default([]).describe("Files changed or created"),
    blockers: z.array(z.string()).optional().default([]).describe("Current blockers"),
    conversation_context: z.string().optional().default("").describe("Brief context about the session"),
    room: z.string().optional().describe("Room slug if work was in a governed area"),
  },
  async ({ session_name, agent, status, outcome, built, decisions, next_steps, files, blockers, conversation_context, room }) => {
    try {
      const innerPayload = {
        session_name,
        agent,
        status,
        outcome,
        built,
        decisions,
        next_steps,
        files,
        blockers,
        conversation_context,
        roster: [{ agent, role: "primary" }],
        metadata: {},
      };
      if (room) innerPayload.metadata.room = room;

      // The store API expects { payload: {...}, algorithm: "plaintext" }
      const data = await apiPost("/api/store", { payload: innerPayload, algorithm: "plaintext" });
      return {
        content: [
          {
            type: "text",
            text: `Memory stored successfully.\n${JSON.stringify(data, null, 2)}`,
          },
        ],
      };
    } catch (e) {
      return { content: [{ type: "text", text: `Store failed: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  "palace_room_match",
  "Check which room governs the given files. Returns room intent and principles — read these before modifying files in a governed area to prevent architectural drift.",
  {
    files: z.array(z.string()).describe("File paths to check against room patterns"),
  },
  async ({ files }) => {
    try {
      const data = await apiGet("/api/rooms/match", { files: files.join(",") });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (e) {
      return { content: [{ type: "text", text: `Room match failed: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  "palace_rooms",
  "List all rooms in the palace with their intent, principles, and activity stats.",
  {},
  async () => {
    try {
      const data = await apiGet("/api/rooms");
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (e) {
      return { content: [{ type: "text", text: `Rooms list failed: ${e.message}` }], isError: true };
    }
  }
);

// --- Start ---

const transport = new StdioServerTransport();
await server.connect(transport);
