---
name: to-spec
description: "Turn the current conversation into a spec: no interview, just synthesis of what you've already discussed. Save to local Markdown unless an issue tracker is already specified."
disable-model-invocation: true
license: MIT; see LICENSE
metadata:
  source: https://github.com/mattpocock/skills/tree/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/to-spec
---

This skill takes the current conversation context and codebase understanding and produces a spec. Do NOT interview the user; just synthesize what you already know. It is a natural follow-up to grilling, but does not require another skill. Record decisions already made, not new ones invented to fill the template. If a material decision is still unresolved, flag it explicitly rather than silently deciding it.

## Output

If the user or project instructions already specify an issue tracker for this work, publish there using the available tooling and the project's own conventions. Do not require a setup skill or assume any triage labels. If tracker access is unavailable, explain the limitation and save a local draft instead; do not claim it was published.

Otherwise, save Markdown to `tmp/<descriptive-slug>-spec.md` under the target project's root, not this skill's directory. Create `tmp/` if needed. In a Git repository, ensure the root `tmp/` directory is ignored: use `git check-ignore` to check, and add `/tmp/` to the root `.gitignore` if needed, preserving existing entries. Do not untrack existing files. Do not overwrite an unrelated spec; choose a distinct filename. Report the saved path or published issue URL when done.

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already. Use the project's domain glossary vocabulary where available, and respect any ADRs in the area you're touching. Neither a glossary nor ADRs are required.

2. Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can. The fewer seams across the codebase, the better - the ideal number is one.

Check with the user that these seams match their expectations. Use `ask_questions` if available, otherwise ask in prose. Wait for confirmation before writing the spec. This focused confirmation is not a fresh requirements interview.

3. Write the spec using the template below, then save or publish it as described above. Do not start implementation or create implementation tickets.

<spec-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this spec.

## Further Notes

Any further notes about the feature.

</spec-template>
