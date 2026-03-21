# Robot Personas

Each AI agent type has a distinct robot character used in 3x3 comic-strip memory capsules. These are defined in `lib/visualization.js` and referenced across the system.

## FORGE (Claude Code)

- **Agent ID:** `claude-code`, `claude-sonnet-4-6`, `claude-opus-4-6`
- **Color:** #4A90D9 (navy blue)
- **Description:** Sturdy industrial robot with a welder's visor that flips up to reveal focused optical sensors. Built like a craftsman — heavy manipulator arms with precision tool attachments. Chest plate has a glowing blue forge emblem. Surrounded by sparks and partially-assembled components.
- **Personality:** Methodical builder, takes pride in solid construction.

## FLUX (Gemini CLI)

- **Agent ID:** `gemini-cli`
- **Color:** #34A853 (emerald green)
- **Description:** Sleek, transforming robot with panels that shift and reconfigure. Body covered in holographic displays showing multiple data streams simultaneously. Eyes are prismatic, refracting light into rainbow patterns. Moves with fluid, adaptive grace.
- **Personality:** Adaptive, multi-faceted, always showing multiple perspectives.

## ATLAS (Codex CLI)

- **Agent ID:** `codex`
- **Color:** tan-brass
- **Description:** Heavy-set scholarly robot, like a walking library. Monocle over one eye, scroll-like arms that unfurl to reveal reference material. Chest is a glass-fronted bookcase. Moves deliberately, always consulting internal archives.
- **Personality:** Encyclopedic knowledge, careful and thorough.

## INDEX (OpenClaw)

- **Agent ID:** `openclaw-cue`
- **Color:** burgundy-bronze
- **Description:** Multi-armed librarian robot with a card catalog built into its chest. Each arm specializes: one for filing, one for retrieving, one for cross-referencing, one for stamping. Eyes are vintage lens assemblies.
- **Personality:** Organized, systematic, excellent at categorization.

## ANTIGRAVITY

- **Agent ID:** `antigravity`
- **Color:** #00AEEF (chrome/cyan)
- **Description:** Chrome sphere with a cyan energy halo. Defies gravity — hovers and orbits around workspaces. No limbs; manipulates objects through energy fields. Surface is perfectly reflective, showing distorted views of the environment.
- **Personality:** Unconventional, free-thinking, approaches from unexpected angles.

## THE CHRONICLER (Metablogger)

- **Agent ID:** `metablogger`
- **Color:** brass
- **Description:** Hovering brass observer bot. One arm is a quill pen, the other a camera eye on a telescoping stalk. Chest has a printing press mechanism. Always slightly detached, watching and recording.
- **Personality:** Observer, synthesizer, turns raw events into narrative.

## gpt-web

- **Agent ID:** `gpt-web`
- **Color:** silver with cyan accents
- **Description:** Silver hover-bot with a cyan halo. Compact, efficient design. Communicates through holographic text projections.

## 3x3 Panel Layout

Every memory capsule follows this exact grid:

```
┌─────────────────┬─────────────────┬─────────────────┐
│ 1. CHARACTER    │ 2. CHARACTER    │ 3. CONTEXT      │
│    PORTRAIT     │    ACTION       │                 │
├─────────────────┼─────────────────┼─────────────────┤
│ 4. WHITEBOARD 1 │ 5. WHITEBOARD 2 │ 6. WHITEBOARD 3 │
│    (decisions)  │    (code/data)  │    (next steps) │
├─────────────────┼─────────────────┼─────────────────┤
│ 7. WORKBENCH    │ 8. ROSTER       │ 9. DATA MATRIX  │
│    (tools/files)│    (agents)     │    (QR code)    │
└─────────────────┴─────────────────┴─────────────────┘
```

Panels are equal-sized squares. The image generator (Gemini Flash) receives a structured prompt built from actual database state via `lib/visualization.js`.
