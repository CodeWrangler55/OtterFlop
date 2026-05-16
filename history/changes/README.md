# history/changes/

Active change proposals live here. Each change is a self-contained folder created for a scoped implementation slice.

## Directory Structure

```text
history/changes/<name>/
|- proposal.vbrief.json
|- tasks.vbrief.json
\- specs/
```

## Lifecycle

1. Create a scoped change folder.
2. Record the problem, approach, scope, and risks in `proposal.vbrief.json`.
3. Record implementation tasks in `tasks.vbrief.json`.
4. Get user approval before cross-cutting implementation.
5. Implement and verify the change.
6. Archive it when the work is complete.

## Rules

- Keep one active change per implementation slice unless the user explicitly wants more.
- Keep the proposal and task list aligned with the real work.
- Treat archived changes as read-only history.
