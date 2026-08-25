---
description: The endpoint metadata contract for the Azure Functions Python DX Toolkit — how a producer library emits OpenAPI-ready endpoint metadata for azure-functions-openapi to consume, without cross-imports.
---

# The `endpoint` metadata contract

The Azure Functions Python DX Toolkit lets sibling packages cooperate **without
importing one another**. A decorator attaches a single dict to the wrapped
handler under the conventional attribute `_azure_functions_metadata`, keyed by a
package-owned **namespace** string. Consumers discover metadata by reading that
attribute — never by importing the producer.

The `endpoint` namespace is the toolkit's **versioned, OpenAPI-ready** metadata
convention:

- **Producers** (`azure-functions-validation`, `azure-functions-langgraph`, or your
  own library) *emit* the `endpoint` payload.
- The **consumer** (`azure-functions-openapi`) *reads* it and derives the OpenAPI
  spec directly, instead of reconstructing OpenAPI shapes per producer.

It is a **convention**, not a centralized binding: no repository is the runtime
owner, and the payload is exchanged as plain JSON-compatible data. Each package
keeps its own local conformance tests against the shape below.

## Where it lives

| | |
| --- | --- |
| Convention attribute | `_azure_functions_metadata` (a `dict`) |
| Namespace key | `"endpoint"` |
| Current version | `1` |

```python
handler._azure_functions_metadata = {
    "endpoint": { "version": 1, ... },   # this contract
    # other namespaces (e.g. "validation") may coexist here
}
```

## Payload shape (version 1)

```jsonc
{
  "version": 1,                     // const 1; consumers WARN (not fail) on unknown
  "request_body": { /* JSON Schema */ } | null,
  "request_body_required": true,    // true whenever a body model is configured
  "parameters": [                   // OpenAPI parameter objects (query/path/header)
    { "name": "id", "in": "path", "required": true, "schema": { /* JSON Schema */ } }
  ],
  "responses": {                    // status-code (string) -> { "schema": JSON Schema }; or null
    "200": { "schema": { /* JSON Schema */ } }
  } | null,
  "summary": "…",                   // optional
  "description": "…",               // optional
  "tags": ["users"],                // optional
  "security": [ { /* requirement */ } ] // optional
}
```

### `path` and `method` are intentionally omitted

The Azure Functions route binding (`@app.route(route=…, methods=…)`) is the
single source of truth for the path and HTTP methods. The consumer derives them
from the binding at scan time, so producers **must not** duplicate them here.

### `responses` describes the endpoint's actual runtime responses

`responses` is generic: a producer maps each HTTP status code it can return to a
response object carrying that response's JSON Schema, or emits `null` when it has
nothing to describe. What those responses *are* is producer-specific — a producer
that only emits success responses is under no obligation to document error
bodies.

### Embedded schemas keep their `$defs`

Any embedded JSON Schema that contains a `$ref` anywhere must carry a top-level
`$defs` mapping. Producers leave `$defs` **unresolved**; the consumer
(`azure-functions-openapi`) is the sole authority that hoists them into
`components/schemas` and resolves `$ref` collisions.

## A minimal producer

A producer is any decorator that attaches the `endpoint` payload. It does **not**
need to import `azure-functions-openapi` or any other toolkit package — only
follow the convention:

```python
import functools

METADATA_ATTR = "_azure_functions_metadata"


def documented(*, summary: str, tags: list[str] | None = None):
    """Attach OpenAPI-ready `endpoint` metadata for the toolkit to consume."""

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)

        payload = {
            "version": 1,
            "request_body": None,
            "request_body_required": False,
            "parameters": [
                {"name": "id", "in": "path", "required": True,
                 "schema": {"type": "string"}},
            ],
            "responses": {"200": {"schema": {"type": "object"}}},
            "summary": summary,
            "tags": tags or [],
        }
        # Merge without clobbering other namespaces already present.
        existing = getattr(func, METADATA_ATTR, None)
        base = dict(existing) if isinstance(existing, dict) else {}
        base["endpoint"] = payload
        setattr(wrapper, METADATA_ATTR, base)
        return wrapper

    return decorator
```

Apply it inside the route binding, closest to the handler, and
`azure-functions-openapi` will discover it during its scan:

```python
@app.route(route="items/{id}", methods=["GET"])
@documented(summary="Fetch an item", tags=["items"])
def get_item(req):
    ...
```

## Producer and consumer discipline

- **Merge, don't clobber.** Seed from any existing `_azure_functions_metadata`
  dict and write only your namespace, so multiple producers (e.g. `validation`
  and `endpoint`) can coexist on one handler.
- **Additive evolution.** New optional keys must be additively ignorable.
  Consumers read via an explicit allowlist / typed reader — never `**payload`
  splat — and treat an unknown `version` as a *warning*, falling back to their
  prior discovery path rather than raising.
- **Version only on breaks.** `version` starts at `1` and bumps **only** on a
  breaking payload change; additive optional fields do not bump it.

## Related docs

- **Producer (reference implementation):**
  [`azure-functions-validation` — `endpoint` metadata spec](https://github.com/yeongseon/azure-functions-validation-python/blob/main/docs/METADATA_SPEC.md)
  documents how that package canonicalizes Pydantic models into this payload
  (including its validation-specific `422` response).
- **Consumer:**
  [`azure-functions-openapi`](https://github.com/yeongseon/azure-functions-openapi-python)
  reads the `endpoint` namespace and derives the OpenAPI spec.
