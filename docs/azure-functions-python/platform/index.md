---
description: Platform mechanics for the Azure Functions Python DX Toolkit — neutral, source-pinned explanations of how the Azure Functions runtime and Python worker behave, so every tool can link to one shared source of truth instead of re-explaining the platform.
---

# Platform mechanics

Several tools in the Azure Functions Python DX Toolkit depend on the same
underlying runtime behavior: how the Python **worker** loads a function app, how
it **binds** handler parameters, and how invocation context flows through a call.
Rather than re-explaining these mechanics in every repository, the toolkit keeps
one neutral, **source-pinned** description here — and each tool links to it.

This section is deliberately narrow. It documents the **platform contract and
observable behavior** only:

- What the [`FunctionRpc`](https://github.com/Azure/azure-functions-python-worker)
  protocol and the Python worker actually do at load and invocation time.
- Behavior you can rely on when building on top of the programming model.

It is **not** a tour of worker internals. Every claim links to a tag- or
commit-pinned upstream permalink, and — where a toolkit package depends on it —
to the test in that package that locks the behavior in place.

## Pages

| Page | What it explains |
|---|---|
| [How the worker binds handlers](how-the-worker-binds-handlers.md) | How the Python worker maps a `FunctionLoadRequest` to your function and binds parameters **by name**, and why decorator order matters. |

## Principles

1. **One neutral source.** The mechanism narrative lives here on `yeongseon.dev`,
   not duplicated inside tool repositories. Tools **link**, they do not copy.
2. **Claims are locked by tests.** Each behavioral claim is backed by a
   tag/commit-pinned upstream citation and, where applicable, a conformance test
   in the toolkit package that relies on it.
3. **Contract, not internals.** Scope is the proto contract and observable
   behavior. When a page starts drifting toward explaining worker internals,
   that is the signal it has outgrown this section.
