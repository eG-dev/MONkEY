---
description: "Use when writing replacement Angular, TypeScript, or web scripts: logical spacing, braces, readable control flow, method chains, and modern Angular conventions."
applyTo: "web/**/*.ts,web/**/*.mjs,tests/e2e/**/*.ts"
---
# Angular and TypeScript Style

- Follow the scoped web EditorConfig and Prettier configuration: two-space indentation, single quotes, and the configured 140-column print width for TypeScript/web scripts.
- Separate logical clusters with blank lines: configuration/validation, service setup, middleware/routes, and lifecycle handling. Within classes, separate injected dependencies, state, and methods; within methods, separate guards, preparation, actions, and results. Do not insert a blank line after every statement.
- Group external imports separately from local imports. Wrap long import lists, configuration objects, arrays, and call arguments instead of packing them onto one line.
- Always use braces for `if`, `else`, loops, and other block statements, even for one-line returns or throws. Keep multi-action callbacks clearly grouped.
- Prefer conditional `?:` expressions for selecting or returning values, including nested conditions when readable. For multiline expressions, put `?` and `:` branches on separate lines and indent nested conditions as shown below. Use `if/else` when long conditions, multiple actions, or complex branching remain easier to understand that way; do not expand a ternary merely because it is nested.

```typescript
const result = condition
	? firstValue
	: otherCondition
		? secondValue
		: fallbackValue;
```

- Use meaningful variable, function, and callback parameter names. Prefer `const`; use `let` only for reassignment, and avoid `var`. Name intermediate values when that explains a complex expression without adding unnecessary indirection.
- Put chained operations on separate lines when a chain contains callbacks or multiple processing steps. Prefer focused functions over deep nesting or narration comments; add helpers only when they clarify a real responsibility or remove duplication.
- Use strict types and `unknown` with narrowing for untrusted data; avoid `any` and unexplained casts/non-null assertions. Make public API parameter/return contracts explicit where helpful, while allowing obvious local values to be inferred. Define reusable interfaces in their own files.
- Follow existing standalone Angular, `inject()`, signal, and provider patterns. Keep components focused on presentation and interaction, and use services for shared frontend behavior; do not move backend business rules into Angular.
- Preserve request-scoped SSR state, browser/server boundaries, middleware order, promise error propagation, and cleanup while improving readability. Formatting is not permission to change behavior.
- Keep E2E setup/action/assertion groups readable as required by the [test instructions](tests.instructions.md); do not force multi-stage workflows into one oversized action block.