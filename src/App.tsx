import { useEffect, useState } from "react";
import {
  ArrowRightIcon,
  DownloadIcon,
  ResetIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import {
  challenges,
  compare,
  receipt,
  simulate,
  validateConfig,
  type Config,
  type SimulationResult,
} from "./domain";
import { loadState, saveState } from "./storage";
import ConfigEditor from "./ConfigEditor";
import TracePanel from "./TracePanel";

function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return {
      getItem: () => {
        throw Error("Unavailable");
      },
      setItem: () => {
        throw Error("Unavailable");
      },
    };
  }
}
function configError(config: Config) {
  if (![config.start, config.end, config.step].every(Number.isFinite))
    return "Enter an integer in every loop field.";
  return validateConfig(config);
}
export default function App() {
  const [loaded] = useState(() => loadState(browserStorage()));
  const defaults = challenges[0];
  const [config, setConfig] = useState<Config>(
    loaded.state?.config ?? defaults.config,
  );
  const [alternative, setAlternative] = useState<Config>(
    loaded.state?.alternative ?? defaults.alternative,
  );
  const [prediction, setPrediction] = useState(loaded.state?.prediction ?? "");
  const [challengeId, setChallengeId] = useState(
    loaded.state?.challengeId ?? defaults.id,
  );
  const [saved, setSaved] = useState(
    loaded.state ? "Saved session restored" : "Local workspace",
  );
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [cursor, setCursor] = useState(0);
  const [runPrediction, setRunPrediction] = useState("");
  const [compared, setCompared] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const selected = challenges.find((challenge) => challenge.id === challengeId);
  const error = configError(config),
    alternativeError = configError(alternative);
  const predictionValid =
    prediction.trim() !== "" && Number.isSafeInteger(Number(prediction));
  const altResult =
    compared && !alternativeError ? simulate(alternative) : null;
  const difference = result && altResult ? compare(result, altResult) : null;
  useEffect(() => {
    if (dirty && !error && !alternativeError)
      setSaved(
        saveState(browserStorage(), {
          config,
          alternative,
          prediction,
          challengeId,
        }) || "Saved in this browser",
      );
  }, [
    config,
    alternative,
    prediction,
    challengeId,
    error,
    alternativeError,
    dirty,
  ]);
  function invalidate() {
    setResult(null);
    setCursor(0);
    setCompared(false);
    setExportMessage("");
  }
  function selectChallenge(id: string) {
    const next = challenges.find((challenge) => challenge.id === id);
    if (!next) return;
    setDirty(true);
    setChallengeId(id);
    setConfig({ ...next.config });
    setAlternative({ ...next.alternative });
    setPrediction("");
    invalidate();
  }
  function run(withPrediction: boolean) {
    if (error || (withPrediction && !predictionValid)) return;
    setResult(simulate(config));
    setCursor(0);
    setRunPrediction(withPrediction ? prediction : "");
    setCompared(false);
    setExportMessage("");
  }
  function exportReceipt() {
    if (error || alternativeError) return;
    try {
      const url = URL.createObjectURL(
        new Blob([receipt(config, alternative, runPrediction)], {
          type: "text/markdown;charset=utf-8",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "looplens-debug-receipt.md";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportMessage("Debug receipt downloaded.");
    } catch {
      setExportMessage(
        "Download unavailable in this browser. Select and copy the comparison evidence below.",
      );
    }
  }
  return (
    <>
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <header className="app-header">
        <a className="brand" href="#">
          <span className="brand-mark" aria-hidden="true">
            ↳
          </span>
          LoopLens<span className="brand-tag">PRACTICE BENCH</span>
        </a>
        <span className="save-status" role="status">
          <span aria-hidden="true" className="status-dot" />
          {saved}
        </span>
      </header>
      <main>
        <section className="intro">
          <div className="intro-copy">
            <p className="eyebrow">A LITTLE LESS GUESSWORK</p>
            <h1>
              Follow the logic.
              <br />
              <span>Find the missing step.</span>
            </h1>
            <p>
              Predict a loop. Trace its values. Compare a change.
              <br className="desktop-break" /> Understand exactly where the two
              paths split.
            </p>
          </div>
          <div className="intro-aside">
            <span className="tiny-label">LIVE ITERATION SIGNAL</span>
            <span className="mono">i → total</span>
            <p>
              Small loops.
              <br />
              Clear explanations.
            </p>
          </div>
        </section>
        <nav className="challenges" aria-label="Practice challenges">
          {challenges.map((challenge, index) => (
            <button
              key={challenge.id}
              aria-pressed={challengeId === challenge.id}
              onClick={() => selectChallenge(challenge.id)}
            >
              <span className="challenge-number">0{index + 1}</span>
              <span>
                <strong>{challenge.title}</strong>
                <small>{challenge.subtitle}</small>
              </span>
              <ArrowRightIcon />
            </button>
          ))}
        </nav>
        <div className="workspace" id="workspace">
          <section className="setup-panel" aria-labelledby="setup-title">
            <div className="panel-heading">
              <h2 id="setup-title">
                01 <span>Set up your loop</span>
              </h2>
              <span className="tiny-label">
                {selected ? "CHALLENGE" : "CUSTOM LOOP"}
              </span>
            </div>
            <div className="challenge-copy">
              <h3>{selected?.title ?? "Your own experiment"}</h3>
              <p>
                {selected?.description ??
                  "Change any value or condition. Predict what happens, then let the trace show the evidence."}
              </p>
              {selected && (
                <details>
                  <summary>
                    <InfoCircledIcon />A hint, if you need one
                  </summary>
                  <p>{selected.hint}</p>
                </details>
              )}
            </div>
            <ConfigEditor
              prefix="Original"
              config={config}
              onChange={(value) => {
                setDirty(true);
                setConfig(value);
                setChallengeId("custom");
                invalidate();
              }}
            />
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="predict-box">
              <label htmlFor="prediction">Your predicted total</label>
              <p>Think it through before revealing the answer.</p>
              <input
                id="prediction"
                type="number"
                step="1"
                placeholder="Make a guess"
                value={prediction}
                onChange={(event) => {
                  setDirty(true);
                  setPrediction(event.target.value);
                }}
              />
              <button
                className="primary"
                disabled={!!error || !predictionValid}
                onClick={() => run(true)}
              >
                Predict &amp; trace
                <ArrowRightIcon />
              </button>
              <button
                className="text-button"
                disabled={!!error}
                onClick={() => run(false)}
              >
                Trace without prediction
              </button>
            </div>
            <p className="field-note">
              Integer values only. Every trace stops after 200 iterations. Your
              work stays in this browser.
            </p>
          </section>
          <TracePanel
            config={error ? null : config}
            result={result}
            cursor={cursor}
            setCursor={setCursor}
            prediction={runPrediction}
          />
        </div>
        <section className="compare-section" aria-labelledby="compare-title">
          <div className="section-intro">
            <p className="eyebrow">CHANGE ONE THING. SEE WHAT MOVES.</p>
            <h2 id="compare-title">03 &nbsp; Compare another version</h2>
            <p>
              Each challenge starts with two versions. Edit the alternative
              to test your own explanation.
            </p>
          </div>
          <div className="comparison-layout">
            <div>
              <ConfigEditor
                prefix="Alternative"
                config={alternative}
                onChange={(value) => {
                  setDirty(true);
                  setAlternative(value);
                  setCompared(false);
                  setExportMessage("");
                }}
              />
              {alternativeError && (
                <p className="error" role="alert">
                  {alternativeError}
                </p>
              )}
              <button
                className="ink-button"
                disabled={!result || !!alternativeError}
                onClick={() => {
                  setCompared(true);
                  setExportMessage("");
                }}
              >
                Compare versions
                <ArrowRightIcon />
              </button>
              {!result && (
                <p className="field-note">
                  Run the original loop to unlock comparison.
                </p>
              )}
            </div>
            <div className="comparison-evidence" aria-live="polite">
              {difference && altResult && result ? (
                <>
                  <span className="tiny-label">THE EVIDENCE</span>
                  <h3>
                    {difference.iteration === null
                      ? "No differing iteration found"
                      : `First difference: iteration ${difference.iteration}`}
                  </h3>
                  <p>{difference.description}</p>
                  <div className="result-pair">
                    <div>
                      <span>
                        Original {result.complete ? "total" : "partial total"}
                      </span>
                      <strong>{result.total}</strong>
                      <small>
                        {result.steps.length} iterations ·{" "}
                        {result.complete ? "complete" : "incomplete"}
                      </small>
                    </div>
                    <div>
                      <span>
                        Alternative{" "}
                        {altResult.complete ? "total" : "partial total"}
                      </span>
                      <strong>{altResult.total}</strong>
                      <small>
                        {altResult.steps.length} iterations ·{" "}
                        {altResult.complete ? "complete" : "incomplete"}
                      </small>
                    </div>
                  </div>
                  <p className="field-note">{altResult.message}</p>
                </>
              ) : (
                <>
                  <span className="tiny-label">
                    YOUR DEBUG RECEIPT STARTS HERE
                  </span>
                  <h3>Two versions. One clear difference.</h3>
                  <p>
                    Compare to see the first iteration where the values
                    disagree, even if the final totals happen to match.
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="receipt-row">
            <div>
              <h3>Take the explanation with you.</h3>
              <p>
                Download both loops, your prediction and the full trace as
                Markdown.
              </p>
            </div>
            <button
              className="outline-button"
              disabled={!compared || !!error || !!alternativeError}
              onClick={exportReceipt}
            >
              <DownloadIcon />
              Export debug receipt
            </button>
          </div>
          <p className="download-status" role="status">
            {exportMessage}
          </p>
        </section>
        <footer>
          <p>
            LoopLens <span>·</span> Built for understanding, one iteration at a
            time.
          </p>
          <button
            className="text-button"
            onClick={() => selectChallenge(defaults.id)}
          >
            <ResetIcon />
            Reset workspace
          </button>
        </footer>
        {loaded.message && !dirty && (
          <p className="recovery-message" role="status">
            {loaded.message}
          </p>
        )}
      </main>
    </>
  );
}
