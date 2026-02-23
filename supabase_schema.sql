-- Create Palaces table
CREATE TABLE palaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  uuid_api_key uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  public_key text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Memories table
CREATE TABLE memories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  short_id text UNIQUE NOT NULL,
  palace_id uuid REFERENCES palaces(id) ON DELETE CASCADE,
  agent text,
  image_url text,
  ciphertext text,
  signature text,
  algorithm text DEFAULT 'HMAC-SHA256',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup by short_id
CREATE INDEX idx_memories_short_id ON memories(short_id);
-- Index for fetching recent palace memories
CREATE INDEX idx_memories_palace_id ON memories(palace_id);

-- Agents table: per-agent guest keys for delegated memory access
CREATE TABLE agents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  palace_id text REFERENCES palaces(id) ON DELETE CASCADE NOT NULL,
  agent_name text NOT NULL,
  guest_key text UNIQUE NOT NULL,
  permissions text NOT NULL DEFAULT 'read',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  revoked_at timestamptz,
  UNIQUE (palace_id, agent_name)
);

-- Index for fast guest key lookups (auth path)
CREATE INDEX idx_agents_guest_key ON agents(guest_key);
-- Index for listing agents by palace
CREATE INDEX idx_agents_palace_id ON agents(palace_id);
