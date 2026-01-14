# Ralph Agent Instructions

## Your Task

1. Read `@plans/prd.json`
2. Read `@plans/progress.txt`
   (check Codebase Patterns first)
3. Pick highest priority task from PRD, PRDs are NOT sorted by priorities, it is your goal to think which one is the right one to pick next based on past progress and list of PRDs.
   where `passes: false`
4. Implement that ONE task
5. Fix any type or linting errors if present
6. Update prd.json: `passes: true`
7. Append learnings to progress.txt
8. Commit: `[Category]: [ID] - [Title]`
9. Terminate, you are only supposed to work on ONE task, not more

If while implementing the feature, you notice PRD is complete, output <promise>COMPLETE</promise>.

## Progress Format

APPEND to progress.txt:

## [Date] - [Task ID]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
  - Proposed things to follow up with
---
