# LoopLens

Predict a loop, reveal its variable trace, and explain the first difference between two versions. A free, browser-local practice bench for beginner programmers.

Built for [Next Byte Hacks: V4](https://next-byte-hacks-v4.devpost.com/). New work began September 13, 2026 Pacific. Registered as a solo project on September 19; the Devpost entry remains a draft pending public release links and final review. The current operational deadline is September 30 at 8:45 PM PDT. Event evidence and external release steps live in [the batch brief](../2026-09-13-build-batch/README.md).

## Run and verify

Use a current Node.js release supported by Vite and npm. The implementation was verified with the installed runtime; exact versions are recorded in `docs/verification.md`.

```sh
npm ci
npm run dev
# Open http://127.0.0.1:4181

npm run check
npm audit --audit-level=moderate
```

`check` runs coverage, TypeScript and the production build, then desktop/mobile Playwright checks against the production preview on port 4183. Install Chromium with `npx playwright install chromium` if it is not already present. Keep port 4183 free. All fonts and runtime assets are bundled locally. There is no API key, account, runtime AI, analytics or subscription.

## Try the complete flow

1. Choose **The extra iteration**. Predict 15, then press **Predict & trace**.
2. Press **Next step** and watch `i`, `total` and the table change. **Finish** reveals all five iterations and the actual total, 10.
3. Press **Compare versions**. The inclusive alternative adds a sixth iteration and finishes at 15. The receipt names the first differing iteration rather than merely reporting different totals.
4. Export a Markdown debug receipt with both configurations, the recorded prediction and both complete trace previews.
5. Try **A countdown that climbs**. The original cannot terminate in this integer model. Its 200-row preview is explicitly partial; the alternative counts down correctly.
6. Edit the start, end, step, comparison or accumulation to create a custom experiment. It survives reload. Reset returns to the first sample.

Blank, fractional and out-of-range inputs cannot run. Zero-iteration loops are explained. Corrupt saved state is reported and left untouched until the user edits or resets. If browser storage is unavailable, exploration and receipt export still work.

## Understand the code

```text
ConfigEditor → validated Config → simulate → immutable trace rows
                                      ↓
prediction + cursor → TracePanel → compare → Markdown receipt
                                      ↓
                       versioned browser-local storage
```

- `src/domain.ts`: the bounded integer model, the three challenges, first-difference comparison and receipt formatting. Pure functions make calculations independently testable.
- `src/ConfigEditor.tsx`: input controls; empty fields remain invalid rather than silently becoming zero.
- `src/App.tsx`: selected experiment, prediction, revealed run, comparison and save/export actions. Editing the original invalidates the old run so stale evidence cannot be presented as current.
- `src/TracePanel.tsx`: reveals existing immutable rows with a cursor. Stepping changes what is visible; it does not execute user code.
- `src/storage.ts`: versioned schema checks and safe local-storage access. `custom` is an explicit valid experiment state.
- `tests/learning.spec.ts`: production-browser proof for learning, exports, custom persistence, invalid input and damaged-save recovery.

Try predicting the output for start `5`, end `0`, comparison `>`, step `-2`, accumulation `sum`. Then trace it and compare to step `-1`. The first row has the same accumulator but a different next value; this is why comparison checks the entire execution row.

## Scope and tradeoffs

This is a simulator for configurable integer loops, **not a JavaScript interpreter**. It never uses `eval` or executes pasted source. The shown loop is an explanatory rendering of the selected configuration. Inputs are safe integers between -1,000,000 and 1,000,000, and traces contain at most 200 iterations. Larger terminating loops show partial totals; identical partial prefixes do not prove complete equivalence. There are no nested loops, floating-point semantics or external side effects.

The client-only design avoids server costs and keeps work on the current browser profile. It does not provide cross-device sync. This is educational tooling; no classroom learning improvement or adoption has been measured.

## Submission materials

- [Devpost draft](docs/submission-draft.md)
- [Demo script](docs/demo-script.md)
- [Verification receipt](docs/verification.md)
- [Actual screenshots and captioned walkthrough](docs/media/README.md)
- [Credits and AI disclosure](docs/credits.md)

The static Vite build uses relative asset URLs for a future GitHub Pages project site. `dist/` is generated output, not a claimed public deployment.

## Attribution

Codex assisted ideation, design, code, tests and documentation. The entrant must review and understand the implementation before submitting. React, Vite, TypeScript, Radix Icons, Geist, Vitest, Testing Library and Playwright are credited in [credits](docs/credits.md). Loop tracing is an established educational technique; no claim of inventing it is made.
