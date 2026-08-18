# dECODED

Local CLI that shrinks coding-agent context. The Next.js site in `web/` is unchanged.

The old Python Groq/OpenRouter proxy was removed from the working tree (git history still has it). The replacement is an npm CLI: compress + WAL, Cursor hooks, a project skeleton map, and a pass-through proxy that does **not** remap models.

```bash
npm i -g decoded
decoded init
```
