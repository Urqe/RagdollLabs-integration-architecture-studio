# Technical Architecture — Proposed

## Core principle

**The domain model is authoritative.** Canvas nodes and edges are rendered projections and must never become the persisted source of architecture semantics.

## Logical layers

1. **Domain**: typed entities, links, constraints, identifiers and schema versions; pure TypeScript.
2. **Application**: commands, undo/redo, derived views and validated state transitions.
3. **Validation**: deterministic, versioned rules returning findings with rule ID, object paths, severity and explanations.
4. **Persistence**: IndexedDB plus JSON import/export with schema validation and migrations.
5. **Presentation**: React/XYFlow visual views, accessible inspector, inventory and report screens.
6. **Optional later integrations**: read-only metadata imports; AI review through explicit server gateway.

Suggested dependencies: React + TypeScript; XYFlow; Zustand; Zod; ELK.js; Vitest + Playwright. Avoid requiring a backend for v0.1.

## Initial domain entities

- **Project**: identity, scope, requirements, model version and metadata.
- **Component**: system, service, iPaaS, broker, gateway, datastore or AI agent.
- **Interface**: directed logical connectivity between components, including protocols and contracts.
- **Capability**: operation/tool/resource/event supported by a component and optionally exposed through an interface.
- **Invocation path**: agent -> gateway/tool -> service -> downstream target, including authorization checkpoints.
- **Trust boundary**: a declared security zone and its boundary-crossing relationships.
- **Requirement**: explicit design constraint and references to satisfying entities.
- **Decision**: alternatives, selected approach, rationale, state and consequences.
- **Finding**: derived validation result (not authoritative project data).

Separate a reusable reference **template** (e.g. typical S/4HANA OData capability) from a project **instance** (the specific customer system and its confirmed constraints). Vendor templates are advisory; never assume that a particular deployment supports all template capabilities.

## Relationship semantics

Model interface connectivity, capability exposure, tool invocation, dependency, ownership and trust-boundary crossings as distinct typed relationships. Do not overload one generic "edge" with all semantics.

## AI security model

Keep separate:
1. **Discoverable**: a tool or resource is visible to an agent.
2. **Callable**: an authorization policy permits an invocation.
3. **Effective downstream access**: the gateway/service's actual identity and permissions permit the operation.
4. **Verified**: evidence of enforcement has been observed, not just documented.

Represent claimed versus verified properties independently. Never treat an MCP tool description or system prompt as a security control.

## Export format

A versioned JSON document with stable IDs, explicit references, source/provenance metadata, an optional ruleset version and no secrets. Validation must reject dangling references, invalid enum values and malformed schemas with actionable messages.

Documentation exports are generated from the same domain model and should indicate unknowns and outstanding findings.

## Security

Local storage can contain confidential architecture details; display warnings before export. Strip endpoint secrets and user-supplied access tokens from serializations. No arbitrary execution of imported scripts or tool definitions. Treat imported JSON and future AI output as untrusted input.

## Initial architectural decisions

- ADR-001: Local-first, offline-capable MVP.
- ADR-002: Model-first schema separate from visualization.
- ADR-003: Deterministic validation precedes generative AI.
- ADR-004: AI capability graph shares objects with integration graph, but uses distinct relationship types.
- ADR-005: No live write-capable connectors in v0.1.
