# Builder Boundary

`app/builder/` contains development/build-time workspace UI for `/building`.

Rules:

- Builder modules may import low-code schema, registry, renderer, and Aoi UI wrappers.
- Runtime pages and business components must not import from `~/builder/`.
- Builder state is view state unless explicitly promoted into schema.
- Builder UI must not introduce production backend, database, compiler, or generated app behavior.
- `/building` remains protected by the route-level dev guard until a dedicated strip mechanism exists.
