# Dependency and browser security review

The Studio is a public static React/Vite application. No backend credentials or enterprise connectors are required.

## Threat considerations

- Models are stored locally in browser storage. On shared devices, projects may be accessible to other users of that browser profile.
- JSON imports are parsed with schema validation and bounded to 2 MB. Models are data, not executable code.
- React text nodes escape untrusted strings. Do not introduce unsafe HTML rendering from imported descriptions.
- Exported project files may reveal confidential system names and architecture. Confirm intended distribution before sharing.
- An interface's authorization and evidence fields are documentation, not runtime guarantees.
- GitHub Pages publishes application assets, not browser localStorage. The example is fictional.

## Dependency controls

- CI executes unit tests, TypeScript/Vite build, and Chromium browser smoke tests.
- CI runs `npm audit --omit=dev --audit-level=high` to inspect production dependencies. Investigate findings before release.
- Development-only toolchain advisories also need review; use `npm audit` and prioritize exploited or critical paths.
- Pin dependencies via a committed lockfile in a later dependency-hardening change and use `npm ci` once available.

## Known gaps

The initial prototype was created with older package ranges, and an earlier install reported advisories. This document does **not** claim those vulnerabilities have been resolved. Runtime and transitive package risk must be reassessed against an exact installed dependency tree.
