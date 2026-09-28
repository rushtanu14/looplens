# LoopLens — Devpost draft

Status: local preparation only. No external links, registration or submission are claimed.

## Tagline

Predict a loop. Follow every value. Explain the first wrong step.

## Inspiration

An incorrect final number tells a beginner that something went wrong, but rarely shows where their mental model diverged from execution. LoopLens makes a small loop visible one iteration at a time and compares two explanations using concrete values.

## What it does

Users choose a boundary, direction or step-size challenge, or configure their own integer loop. They predict a total, reveal the trace, inspect accumulator changes and compare an alternative. A downloadable Markdown receipt contains the exact configurations, prediction, first differing row and both trace previews. Browser-local persistence keeps custom experiments without an account.

## How it works

React manages the interaction while a pure TypeScript simulator produces immutable rows. A separate comparison function detects changed values or one version stopping earlier. Validation rejects unsupported values. A fixed 200-iteration bound prevents a wrong-direction or zero-step loop from hanging the page. Incomplete output is labelled partial, and matching partial prefixes never establish full equivalence.

## What is distinctive

The complete predict → step → compare → export workflow turns a debugging result into an inspectable explanation. The first difference can be the next loop variable even when the current accumulated totals still match. This is an original implementation using established loop-tracing techniques, not a claim of a novel programming-language algorithm.

## Scope and evidence

Three sample challenges and custom loops work locally. Unit/integration and desktop/mobile production-browser verification are recorded in `verification.md`. No interviews, adoption, measured learning outcomes, runtime AI or support for arbitrary JavaScript are claimed.

## Built With

React, TypeScript, Vite, CSS, SVG, browser localStorage and Blob downloads, Radix Icons, Geist and Geist Mono, Vitest, Testing Library, Playwright, Codex. Demo production additionally uses Playwright and FFmpeg if included in the final uploaded package.

## AI assistance

Codex assisted ideation, UI design, implementation, tests and documentation. The project does not use an AI model at runtime. Do not claim unaided development or personal learning experiences that the entrant has not confirmed.

## Remaining before entry

Confirm current rules and eligibility; obtain explicit terms agreement; publish the reviewed source and optional live app; upload the selected real screenshots/demo; insert verified public URLs; confirm entrant details; submit only after the participant's go-ahead. Next Byte requires a public source repository. Do not paste local filesystem paths into Devpost URL fields.
