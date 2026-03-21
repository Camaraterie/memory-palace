---
description: Store current session as a Memory Palace memory
allowed-tools: ["mcp__memory-palace__palace_store", "mcp__memory-palace__palace_room_match"]
---

Store a memory of the current session in the Memory Palace.

Review the conversation so far and construct a structured memory payload:

1. **session_name**: Generate a concise, descriptive name for this session's work
2. **outcome**: Summarize what was accomplished in 1-2 sentences
3. **built**: List the concrete things created, modified, or implemented
4. **decisions**: List key design or architectural decisions made
5. **next_steps**: List logical follow-up work
6. **files**: List files that were changed or created
7. **blockers**: List any unresolved issues or blockers
8. **room**: If files were modified in a governed area, include the room slug

If the user provides specific details via $ARGUMENTS, incorporate those. Otherwise, synthesize from the conversation.

Before storing, present the payload to the user for confirmation. Then call `palace_store` with the confirmed payload.
