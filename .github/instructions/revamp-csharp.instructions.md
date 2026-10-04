---
description: "Use when writing replacement C# backend or integration code: explicit properties, null validation, lambda naming, and readable method chains."
applyTo: "revamp/backend/**/*.cs,revamp/tests/integration/**/*.cs"
---
# C# Style

- Follow Microsoft C# conventions and the repository EditorConfig. Keep these rules scoped to the replacement; do not retrofit legacy projects incidentally.
- Use meaningful names, focused methods, composition over inheritance, and dependency injection for service dependencies. Define interfaces in their own files.
- Always use braces for block statements, including single-line returns. Do not use regions. Prefer short, self-explanatory functions over inline comments.
- Prefer conditional `?:` expressions for selecting or returning values, including nested conditions when readable. For multiline expressions, put `?` and `:` branches on separate lines and indent nested conditions as shown below. Use `if/else` when long conditions, multiple actions, or complex branching remain easier to understand that way; do not expand a ternary merely because it is nested.

```csharp
var result = condition
	? firstValue
	: otherCondition
		? secondValue
		: fallbackValue;
```

- Prefer `var`, except when declaring an interface type for a newly created implementation.
- Declare class/record members as explicit properties in the type body; use object initializers instead of positional records or primary constructors. Use `init`/`required` where appropriate to preserve immutability and initialization requirements.
- Use `ArgumentNullException.ThrowIfNull` for null parameter validation and the appropriate `ArgumentException.ThrowIfNullOrEmpty` / `ThrowIfNullOrWhiteSpace` helper for strings. When assigning a constructor parameter, use `this.parameter = parameter ?? throw new ArgumentNullException(nameof(parameter))`.
- When chaining calls with lambdas, put each chained operation on its own line and the lambda-bearing call on a new line. Use `x` for single-parameter lambdas and meaningful two- or three-letter type abbreviations for nested lambdas. Keep meaningful names for multi-parameter lambdas.
- Do not routinely use `ConfigureAwait` in ASP.NET Core application code. Context capture requirements must be evaluated explicitly for UI or reusable library code.
- Preserve generated EF migration/snapshot conventions; do not manually restyle generated artifacts.
- Follow [E2E-first verification](../../docs/ADR/ADR-0005-e2e-first-verification.md), not mandatory mock suites or unit-coverage quotas. Group applicable integration test setup, actions, and assertions with blank lines.