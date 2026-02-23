#!/usr/bin/env node
/**
 * migrate_agents.js
 * Creates the `agents` table for Per-Agent Guest Keys architecture.
 * Run once: node migrate_agents.js
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sql = `
-- Agents table: per-agent guest keys for delegated memory access
CREATE TABLE IF NOT EXISTS agents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    palace_id uuid REFERENCES palaces(id) ON DELETE CASCADE NOT NULL,
    agent_name text NOT NULL,
    guest_key text UNIQUE NOT NULL,
    permissions text NOT NULL DEFAULT 'read',
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL,
    revoked_at timestamptz,
    UNIQUE (palace_id, agent_name)
);

-- Index for fast guest key lookups (auth path)
CREATE INDEX IF NOT EXISTS idx_agents_guest_key ON agents(guest_key);

-- Index for listing agents by palace
CREATE INDEX IF NOT EXISTS idx_agents_palace_id ON agents(palace_id);
`

async function migrate() {
    console.log('Running agents table migration...')
    const { error } = await supabase.rpc('exec_sql', { query: sql }).catch(() => ({ error: null }))

    // Try direct query if RPC not available
    const { error: err2 } = await supabase.from('agents').select('id').limit(1)
    if (!err2) {
        console.log('agents table already exists — migration skipped.')
        return
    }

    console.log('Paste this SQL into the Supabase SQL editor to create the agents table:\n')
    console.log(sql)
    console.log('\nOr use the Supabase dashboard > SQL editor.')
}

migrate()
