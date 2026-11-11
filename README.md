# RagDollLabs Integration Architecture Studio

A **model-first, local-first** web application for designing, validating, and documenting enterprise integrations and AI-accessible interfaces.

## Vision

The diagram is a projection of a structured architecture model, not the source of truth. Traditional interfaces, AI-agent tools and their permissions belong in the same model but are visualized through distinct views.

Key questions:
- Which systems, interfaces, agents and tools participate?
- What protocols, schemas, data flows, performance and failure policies apply?
- What AI capabilities are discoverable versus authorized versus enforced downstream?
- Which requirements and architecture decisions are missing?
- Can the model produce coherent diagrams, catalogs, and documentation?

## Initial scope (v0.1)

- Create, edit, save, import and export local architecture projects.
- Model systems, agents, integration interfaces, tools, relationships, and requirements.
- **Integration view** and **AI capability view** generated from the same source.
- Deterministic validation with explainable, object-linked findings.
- Interface inventory, architecture summary, and SVG diagram export.

No live enterprise connectors, hosted accounts, execution of AI tools or AI-generated architecture changes are required.

## Documents

- [Requirements and acceptance criteria](docs/requirements.md)
- [Architecture and domain model](docs/architecture.md)
- [Implementation roadmap](docs/roadmap.md)

## Design principles

1. Model first: rendering and persistence share one authoritative schema.
2. Unknown, not applicable and explicitly decided are distinct states.
3. Distinguish catalog-supported capabilities, configured capabilities, and runtime-verified capabilities.
4. Distinguish tool discovery, invocation authorization, and downstream enforcement.
5. Local by default, with versioned portable JSON and no secrets in project records.
6. Deterministic validation before optional AI assistance.
7. Keep the core domain independent of UI framework or vendor libraries.

## Proposed stack (not implemented)

TypeScript, React, React Flow / XYFlow, Zustand, Zod, IndexedDB, ELK.js, Vitest and Playwright.

## Development preview (v0.1)

The feature branch contains an initial React/TypeScript implementation with a two-mode graph editor, property inspector, local autosave, JSON import/export, Markdown report, demo project, basic validation and unit tests. This is an early vertical slice, not the complete documented v0.1 specification.

```bash
npm install
npm test
npm run dev
npm run build
```

Core design and validation fields are still deliberately incomplete (for example, requirement mapping, rules coverage, and full documentation exports). Hosting remains disabled for this private repository unless deliberately configured.

## Status

**Prototype in progress.** Features beyond this initial vertical slice remain planned.

## Security

Architecture metadata may itself be sensitive. Never store real API keys, passwords, tokens or private keys in models; review exported documents before sharing.
