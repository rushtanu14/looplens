export type Config = {
  start: number;
  end: number;
  step: number;
  operator: "<" | "<=" | ">" | ">=";
  operation: "sum" | "count";
};
export type Step = {
  iteration: number;
  i: number;
  before: number;
  after: number;
  next: number;
};
export type SimulationResult = {
  steps: readonly Step[];
  total: number;
  complete: boolean;
  message: string;
};
export type Challenge = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  hint: string;
  config: Config;
  alternative: Config;
};
const LIMIT = 200;

export function validateConfig(value: unknown): string | null {
  if (typeof value !== "object" || value === null)
    return "Enter a loop configuration.";
  const candidate = value as Record<string, unknown>;
  for (const key of ["start", "end", "step"]) {
    const number = candidate[key];
    if (
      typeof number !== "number" ||
      !Number.isSafeInteger(number) ||
      Math.abs(number) > 1_000_000
    ) {
      return `${key[0].toUpperCase()}${key.slice(1)} must be a whole number between −1,000,000 and 1,000,000.`;
    }
  }
  if (!["<", "<=", ">", ">="].includes(candidate.operator as string))
    return "Choose a supported comparison operator.";
  if (!["sum", "count"].includes(candidate.operation as string))
    return "Choose sum or count.";
  return null;
}

function condition(i: number, config: Config): boolean {
  switch (config.operator) {
    case "<":
      return i < config.end;
    case "<=":
      return i <= config.end;
    case ">":
      return i > config.end;
    case ">=":
      return i >= config.end;
  }
}

export function simulate(config: Config): SimulationResult {
  const error = validateConfig(config);
  if (error) return { steps: [], total: 0, complete: false, message: error };
  // Array.from creates each row once; the following fold keeps prior state immutable.
  const initial = { steps: [] as readonly Step[], total: 0, i: config.start };
  const trace = Array.from({ length: LIMIT }).reduce(
    (state: typeof initial) => {
      if (!condition(state.i, config)) return state;
      const after = state.total + (config.operation === "sum" ? state.i : 1);
      const next = state.i + config.step;
      const row = {
        iteration: state.steps.length + 1,
        i: state.i,
        before: state.total,
        after,
        next,
      };
      return { steps: [...state.steps, row], total: after, i: next };
    },
    initial,
  );
  const complete = !condition(trace.i, config);
  const wrongDirection = config.operator.startsWith("<")
    ? config.step < 0
    : config.step > 0;
  const message = complete
    ? `Complete: ${trace.steps.length} iteration${trace.steps.length === 1 ? "" : "s"}. The condition is now false.`
    : config.step === 0
      ? "Step is zero: i never changes, so the condition never becomes false. Showing the first 200 iterations."
      : wrongDirection
        ? "The step moves i away from the stopping boundary. This loop does not terminate in this integer model; showing the first 200 iterations."
        : "Paused at 200 iterations. This finite loop needs more steps; the displayed total is partial.";
  return { steps: trace.steps, total: trace.total, complete, message };
}

export function compare(
  a: SimulationResult,
  b: SimulationResult,
): { iteration: number | null; description: string } {
  const count = Math.max(a.steps.length, b.steps.length);
  for (let index = 0; index < count; index += 1) {
    const left = a.steps[index];
    const right = b.steps[index];
    const iteration = index + 1;
    if (!left || !right) {
      const missing = !left ? a : b;
      if (!missing.complete)
        return {
          iteration: null,
          description:
            "One trace ends at a preview limit or invalid input. The available evidence cannot establish a first divergence.",
        };
      return {
        iteration,
        description: `First difference at iteration ${iteration}: ${!left ? "original" : "alternative"} has stopped, while ${!left ? "alternative" : "original"} executes another row.`,
      };
    }
    const field = (["i", "before", "after", "next"] as const).find(
      (key) => left[key] !== right[key],
    );
    if (field)
      return {
        iteration,
        description: `First difference at iteration ${iteration}: ${field} is ${left[field]} in the original and ${right[field]} in the alternative.`,
      };
  }
  return {
    iteration: null,
    description:
      a.complete && b.complete
        ? "Both complete execution traces match. These configurations produce the same trace and total."
        : "The available trace prefixes match, but an incomplete or invalid run cannot prove the complete loops identical.",
  };
}

export function codeFor(config: Config): string {
  return `let total = 0;\nfor (let i = ${config.start}; i ${config.operator} ${config.end}; i += ${config.step}) {\n  total += ${config.operation === "sum" ? "i" : "1"};\n}`;
}

function traceMarkdown(
  label: string,
  config: Config,
  result: SimulationResult,
): string {
  return `## ${label}\n\n\`\`\`js\n${codeFor(config)}\n\`\`\`\n\n${result.message}\n\n${result.complete ? "Final" : "Partial"} total: **${result.total}**\n\n| Iteration | i | Before | After | Next i |\n| --- | --- | --- | --- | --- |\n${result.steps.map((row) => `| ${row.iteration} | ${row.i} | ${row.before} | ${row.after} | ${row.next} |`).join("\n") || "| — | No iterations | — | — | — |"}`;
}

export function receipt(
  config: Config,
  alternative: Config,
  prediction: string,
): string {
  const originalRun = simulate(config);
  const alternativeRun = simulate(alternative);
  return `# LoopLens learning receipt\n\n## My prediction\n\n${prediction.trim() || "No prediction recorded."}\n\n## Comparison\n\n${compare(originalRun, alternativeRun).description}\n\n${traceMarkdown("Original loop", config, originalRun)}\n\n${traceMarkdown("Alternative loop", alternative, alternativeRun)}\n\n---\nGenerated locally by LoopLens. Each trace is limited to 200 iterations. Totals for incomplete runs are partial.\n`;
}

export const challenges: readonly Challenge[] = [
  {
    id: "off-by-one",
    title: "The extra iteration",
    subtitle: "01 / Boundaries",
    description:
      "Sum the numbers from 0 up to 5. What changes when the stopping condition includes 5?",
    hint: "Both loops visit 0 first. Look at whether 5 itself passes the condition.",
    config: { start: 0, end: 5, step: 1, operator: "<", operation: "sum" },
    alternative: {
      start: 0,
      end: 5,
      step: 1,
      operator: "<=",
      operation: "sum",
    },
  },
  {
    id: "wrong-direction",
    title: "A countdown that climbs",
    subtitle: "02 / Direction",
    description:
      "Count down from 5 while i is greater than 0. Does adding 1 ever get you to the stopping boundary?",
    hint: "A countdown needs to make i smaller. Inspect the next i value in the very first row.",
    config: { start: 5, end: 0, step: 1, operator: ">", operation: "count" },
    alternative: {
      start: 5,
      end: 0,
      step: -1,
      operator: ">",
      operation: "count",
    },
  },
  {
    id: "skip-by-two",
    title: "Every other number",
    subtitle: "03 / Step size",
    description:
      "Sum values below 10. Predict which numbers disappear when the step grows from 1 to 2.",
    hint: "The increment changes immediately, but the accumulator can still match on the first row.",
    config: { start: 0, end: 10, step: 1, operator: "<", operation: "sum" },
    alternative: {
      start: 0,
      end: 10,
      step: 2,
      operator: "<",
      operation: "sum",
    },
  },
];
