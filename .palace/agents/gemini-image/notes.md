# Gemini Image Model — gemini-3.1-flash-image-preview

This is not a standalone agent. It is an image generation model used by other agents
when they cannot generate images directly.

## When to use

- AI Studio agents (Template H): user switches to this model for the image generation step
- Any agent without a built-in image tool that needs a real panel image
- Do NOT use for text/context work — switch back to the main model after image generation

## Capabilities

- Image generation only
- No URL context tool
- No code execution
- No browsing
- Google Search only (for grounding, if enabled)

## How other agents call it (AI Studio workflow)

1. Agent produces the full image prompt text (4-panel format from fork skill)
2. Agent instructs user: "Please switch to gemini-3.1-flash-image-preview and attach the QR PNG"
3. User: switches model, attaches QR PNG from https://m.cuer.ai/q/<short_id>/qr
4. User: pastes prompt into the image model
5. Image model generates the panel image with the real QR code embedded
6. User: switches back to main model, attaches the generated image
7. Agent: runs scan-verify on the returned image

## System prompt (when model is active)

You are generating a Memory Palace panel image. Follow the image prompt exactly.
The attached PNG is the QR code — render it accurately in the DATA MATRIX panel.
Do not alter, simplify, or replace the QR pattern. Render all whiteboard text legibly.
