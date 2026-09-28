import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";
import { codeFor, type Config, type SimulationResult } from "./domain";

export default function TracePanel({
  config,
  result,
  cursor,
  setCursor,
  prediction,
}: {
  config: Config | null;
  result: SimulationResult | null;
  cursor: number;
  setCursor: (value: number) => void;
  prediction: string;
}) {
  const step = result?.steps[cursor - 1];
  const shown = result?.steps.slice(0, cursor) ?? [];
  const done = result !== null && cursor === result.steps.length;
  const numbers = [0, ...shown.map((row) => row.after)];
  const min = Math.min(...numbers),
    range = Math.max(...numbers) - min || 1;
  const points = numbers
    .map(
      (value, index) =>
        `${18 + (index * 564) / Math.max(numbers.length - 1, 1)},${82 - ((value - min) * 60) / range}`,
    )
    .join(" ");
  return (
    <section className="trace-panel" aria-labelledby="trace-title">
      <div className="panel-heading">
        <h2 id="trace-title">
          02 <span>Follow the trace</span>
        </h2>
        <span className="trace-badge">
          {result
            ? `${cursor} / ${result.steps.length} steps`
            : "Ready when you are"}
        </span>
      </div>
      <div className="code-area">
        <span className="file-label">
          loop.js <span>• bounded simulator</span>
        </span>
        {config ? (
          <pre aria-label="Original loop pseudocode">
            <code>{codeFor(config)}</code>
          </pre>
        ) : (
          <p>Complete valid loop fields to preview the code.</p>
        )}
      </div>
      {!result ? (
        <div className="trace-empty">
          <div className="empty-symbol" aria-hidden="true">
            ↳
          </div>
          <h3>Before you run, make a guess.</h3>
          <p>
            Then watch <code>i</code> and <code>total</code> change, one
            iteration at a time. Every value has a reason.
          </p>
          <span className="tiny-label">
            START → CHECK → ADD → STEP → REPEAT
          </span>
        </div>
      ) : (
        <>
          <div className="state-strip" aria-live="polite">
            <div>
              <span>Iteration</span>
              <strong>{cursor}</strong>
            </div>
            <div>
              <span>Current i</span>
              <strong>{step?.i ?? config?.start ?? "—"}</strong>
            </div>
            <div>
              <span>Total so far</span>
              <strong>{step?.after ?? 0}</strong>
            </div>
          </div>
          <div className="trace-explanation" role="status">
            {step ? (
              <>
                At i = <b>{step.i}</b>, total changes from <b>{step.before}</b>{" "}
                to <b>{step.after}</b>. Next i is <b>{step.next}</b>.
              </>
            ) : (
              "Start with total = 0. Check the condition before the first iteration."
            )}
          </div>
          <figure className="trace-graph">
            <figcaption>Total after each revealed iteration</figcaption>
            <svg
              viewBox="0 0 600 100"
              role="img"
              aria-label={`Totals: ${numbers.join(", ")}`}
            >
              <line
                x1="18"
                y1="82"
                x2="582"
                y2="82"
                stroke="currentColor"
                opacity=".2"
              />
              <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              {numbers.length < 25 &&
                numbers.map((n, i) => (
                  <circle
                    key={i}
                    cx={18 + (i * 564) / Math.max(numbers.length - 1, 1)}
                    cy={82 - ((n - min) * 60) / range}
                    r="3.5"
                    fill="currentColor"
                  />
                ))}
            </svg>
          </figure>
          <div className="trace-controls">
            <button
              aria-label="Previous step"
              disabled={cursor === 0}
              onClick={() => setCursor(cursor - 1)}
            >
              <ArrowLeftIcon />
              Previous
            </button>
            <button
              className="primary"
              aria-label="Next step"
              disabled={done}
              onClick={() => setCursor(cursor + 1)}
            >
              Next step
              <ArrowRightIcon />
            </button>
            <button
              aria-label="Finish trace"
              disabled={done}
              onClick={() => setCursor(result.steps.length)}
            >
              Finish
              <DoubleArrowRightIcon />
            </button>
          </div>
          {done && (
            <div
              className={`result-note ${result.complete ? "" : "warning"}`}
              role="status"
            >
              <strong>
                {result.complete
                  ? "Trace complete"
                  : "Trace stopped, result incomplete"}
              </strong>
              <p>{result.message}</p>
              {prediction && (
                <p>
                  {result.complete
                    ? `Your prediction: ${prediction}. Observed total: ${result.total}.`
                    : `Your prediction: ${prediction}. Partial total: ${result.total}; this is not a final result.`}
                </p>
              )}
            </div>
          )}
          <div className="table-scroll">
            <table aria-label="Iteration trace">
              <thead>
                <tr>
                  <th>Iteration</th>
                  <th>i</th>
                  <th>Before</th>
                  <th>After</th>
                  <th>Next i</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((row) => (
                  <tr
                    key={row.iteration}
                    className={row.iteration === cursor ? "active-row" : ""}
                  >
                    <td>{row.iteration}</td>
                    <td>{row.i}</td>
                    <td>{row.before}</td>
                    <td>{row.after}</td>
                    <td>{row.next}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cursor === 0 && (
              <p className="table-placeholder">
                {result.steps.length === 0
                  ? 'No iterations: the initial condition is false.'
                  : 'Press Next step to reveal the first row.'}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
