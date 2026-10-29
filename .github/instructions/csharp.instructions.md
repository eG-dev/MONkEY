---
description: "Use when writing replacement C# backend or integration code: explicit properties, null validation, lambda naming, and readable method chains."
applyTo: "backend/**/*.cs,tests/integration/**/*.cs"
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

- For switch statements and expressions, separate entries/arms or logical groups with blank lines. When an `or` or `and` pattern spans multiple lines, align continuation lines with the first pattern; do not add an extra indentation level.
- Prefer `var`, except when declaring an interface type for a newly created implementation.
- Declare class/record members as explicit properties in the type body; use object initializers instead of positional records or primary constructors. Use `init`/`required` where appropriate to preserve immutability and initialization requirements.
- Use `ArgumentNullException.ThrowIfNull` for null parameter validation and the appropriate `ArgumentException.ThrowIfNullOrEmpty` / `ThrowIfNullOrWhiteSpace` helper for strings. When assigning a constructor parameter, use `this.parameter = parameter ?? throw new ArgumentNullException(nameof(parameter))`.
- Use descriptive lambda parameter names for entity configuration builders, configuration callbacks, dependencies, and complex or nested lambdas. Use `stateEntity` for the EF entity configuration builder and `table` for table configuration; prefer `options`, `context`, and `policy` over cryptic abbreviations. For simple entity key/property selectors, use `x`, such as `HasKey(x => x.Id)` and `Property(x => x.SampleId)`; the builder name supplies the surrounding context.
- Keep single method calls inline when they fit; a lambda argument alone is not a reason to isolate the receiver on its own line. For actual fluent chains, put each chained operation on a separate line and align continuation dots. When a call with a block lambda is followed by further fluent calls, indent its braces and closing `})` one level beneath the starting call, aligned with the continuation dots; indent the body one further level. For standalone configuration calls, keep block-lambda braces aligned with the containing call and indent the body one level. Separate independent configuration groups with blank lines.
- For EF entity-builder property, key, index, and relationship configuration, put the builder on its own line and each fluent operation on its own aligned continuation line, even for a single operation. Separate each entity configuration statement or logical group with a blank line; related table constraints may remain grouped together. Keep standalone `ToTable` calls inline with the builder.
- For minimal API registrations, keep the receiver and `MapGet`/`MapPost`/other mapping call together to make endpoint declarations easy to scan. Indent handler-lambda braces and the closing `})` one level beneath the declaration, with the handler body one further level. Align subsequent authorization, rate-limiting, tags, names, and response-metadata calls at that same continuation indentation, one call per line; never append them directly to `})`. Wrap long handler parameter lists and separate endpoint registrations with blank lines. This endpoint layout is distinct from compact EF configuration callbacks.

```csharp
auth.MapGet("/me", async Task<IResult> (
	ClaimsPrincipal principal,
	UserManager<ApplicationUser> users,
	UserAdministration administration) =>
	{
		var user = await users.GetUserAsync(principal);

		return user is null
			? TypedResults.Unauthorized()
			: TypedResults.Ok(await administration.DescribeAsync(user));
	})
	.RequireAuthorization()
	.Produces<SessionResponse>();
```

```csharp
modelBuilder.Entity<Account>(accountEntity =>
{
	accountEntity
		.HasKey(x => x.Id);

	accountEntity
		.Property(x => x.Name)
		.HasMaxLength(40)
		.IsRequired();

	accountEntity.ToTable("Accounts", table =>
		table.HasCheckConstraint("CK_Accounts_NameLength", "length(Name) BETWEEN 1 AND 40"));
});
```

- Do not routinely use `ConfigureAwait` in ASP.NET Core application code. Context capture requirements must be evaluated explicitly for UI or reusable library code.
- Preserve generated EF migration/snapshot conventions; do not manually restyle generated artifacts.
- Follow [E2E-first verification](../../docs/ADR/ADR-0005-e2e-first-verification.md), not mandatory mock suites or unit-coverage quotas. Group applicable integration test setup, actions, and assertions with blank lines.
