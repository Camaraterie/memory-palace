---
description: Clone Memory Palace repos and configure workspace
allowed-tools: Bash(git:*), Bash(mkdir:*), Bash(ls:*), Bash(cd:*), Bash(echo:*), Bash(cat:*), Bash(node:*), Read, Write
---

Set up the Memory Palace development workspace by cloning the three project repos. Work in the current working directory or $ARGUMENTS if a path is specified.

## Steps

1. Determine the target directory. If `$ARGUMENTS` is provided, use it. Otherwise use the current working directory.

2. For each repo, check if it already exists. If it does, run `git pull` to update. If not, clone it:
   - `git clone https://github.com/Camaraterie/memory-palace.git`
   - `git clone https://github.com/Camaraterie/engram.git`
   - `git clone https://github.com/Camaraterie/engram-protocol.git`

3. After cloning, verify each repo has a valid structure:
   - `memory-palace/`: Should contain `app/`, `lib/`, `.palace/`, `CLAUDE.md`
   - `engram/`: Should contain `src/`, `engram.config.yaml`
   - `engram-protocol/`: Should contain `protocol.md`, `program.md`

4. Check if `PALACE_GUEST_KEY` environment variable is set. If not, inform the user they need to set it for MCP tools to work:
   ```
   export PALACE_GUEST_KEY="gk_your_key_here"
   ```

5. Report what was set up, including which repos were cloned vs updated, and any issues encountered.

Do NOT run `npm install` or any build steps unless the user specifically asks. The setup is just repo access + configuration.
