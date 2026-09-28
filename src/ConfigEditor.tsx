import type { Config } from "./domain";
export default function ConfigEditor({
  config,
  onChange,
  prefix,
}: {
  config: Config;
  onChange: (config: Config) => void;
  prefix: string;
}) {
  return (
    <div className="config-fields">
      {(["start", "end", "step"] as const).map((key) => (
        <label key={key}>
          <span>
            {key === "end"
              ? "End bound"
              : key.charAt(0).toUpperCase() + key.slice(1)}
          </span>
          <input
            aria-label={`${prefix} ${key}`}
            type="number"
            step="1"
            min="-1000000"
            max="1000000"
            value={Number.isFinite(config[key]) ? config[key] : ""}
            onChange={(event) =>
              onChange({
                ...config,
                [key]:
                  event.target.value === "" ? NaN : Number(event.target.value),
              })
            }
          />
        </label>
      ))}
      <label className="condition-field">
        <span>Keep going while</span>
        <select
          aria-label={`${prefix} condition`}
          value={config.operator}
          onChange={(event) =>
            onChange({
              ...config,
              operator: event.target.value as Config["operator"],
            })
          }
        >
          <option value="<">i &lt; end</option>
          <option value="<=">i ≤ end</option>
          <option value=">">i &gt; end</option>
          <option value=">=">i ≥ end</option>
        </select>
      </label>
      <label className="operation-field">
        <span>On each iteration</span>
        <select
          aria-label={`${prefix} accumulation`}
          value={config.operation}
          onChange={(event) =>
            onChange({
              ...config,
              operation: event.target.value as Config["operation"],
            })
          }
        >
          <option value="sum">Add i to total</option>
          <option value="count">Add 1 to total</option>
        </select>
      </label>
    </div>
  );
}
