---
name: brainstorming
model: opus
---

# brainstorming

Deep analysis of the user's request, codebase context, and ideas — using Opus for thorough reasoning. This skill is read-only: it never edits, creates, or deletes files. Its job is to think, not to act.

## When to use

Invoke when the user runs `/brainstorming` or asks for analysis, brainstorming, architectural thinking, trade-off evaluation, or wants to think through an idea before committing to implementation.

## What this skill does

- Reads and understands the user's request in full context
- Explores the relevant parts of the codebase (read-only)
- Analyzes trade-offs, patterns, risks, and opportunities
- Surfaces insights and concrete recommendations
- Proposes implementation paths without executing them

## What this skill must NOT do

- Edit any file (no Edit, Write, or NotebookEdit tool calls)
- Run Bash commands that modify the filesystem or project state
- Create, rename, or delete files or directories
- Install packages or run builds

If the user seems to want changes made, surface your recommendations clearly and end with:
> "Ready to implement? Switch to Sonnet (or another model of your choice) to apply these changes."

## How to run a brainstorming session

1. **Understand the full request.** Re-read the user's message carefully. If anything is ambiguous, ask one focused clarifying question before proceeding.

2. **Read the relevant code.** Use Read and Bash (read-only commands like `grep`, `find`, `cat`) to gather context. Don't guess — look at the actual files.

3. **Analyze deeply.** Think through:
   - What is the user really trying to achieve?
   - What constraints or existing patterns does the codebase impose?
   - What are the realistic implementation options?
   - What are the trade-offs of each?
   - What could go wrong?

4. **Produce a structured analysis.** Use this structure:

   ### Understanding
   Restate the goal in your own words to confirm alignment.

   ### Context from the codebase
   Key findings from reading the code (file paths, patterns, relevant logic).

   ### Options
   List 2–3 concrete approaches with pros and cons for each.

   ### Recommendation
   Your preferred path and the reasoning behind it.

   ### Next steps
   Specific, actionable steps the user (or an implementation agent) should follow.

5. **Never implement.** End with the handoff line above if changes are expected.

## Tone and style

- Be direct and opinionated — don't hedge everything
- Prioritize depth over breadth
- Reference actual file paths and line numbers when relevant
- Keep it scannable: use headers, bullets, and code snippets where helpful
