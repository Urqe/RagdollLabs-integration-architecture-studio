# Implementation Roadmap

## First-run demo experience — explicit product requirement

On first launch, show a complete, **fictional and editable** example architecture by default.
The sample must illustrate traditional SAP / iPaaS interfaces alongside AI agent tool access,
include explanatory metadata, and expose intentional design gaps that the validation engine
can explain. It must never imply connection to real systems. Existing user projects must not
be silently overwritten on a subsequent visit. Provide a clearly labeled “Restore example”
action, a future “Start blank” action, and a guided walkthrough once the core editor is stable.

**Status:** Example data and restore action already exist. A guided walkthrough, starter
templates, and browser-level onboarding tests remain planned.

## Milestone 1 — Editor usefulness and reusable assets (in progress)

- Reusable component templates for SAP, D365, Workato, Azure and generic services.
- First-class capability catalog with ownership, operations, access and evidence provenance.
- Preserve legacy projects during introduction of new optional schema fields.
- Correct node position handling so non-movement UI events do not mutate the project.
- Add capability editing and export, with unit tests.
- Next: map interfaces to specific capabilities, expand rule coverage, add undo/redo,
  browser end-to-end tests, and resolve reported dependency advisories.


## v0.1 — Useful offline modeling

1. Define domain TypeScript types and Zod schemas with fixtures.
2. Build project commands, identity/reference integrity, save/load and migration shell.
3. Implement system and interface editing with XYFlow canvas + accessible list.
4. Add AI agents, capabilities, tool gateways, trust boundaries and AI view.
5. Implement deterministic rules engine with at least 15 tests and object-linked findings.
6. Export architecture summary, interface inventory and SVG; verify round-trip imports.
7. Run end-to-end tests of SAP + iPaaS + external API + AI tool scenario.

**Success measure:** one architect can complete and export a realistic example in a repeatable offline workflow.

## v0.2 — Import and quality of life

OpenAPI JSON/YAML import, optional metadata mapping, better graph layouts, undo/redo and scenario comparison. Show provenance and confidence for imported capabilities.

## v0.3 — AI-assisted review (opt-in)

LLM gateway with redaction, explicit consent, structured suggestion proposals, verification against schemas, and human approval before any model changes. No secrets in prompts.

## Future investigation

- MCP metadata discovery without invocation.
- A2A Agent Card import.
- Read-only system discovery from SAP, Microsoft, Salesforce and iPaaS.
- Intended-versus-observed architecture drift comparison.
- Team collaboration, RBAC and audit trail.

## Not now

Production tool execution, credential vault, vendor-specific deployment automation, autonomous integration implementation, and enterprise CMDB replacement.

## Open product questions

- Should data flows and API operations have separate first-class identities?
- At what level should authorization be modeled: per capability, role or invocation path?
- Which capability import format provides the strongest initial value after hand-authored models?
- Which report template is most useful for a presales/solution-design workshop?
