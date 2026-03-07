import { NextResponse } from 'next/server'
import { Client } from 'pg'

export async function POST(req) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()

    // Add owner_id to palaces
    await client.query(`ALTER TABLE palaces ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);`)

    // Enable RLS
    await client.query(`ALTER TABLE palaces ENABLE ROW LEVEL SECURITY;`)
    await client.query(`ALTER TABLE memories ENABLE ROW LEVEL SECURITY;`)

    // Create Policies for palaces
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'palaces' AND policyname = 'Users can manage their own palaces'
        ) THEN
            CREATE POLICY "Users can manage their own palaces"
            ON palaces FOR ALL
            TO authenticated
            USING (auth.uid() = owner_id)
            WITH CHECK (auth.uid() = owner_id);
        END IF;
      END
      $$;
    `)

    // Create Policies for memories
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'memories' AND policyname = 'Users can manage memories in their own palaces'
        ) THEN
            CREATE POLICY "Users can manage memories in their own palaces"
            ON memories FOR ALL
            TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM palaces WHERE palaces.id = memories.palace_id AND palaces.owner_id = auth.uid()
              )
            )
            WITH CHECK (
              EXISTS (
                SELECT 1 FROM palaces WHERE palaces.id = memories.palace_id AND palaces.owner_id = auth.uid()
              )
            );
        END IF;
      END
      $$;
    `)

    // Add public_key to palaces
    await client.query(`ALTER TABLE palaces ADD COLUMN IF NOT EXISTS public_key text;`);

    // Modify memories table
    await client.query(`
            ALTER TABLE memories
            ADD COLUMN IF NOT EXISTS ciphertext text,
            ADD COLUMN IF NOT EXISTS signature text,
            ADD COLUMN IF NOT EXISTS algorithm text DEFAULT 'HMAC-SHA256',
            ADD COLUMN IF NOT EXISTS personas text[];
        `);

    // Drop old columns from memories
    const dropCols = [
      'built', 'decisions', 'next_steps', 'files', 'blockers',
      'conversation_context', 'roster', 'metadata', 'version',
      'character', 'session', 'status', 'outcome', 'prev', 'next',
      'skill_url', 'image_prompt'
    ];

    for (const col of dropCols) {
      try {
        await client.query(`ALTER TABLE memories DROP COLUMN IF EXISTS ${col};`);
      } catch (e) { }
    }

    // Enable RLS on agents, blog_posts, personas
    await client.query(`ALTER TABLE agents ENABLE ROW LEVEL SECURITY;`)
    await client.query(`ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;`)
    await client.query(`ALTER TABLE personas ENABLE ROW LEVEL SECURITY;`)

    // agents RLS policies
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Users can manage agents in their own palaces'
        ) THEN
            CREATE POLICY "Users can manage agents in their own palaces"
            ON agents FOR ALL
            TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM palaces WHERE palaces.id::text = agents.palace_id AND palaces.owner_id = auth.uid()
              )
            )
            WITH CHECK (
              EXISTS (
                SELECT 1 FROM palaces WHERE palaces.id::text = agents.palace_id AND palaces.owner_id = auth.uid()
              )
            );
        END IF;
      END
      $$;
    `)

    // blog_posts RLS policies
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'Anyone can read published posts'
        ) THEN
            CREATE POLICY "Anyone can read published posts"
            ON blog_posts FOR SELECT
            TO anon, authenticated
            USING (status = 'published');
        END IF;
      END
      $$;
    `)

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'Users can manage posts in their own palaces'
        ) THEN
            CREATE POLICY "Users can manage posts in their own palaces"
            ON blog_posts FOR ALL
            TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM palaces WHERE palaces.id::text = blog_posts.palace_id AND palaces.owner_id = auth.uid()
              )
            )
            WITH CHECK (
              EXISTS (
                SELECT 1 FROM palaces WHERE palaces.id::text = blog_posts.palace_id AND palaces.owner_id = auth.uid()
              )
            );
        END IF;
      END
      $$;
    `)

    // personas RLS policies
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'personas' AND policyname = 'Users can manage personas in their own palaces'
        ) THEN
            CREATE POLICY "Users can manage personas in their own palaces"
            ON personas FOR ALL
            TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM palaces WHERE palaces.id::text = personas.palace_id AND palaces.owner_id = auth.uid()
              )
            )
            WITH CHECK (
              EXISTS (
                SELECT 1 FROM palaces WHERE palaces.id::text = personas.palace_id AND palaces.owner_id = auth.uid()
              )
            );
        END IF;
      END
      $$;
    `)

    // Add visual_prompt to personas table
    await client.query(`ALTER TABLE personas ADD COLUMN IF NOT EXISTS visual_prompt text;`)

    // pgvector extension (Supabase supports natively)
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`)

    // Rooms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        palace_id uuid NOT NULL REFERENCES palaces(id) ON DELETE CASCADE,
        slug text NOT NULL,
        name text NOT NULL,
        intent text,
        principles text[] DEFAULT '{}',
        decisions jsonb DEFAULT '[]',
        file_patterns text[] DEFAULT '{}',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(palace_id, slug)
      );
    `)
    await client.query(`ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;`)

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'rooms' AND policyname = 'Users can manage rooms in their own palaces'
        ) THEN
            CREATE POLICY "Users can manage rooms in their own palaces"
            ON rooms FOR ALL
            TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM palaces WHERE palaces.id = rooms.palace_id AND palaces.owner_id = auth.uid()
              )
            )
            WITH CHECK (
              EXISTS (
                SELECT 1 FROM palaces WHERE palaces.id = rooms.palace_id AND palaces.owner_id = auth.uid()
              )
            );
        END IF;
      END
      $$;
    `)

    // New columns on memories
    await client.query(`ALTER TABLE memories ADD COLUMN IF NOT EXISTS room_slug text;`)
    await client.query(`ALTER TABLE memories ADD COLUMN IF NOT EXISTS embedding vector(768);`)

    // HNSW index (works with zero rows, better recall than IVFFlat)
    await client.query(`
      CREATE INDEX IF NOT EXISTS memories_embedding_hnsw_idx
        ON memories USING hnsw (embedding vector_cosine_ops);
    `)

    // Backfill room_slug from existing plaintext payloads
    await client.query(`
      UPDATE memories
      SET room_slug = (ciphertext::jsonb -> 'metadata' ->> 'room')
      WHERE room_slug IS NULL
        AND ciphertext IS NOT NULL
        AND ciphertext LIKE '{%'
        AND (ciphertext::jsonb -> 'metadata' ->> 'room') IS NOT NULL;
    `)

    await client.query("NOTIFY pgrst, 'reload schema';")

    return NextResponse.json({ success: true, message: 'Migrations applied successfully' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    await client.end()
  }
}
