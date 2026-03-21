---
description: List palace rooms or check room governance for files
allowed-tools: ["mcp__memory-palace__palace_rooms", "mcp__memory-palace__palace_room_match"]
---

If $ARGUMENTS contains file paths, call `palace_room_match` with those files to check which rooms govern them. Show the room intent and principles for each match.

If $ARGUMENTS is empty or contains a general query, call `palace_rooms` to list all rooms. Present each room with:
- Slug and name
- Intent (why it exists)
- Principles (hard constraints)
- Memory count and last activity

Remind the user that room principles are hard constraints — any code changes in governed areas must respect them.
