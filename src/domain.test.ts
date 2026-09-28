import { describe, expect, it } from "vitest";
import {
  challenges,
  codeFor,
  compare,
  receipt,
  simulate,
  validateConfig,
  type Config,
} from "./domain";

const base: Config = {
  start: 0,
  end: 3,
  step: 1,
  operator: "<",
  operation: "sum",
};
describe("loop simulation", () => {
  it("records every accumulator and increment for sum", () => {
    expect(simulate(base)).toMatchObject({
      complete: true,
      total: 3,
      steps: [
        { iteration: 1, i: 0, before: 0, after: 0, next: 1 },
        { iteration: 2, i: 1, before: 0, after: 1, next: 2 },
        { iteration: 3, i: 2, before: 1, after: 3, next: 3 },
      ],
    });
  });
  it("supports inclusive, descending and count loops", () => {
    expect(simulate({ ...base, operator: "<=" }).total).toBe(6);
    expect(
      simulate({
        ...base,
        start: 3,
        end: 0,
        step: -1,
        operator: ">",
        operation: "count",
      }).total,
    ).toBe(3);
    expect(
      simulate({ ...base, start: 3, end: 0, step: -1, operator: ">=" }).total,
    ).toBe(6);
  });
  it("treats an initially false condition as complete even with zero or wrong step", () => {
    expect(simulate({ ...base, start: 4, step: 0 })).toMatchObject({
      complete: true,
      steps: [],
      total: 0,
    });
  });
  it("caps long finite loops and diagnoses nonterminating loops", () => {
    const long = simulate({ ...base, end: 201 });
    expect(long.steps).toHaveLength(200);
    expect(long.complete).toBe(false);
    expect(long.message).toContain("200");
    expect(simulate({ ...base, step: 0 }).message).toMatch(/zero|never/i);
    expect(simulate({ ...base, step: -1 }).message).toMatch(/away|direction/i);
    expect(
      simulate({ ...base, start: 3, end: 0, operator: ">", step: 1 }).complete,
    ).toBe(false);
    expect(simulate({ ...base, end: 200 }).complete).toBe(true);
  });
  it("rejects malformed, unsafe, fractional and out-of-range configurations", () => {
    for (const candidate of [
      null,
      {},
      { ...base, start: NaN },
      { ...base, end: Infinity },
      { ...base, step: 0.1 },
      { ...base, start: 1000001 },
      { ...base, operator: "==" },
      { ...base, operation: "multiply" },
    ]) {
      expect(validateConfig(candidate)).not.toBeNull();
      expect(simulate(candidate as Config)).toMatchObject({
        complete: false,
        steps: [],
        total: 0,
      });
    }
    expect(validateConfig(base)).toBeNull();
  });
});
describe("comparison and learning evidence", () => {
  it("finds extra rows and the earliest differing value", () => {
    expect(
      compare(simulate(base), simulate({ ...base, operator: "<=" })).iteration,
    ).toBe(4);
    expect(
      compare(simulate(base), simulate({ ...base, step: 2 })).iteration,
    ).toBe(1);
    expect(
      compare(simulate(base), simulate({ ...base, operation: "count" }))
        .iteration,
    ).toBe(1);
    expect(
      compare(simulate({ ...base, operator: "<=" }), simulate(base)).iteration,
    ).toBe(4);
  });
  it("checks i, before and after as well as next", () => {
    const a = simulate(base);
    for (const key of ["i", "before", "after", "next"] as const) {
      const b = {
        ...a,
        steps: a.steps.map((step, index) =>
          index === 0 ? { ...step, [key]: step[key] + 1 } : step,
        ),
      };
      expect(compare(a, b).iteration).toBe(1);
    }
  });
  it("distinguishes matching complete traces from unproven incomplete traces", () => {
    expect(compare(simulate(base), simulate(base))).toMatchObject({
      iteration: null,
      description: expect.stringMatching(/complete|match/i),
    });
    const partial = simulate({ ...base, end: 300 });
    expect(compare(partial, partial).description).toMatch(
      /cannot|not prove|unproven/i,
    );
    const empty = simulate({ ...base, start: 4 });
    expect(compare(empty, empty).iteration).toBeNull();
  });
  it("exports three usable challenges and runnable-looking loop code", () => {
    expect(challenges).toHaveLength(3);
    expect(new Set(challenges.map((c) => c.id)).size).toBe(3);
    for (const challenge of challenges) {
      expect(validateConfig(challenge.config)).toBeNull();
      expect(validateConfig(challenge.alternative)).toBeNull();
      expect(challenge.hint.length).toBeGreaterThan(10);
    }
    expect(codeFor(base)).toContain("i < 3");
    expect(codeFor({ ...base, operation: "count" })).toContain("total += 1");
  });
  it("puts prediction, both code snippets, exact trace and divergence into receipt", () => {
    const output = receipt(base, { ...base, operator: "<=" }, "I predict six.");
    expect(output).toContain("I predict six.");
    expect(output).toContain("i <= 3");
    expect(output).toContain("| 3 | 2 | 1 | 3 | 3 |");
    expect(output).toMatch(/iteration 4/i);
    expect(receipt(base, base, "")).toMatch(/No prediction/i);
  });
});
