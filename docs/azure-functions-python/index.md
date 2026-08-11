# Azure Functions Python DX Toolkit

> A DX toolkit for Azure Functions Python: OpenAPI, validation, logging, diagnostics, scaffolding, and recipes.

Azure Functions Python is powerful, but once you move beyond simple examples, the developer
experience can feel fragmented.

**This is not a framework. This is a missing DX layer around Azure Functions Python.**

In real projects, developers solve the same problems repeatedly:

- How do I generate OpenAPI / Swagger docs for HTTP-triggered functions?
- How do I validate request bodies, query parameters, and responses?
- How do I make logs easier to search in Application Insights?
- How do I check common configuration issues before deployment?
- How should I structure a production-style project?
- Where can I find practical examples beyond the official quickstarts?

This toolkit organizes those missing pieces into small, focused open-source projects.

---

## Tools

### Build

| Tool | Purpose | Status |
|---|---|---|
| [OpenAPI](https://github.com/yeongseon/azure-functions-openapi-python) | Generate OpenAPI / Swagger docs for HTTP triggers | Usable |
| [Validation](https://github.com/yeongseon/azure-functions-validation-python) | Request and response validation | Usable |
| [Scaffold](https://github.com/yeongseon/azure-functions-scaffold-python) | Scaffold production-style projects | Early |

### Operate

| Tool | Purpose | Status |
|---|---|---|
| [Logging](https://github.com/yeongseon/azure-functions-logging-python) | Invocation-aware structured logging | Usable |
| [Doctor](https://github.com/yeongseon/azure-functions-doctor-python) | Run pre-deployment diagnostics | Usable |

### AI & Orchestration

| Tool | Purpose | Status |
|---|---|---|
| [LangGraph](https://github.com/yeongseon/azure-functions-langgraph-python) | LangGraph integration patterns | Experimental |
| [Durable Graph](https://github.com/yeongseon/azure-functions-durable-graph-python) | Manifest-first graph runtime built on Durable Functions | Experimental |
| [Knowledge](https://github.com/yeongseon/azure-functions-knowledge-python) | Knowledge retrieval (RAG) decorators | Experimental |
| [DB](https://github.com/yeongseon/azure-functions-db-python) | DB helper and pseudo-trigger patterns | Experimental |

### Recipes

| Tool | Purpose | Status |
|---|---|---|
| [Cookbook](https://github.com/yeongseon/azure-functions-cookbook-python) | Recipes, examples, and integration patterns | Early |
| [Practical Guide](https://github.com/yeongseon/azure-functions-practical-guide) | Practical guide to building and operating Azure Functions | Early |

---

## How the tools fit together

```text
Scaffold → Validation → OpenAPI → Logging → Doctor → Deploy
```

- For HTTP APIs, start with **OpenAPI + Validation + Logging**.
- For deployment readiness, start with **Doctor**.
- For new projects, start with **Scaffold + Cookbook**.
- Experimental packages such as **DB** and **LangGraph** are for pattern exploration.

---

## Project status

| Status | Meaning |
|---|---|
| **Usable** | Stable enough for real projects and feedback |
| **Early** | Usable but evolving quickly |
| **Experimental** | Pattern exploration. APIs and behavior may change. Not recommended as a production dependency yet. |

---

## Design principles

1. **Stay close to Azure Functions** — enhance, don't replace the programming model.
2. **Small focused packages** — adopt only the parts you need.
3. **Production-style examples** — reflect real project needs, not just hello-world.
4. **CI/CD friendly** — works with GitHub Actions, Azure Developer CLI, Azure CLI.
5. **Clear boundaries** — experimental packages are clearly marked.

---

Feedback from real Azure Functions Python users is very welcome.
[Open an issue →](https://github.com/yeongseon/azure-functions-python-dx/issues/new)
