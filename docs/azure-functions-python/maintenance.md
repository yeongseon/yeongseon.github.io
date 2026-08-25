---
description: Release cadence for the Azure Functions Python DX Toolkit — a default maintenance window, not an SLA, gated by the cookbook end-to-end safety net.
---

# Release cadence

The Azure Functions Python DX Toolkit is maintained by a single maintainer across
many small, focused packages. To keep that sustainable, releases follow a
**default maintenance window** rather than ad-hoc, one-off pushes.

!!! note "This is a default, not an SLA"
    The cadence below is a scheduling *default* that reduces decision fatigue —
    it is **not** a service-level agreement, a promise, or an obligation. There
    is no commitment to ship on any particular date, and skipping a window is
    always acceptable. Security-sensitive fixes are the natural exception and
    may ship whenever they are ready.

## The default window

Routine maintenance — dependency bumps, small fixes, docs, and coordinated
cross-package updates — is **batched** into a regular window rather than
released continuously. Batching related changes across the sibling repositories:

- keeps the toolkit's packages moving together instead of drifting apart,
- concentrates verification effort into one predictable pass, and
- removes the per-change "should I release now?" decision.

Between windows, changes accumulate on `main` behind the usual per-repo checks.
Anything urgent (notably security fixes) is released out-of-band as needed.

## What gates a release

A batch is only released once it clears the toolkit's end-to-end safety net: the
**cookbook** dogfoods every package against a real Azure Functions host, so a
green cookbook run is the practical gate that a batch is safe to ship. If the
cookbook is red, the window slips — the cadence never overrides the safety net.

## Why phrase it this way

Framing the cadence as a *default maintenance window* keeps the benefits of a
predictable rhythm without creating pressure or implied guarantees for a solo
maintainer. The goal is less decision fatigue, not more obligation.
