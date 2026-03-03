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

-- Blog posts table
CREATE TABLE blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  palace_id uuid REFERENCES palaces(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  content text NOT NULL,
  excerpt text,
  author_persona text DEFAULT 'curator',
  cover_image text,
  status text NOT NULL DEFAULT 'draft',
  tags text[] DEFAULT '{}',
  source_memories text[] DEFAULT '{}',
  show_provenance boolean DEFAULT false,
  social_variants jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_palace_id ON blog_posts(palace_id);

-- Personas table (scaffold)
CREATE TABLE personas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  palace_id uuid REFERENCES palaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  focus_areas text[] DEFAULT '{}',
  tone text,
  system_prompt text,
  avatar_description text,
  guest_key_id uuid REFERENCES agents(id),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_personas_palace_id ON personas(palace_id);
