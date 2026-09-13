---
title: How to structure an Azure Functions Python v2 app
description: A practical, opinionated guide to structuring production-grade Azure Functions apps in Python using the v2 programming model — project layout, blueprints, dependency wiring, configuration, and testing.
date: 2026-09-13
---

# How to structure an Azure Functions Python v2 app

The Python **v2 programming model** for Azure Functions removed a lot of
ceremony — no more `function.json` files, decorators instead of folders. But it
also removed the guardrails that used to force *some* structure on your project.
The quickstart puts everything in a single `function_app.py`, and if you never
revisit that decision, a real project turns into one 1,500-line file that nobody
wants to touch.

This is the layout I use for production Azure Functions apps in Python, and the
reasoning behind each decision.

!!! note "Scope"
    This assumes the **v2 model** (`azure-functions>=1.11`, decorator-based) and
    Python 3.10+. If you are still on the v1 model with `function.json`, migrating
    to v2 is worth doing before you invest in structure.

## The problem with the default layout

A fresh `func init` gives you this:

```text
myapp/
├── function_app.py      # every trigger, every handler, all config
├── host.json
├── local.settings.json
└── requirements.txt
```

`function_app.py` is the **entry point** — the Azure Functions host imports it and
discovers every function registered on the `app` object. The trap is treating
"the file the host imports" as "the file where all my code lives." Those are two
different responsibilities.

## A layout that scales

```text
myapp/
├── function_app.py          # thin entry point — only wires blueprints
├── host.json
├── local.settings.json
├── requirements.txt
├── src/
│   └── myapp/
│       ├── __init__.py
│       ├── functions/       # HTTP/timer/queue triggers grouped by domain
│       │   ├── __init__.py
│       │   ├── orders.py    # a blueprint
│       │   └── health.py    # a blueprint
│       ├── services/        # business logic — no azure.functions imports
│       │   ├── __init__.py
│       │   └── order_service.py
│       ├── models/          # Pydantic models / dataclasses
│       │   └── order.py
│       └── config.py        # typed settings loaded from environment
└── tests/
    ├── test_orders.py
    └── test_order_service.py
```

The single most important rule: **triggers are a thin adapter layer.** A trigger
function should parse the request, call a service, and shape the response —
nothing more. All real logic lives in `services/`, which knows nothing about
`azure.functions`. That one boundary is what makes the app testable.

## Split triggers with blueprints

The v2 model supports **blueprints** (`azure.functions.Blueprint`), which are the
Python equivalent of Flask blueprints or FastAPI routers. They let you register
functions across multiple modules and compose them in the entry point.

`src/myapp/functions/orders.py`:

```python
import azure.functions as func

from myapp.services.order_service import create_order
from myapp.models.order import OrderRequest

bp = func.Blueprint()


@bp.route(route="orders", methods=["POST"])
def post_order(req: func.HttpRequest) -> func.HttpResponse:
    payload = OrderRequest.model_validate_json(req.get_body())
    order = create_order(payload)
    return func.HttpResponse(order.model_dump_json(), mimetype="application/json")
```

`function_app.py` stays tiny — it only composes blueprints:

```python
import azure.functions as func

from myapp.functions import orders, health

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)
app.register_blueprint(orders.bp)
app.register_blueprint(health.bp)
```

Now each domain (orders, health, billing…) is an isolated module you can read,
test, and change without scrolling past everything else.

!!! warning "Decorator order matters"
    On a decorated function, trigger and binding decorators are order-sensitive,
    and mistakes often surface only as a silent no-registration or a runtime
    warning rather than a hard error. If a function "isn't firing," suspect
    decorator order first. A pre-deploy check (see below) catches this class of
    bug before it reaches Azure.

## Type your configuration

Reading `os.environ["SOMETHING"]` scattered across handlers is how you ship a
`KeyError` to production on a Friday. Centralize it:

`src/myapp/config.py`:

```python
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str
    max_batch_size: int

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            database_url=os.environ["DATABASE_URL"],
            max_batch_size=int(os.environ.get("MAX_BATCH_SIZE", "100")),
        )


settings = Settings.from_env()
```

Now configuration is loaded once, typed, and fails loudly at startup with a
clear message instead of deep inside a request.

## Where the DX toolkit fits

The layout above solves *structure*. Four recurring problems still aren't solved
by structure alone — and they are exactly the gaps the
[Azure Functions Python DX Toolkit](../azure-functions-python/index.md) fills:

- **Request validation** — instead of hand-parsing bodies, use
  [Validation](/azure-functions-python/validation/) for Pydantic-backed request
  and response validation at the trigger boundary.
- **OpenAPI docs** — [OpenAPI](/azure-functions-python/openapi/) generates
  Swagger docs for your HTTP triggers from a single decorator, so the adapter
  layer documents itself.
- **Structured logging** — [Logging](/azure-functions-python/logging/) adds
  invocation-aware structured logs, which makes tracing a request across services
  in Application Insights actually feasible.
- **Pre-deploy diagnostics** — [Doctor](/azure-functions-python/doctor/) checks
  bindings, environment variables, and decorator issues *before* you deploy,
  catching the decorator-order class of bug mentioned above.

None of these replace the programming model; they sit on top of the same layout.

## Test the services, smoke-test the triggers

Because `services/` has no `azure.functions` dependency, its tests are plain
Python — fast, no host, no mocks of the runtime:

```python
from myapp.services.order_service import create_order
from myapp.models.order import OrderRequest


def test_create_order_assigns_id():
    order = create_order(OrderRequest(item="widget", quantity=2))
    assert order.id is not None
    assert order.quantity == 2
```

For triggers, a thin smoke test that builds an `HttpRequest` and asserts the
status code is enough — you are testing the adapter, not the business logic
(which is already covered).

## Checklist

- [ ] `function_app.py` only registers blueprints — no logic.
- [ ] Triggers parse/validate input, call a service, shape output. Nothing else.
- [ ] `services/` never imports `azure.functions`.
- [ ] Configuration is loaded once, typed, and fails at startup.
- [ ] Business logic is unit-tested without the Functions host.
- [ ] A pre-deploy diagnostic runs in CI to catch binding/decorator issues.

---

Structure buys you very little on day one and a great deal on day ninety. Start
with the thin entry point and the services boundary; everything else follows.

*Building Azure Functions in Python? The
[Azure Functions Python DX Toolkit](../azure-functions-python/index.md) packages
the validation, docs, logging, and diagnostics pieces referenced above. Feedback
and issues are welcome on [GitHub](https://github.com/yeongseon).*
