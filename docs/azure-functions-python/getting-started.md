# Getting Started

The toolkit is a set of independent PyPI packages. Install only the ones you need.

## Build a documented HTTP API

Use **OpenAPI + Validation + Logging** for OpenAPI / Swagger UI, typed request validation,
consistent error responses, and invocation-aware logs.

```bash
pip install azure-functions-openapi azure-functions-validation azure-functions-logging
```

## Check your project before deployment

Use **Doctor** for Python version checks, dependency checks, `host.json` checks, common
misconfiguration detection, and CI-friendly diagnostics.

```bash
pip install azure-functions-doctor
```

## Start a new project faster

Use **Scaffold + Cookbook** for project templates, recommended folder structure, practical
examples, and reusable patterns.

```bash
pip install azure-functions-scaffold
```

## Explore advanced serverless patterns

Use **DB + LangGraph** for DB-oriented workflow experiments, pseudo-trigger patterns, and
LangGraph workflow hosting patterns.

---

## Recommended flow

```text
Scaffold → Validation → OpenAPI → Logging → Doctor → Deploy
```

Each package has its own documentation. Start from the [toolkit overview](index.md) to pick
the right tool for your task.

---

## Related official resources

- [Azure Functions documentation](https://learn.microsoft.com/azure/azure-functions/)
- [Azure Functions Python developer guide](https://learn.microsoft.com/azure/azure-functions/functions-reference-python)
- [Azure Functions Core Tools](https://github.com/Azure/azure-functions-core-tools)
- [Azure Functions Python library](https://github.com/Azure/azure-functions-python-library)
