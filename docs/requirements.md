# Product Requirements — v0.1

## Primary user and job

A solution/integration architect designs a bounded solution involving enterprise systems and optionally AI agents. They need a consistent, reviewable representation of interfaces, capabilities, trust boundaries and unresolved decisions.

## Functional requirements

| ID | Requirement | v0.1 acceptance criterion |
|---|---|---|
| FR-01 | Projects | Create, rename, duplicate, delete, import and export projects |
| FR-02 | Components | Create typed system, platform, agent, gateway and external-service nodes |
| FR-03 | Interfaces | Define directed source/target relationships, protocols, operations, schemas and ownership |
| FR-04 | Capability catalog | Represent APIs, MCP tools/resources, agent-delegated capabilities and event interfaces |
| FR-05 | Dual visualization | Integration view and AI capability view derive from the same data without duplicating objects |
| FR-06 | Property editor | Edit fields and see immediate consistent changes to visual model and validation |
| FR-07 | Rules | At least 15 documented deterministic checks, with severity, source object(s), rationale, remediation |
| FR-08 | Deliverables | Export SVG, interface inventory and Markdown architecture summary |
| FR-09 | Persistence | IndexedDB local storage; versioned JSON import/export; invalid imports rejected safely |
| FR-10 | Requirements | Associate functional/nonfunctional requirements with relevant components and interfaces |

## Minimum interface fields

ID, display name, source, target, business purpose, interface kind, direction, pattern, transport/protocol, operations, authentication status, authorization status, payload/schema reference, data classification, owner, expected throughput/latency, failure/retry policy, idempotency policy and observability status.

Fields may be unknown or not applicable; do not manufacture defaults that imply decisions.

## AI-accessible capability fields

Tool/resource or delegated-agent identity; owning service; discoverability; input/output schema; invocation endpoint class (not secrets); intended permissions; actual enforcement location; allowed actions (read/write/approve/delete); data sensitivity; human approval requirement; side effects; audit traceability; downstream dependencies.

Important: a model declaration of permission is **not** evidence that the runtime enforces it.

## Validation examples (proposed)

1. Dangling or invalid interface endpoints.
2. Missing interface business purpose.
3. Missing technical owner.
4. Unspecified interface pattern.
5. Unknown authentication for an externally reachable interface.
6. Missing authorization enforcement location for AI-exposed tools.
7. Write-capable AI tool lacking explicit side-effect classification.
8. High-impact AI operation without an explicit human approval decision.
9. Async flow without documented duplicate-handling decision.
10. Retry policy unspecified for integration requiring recovery.
11. Dead-letter/reconciliation approach undecided where failed messages can accumulate.
12. Sensitive data classification unspecified.
13. Required observability undecided for critical interfaces.
14. Missing schema/contract reference for declared structured payload.
15. Circular dependencies flagged for review, not always treated as errors.
16. Requirement with no linked satisfying design element.
17. Tool claims downstream access but no modeled enforcing service/boundary.

Rules must avoid universal claims: applicability is conditional on flow type, risk, and explicit design requirements.

## Non-functional requirements

- Core application works without login or network connectivity after assets load.
- No execution of enterprise operations or agent tools in v0.1.
- Never persist credentials or secret values.
- Source schema independent of diagram library.
- All validation results reproducible from exported model + ruleset version.
- Keyboard navigation and accessible property editor; graph has alternative navigable object list.
- Import/export round trips preserve object identities and relationships.
- No architecture data transmitted externally without user action.

## Out of scope

Live SAP/D365/Workato discovery, remote collaboration, enterprise IAM, deployment generation, runtime monitoring, automatic security certification, and autonomous AI modification of the canonical model.

## Definition of done

A user can model an SAP-to-iPaaS-to-external API flow, attach an AI agent and tool gateway, specify permissions and trust boundaries, see separate connected views, run explainable checks, and export a consistent architecture report entirely locally.
