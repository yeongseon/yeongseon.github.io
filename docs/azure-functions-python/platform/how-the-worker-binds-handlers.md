---
description: How the Azure Functions Python worker loads a function app and binds handler parameters by name — the platform contract behind decorator order, context injection, and invocation_id. Every claim is pinned to upstream source.
---

# How the worker binds handlers

When you write a Python v2 function, you attach decorators to a plain function
and the Azure Functions **worker** does the rest: it discovers your function,
learns its parameters, and — on every request — hands your function the right
arguments **by name**. Several toolkit packages (`validation`, `db`,
`knowledge`, and the `doctor` decorator-order rule) depend on exactly *how* that
binding works. This page documents that contract once.

Everything here is scoped to the **observable platform contract** — the
`FunctionRpc` messages and the worker's load/invocation behavior — with each
claim pinned to upstream source. It is not a tour of worker internals.

## The two phases

The worker interacts with your handler in two distinct phases:

1. **Load (indexing).** The host sends a `FunctionLoadRequest` describing one
   function and its bindings. The worker inspects your Python function's
   **signature and type hints** to reconcile declared parameters with the
   binding metadata.
2. **Invocation.** For each request the host sends an `InvocationRequest`
   carrying a list of `ParameterBinding` entries. The worker builds an argument
   dict **keyed by binding name**, injects the invocation context when your
   function asks for it, and calls your function.

```text
Host ──FunctionLoadRequest──▶ Worker: inspect.signature + get_type_hints  (load)
Host ──InvocationRequest────▶ Worker: args[pb.name] = ...; call handler   (invoke)
```

## Binding

At load time the worker reads your function's parameters directly from the
Python object using `inspect.signature()` and `typing.get_type_hints()`
([functions.py#L383-L387][1]):

```python
func_name = metadata.name
sig = inspect.signature(func)
params = dict(sig.parameters)
annotations = typing.get_type_hints(func)
```

At invocation time, each incoming `ParameterBinding` is matched to a parameter
**by its `name`**, not by position ([dispatcher.py#L596-L688][2]):

```python
for pb in invoc_request.input_data:
    pb_type_info = fi.input_types[pb.name]
    args[pb.name] = bindings.from_incoming_proto(pb_type_info.binding_name, pb, ...)
```

The `name` here is the same `name` field defined on the `ParameterBinding`
protobuf message ([FunctionRpc.proto#L281-L523][3]):

```proto
message ParameterBinding {
  string name = 1;
  oneof rpc_data {
    TypedData data = 2;
    RpcSharedMemory rpc_shared_memory = 3;
  }
}
```

**Consequence — parameter names are part of your contract.** Because binding is
by name, a decorator that renames, drops, or fails to preserve a parameter (for
example by wrapping without `functools.wraps`, or by replacing the function with
an object the worker can no longer introspect) breaks binding. This is why the
toolkit's decorators are careful to keep the wrapped function's `__signature__`
and `__annotations__` intact.

## Invocation context and `invocation_id`

The same invocation path sets the current `invocation_id` on the running task
(so your logs correlate) and injects the invocation **context** into your
handler *only when the function declares it* ([dispatcher.py#L596-L688][2]):

```python
invocation_id = invoc_request.invocation_id
current_task.set_azure_invocation_id(invocation_id)
...
if fi.requires_context:
    args['context'] = fi_context
```

So `context` is just another **name-bound** argument: declare a `context`
parameter and the worker fills it; omit it and the worker does not. Nothing is
injected positionally.

## Why decorator order matters

In the v2 programming model your decorators build up a
[`FunctionBuilder`][builder-note]. The `azure-functions` library's
`FunctionBuilder.build()` validates the configured function and returns the
`Function` object the worker indexes ([function_app.py#L226-L234][4]):

```python
def build(self, auth_level: Optional[AuthLevel] = None) -> Function:
    self._validate_function(auth_level)
    return self._function
```

A trigger decorator such as `@app.route` expects to wrap **your handler**. If a
metadata-attaching decorator (e.g. `@validate_http`) is stacked *outside* the
trigger, it receives a `FunctionBuilder` instead of the handler — the wrong
object — and the metadata it tries to attach is lost or the build raises. The
rule that falls out of the platform contract:

> Put Azure trigger decorators **outermost** (closest to `@app`), and
> toolkit/metadata decorators **innermost** (closest to `def`), so each layer
> wraps the object it expects.

## References

All links are pinned to a release tag or commit SHA so they will not drift.

[1]: https://github.com/Azure/azure-functions-python-worker/blob/azure_functions_worker-4.45.1/workers/azure_functions_worker/functions.py#L383-L387
[2]: https://github.com/Azure/azure-functions-python-worker/blob/azure_functions_worker-4.45.1/workers/azure_functions_worker/dispatcher.py#L596-L688
[3]: https://github.com/Azure/azure-functions-python-worker/blob/0f52efccc6e19a7f108cc36d6d43f33866d28e52/azure_functions_worker/protos/_src/src/proto/FunctionRpc.proto#L281-L523
[4]: https://github.com/Azure/azure-functions-python-library/blob/1.17.0/azure/functions/decorators/function_app.py#L226-L234
[builder-note]: https://github.com/Azure/azure-functions-python-library/blob/1.17.0/azure/functions/decorators/function_app.py#L226-L234

- **Signature & type-hint inspection at load** — `azure-functions-python-worker`
  `functions.py` L383-L387, tag `azure_functions_worker-4.45.1`: the worker reads
  parameter names and annotations from your function. [link][1]
- **Name-keyed argument binding + `invocation_id`/context injection at invoke** —
  `dispatcher.py` L596-L688, tag `azure_functions_worker-4.45.1`. [link][2]
- **`FunctionLoadRequest` and `ParameterBinding` protobuf shapes** —
  `FunctionRpc.proto` L281-L523, commit `0f52efccc6e19a7f108cc36d6d43f33866d28e52`. [link][3]
- **`FunctionBuilder.build()` — where the handler is validated and registered** —
  `azure-functions-python-library` `function_app.py` L226-L234, tag `1.17.0`. [link][4]

## Where this contract is enforced in the toolkit

- [`azure-functions-validation`](https://github.com/yeongseon/azure-functions-validation-python)
  raises at decoration time when a metadata decorator receives a `FunctionBuilder`,
  and preserves `__signature__`/`__annotations__` so name-binding keeps working.
- [`azure-functions-doctor`](https://github.com/yeongseon/azure-functions-doctor-python)
  ships a `check_decorator_order` rule whose hint links back to this page.
