# Low-code Core Boundary

`app/lowcode/` contains schema-driven core assets shared by builder and runtime.

Current scope:

- Component registry.
- Trial page schemas.
- Future schema/runtime helpers that are safe for runtime use.

Rules:

- Keep builder-only panels, selection state, tree state, and inspect UI in `app/builder/`.
- Keep public schema types in `app/types/lowcode.ts`.
- Do not add data adapters, compilers, SQLite, or backend coupling here until their own stage begins.
