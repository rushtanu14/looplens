import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";
import { STORAGE_KEY } from "./storage";

describe("learning flow", () => {
  it("explains a loop whose condition is false before the first iteration", async () => {
    const user = userEvent.setup(); render(<App />);
    await user.clear(screen.getByLabelText('Original start'));
    await user.type(screen.getByLabelText('Original start'), '9');
    await user.click(screen.getByRole('button', {name:'Trace without prediction'}));
    expect(screen.getByText('No iterations: the initial condition is false.')).toBeInTheDocument();
    expect(screen.getByRole('button', {name:'Next step'})).toBeDisabled();
  });
  it("keeps results hidden until prediction then exposes a stepped trace and first divergence", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(
      screen.queryByRole("table", { name: "Iteration trace" }),
    ).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Your predicted total"), "15");
    await user.click(screen.getByRole("button", { name: "Predict & trace" }));
    await user.click(screen.getByRole("button", { name: "Next step" }));
    expect(
      within(
        screen.getByRole("table", { name: "Iteration trace" }),
      ).getAllByRole("row"),
    ).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Finish trace" }));
    expect(
      screen.getByText("Your prediction: 15. Observed total: 10."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Compare versions" }));
    expect(
      screen.getByText(/First difference: iteration 6/),
    ).toBeInTheDocument();
  });
  it("invalidates trace on edit and blocks blank numeric fields", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", { name: "Trace without prediction" }),
    );
    await user.clear(screen.getByLabelText("Original start"));
    expect(
      screen.queryByRole("table", { name: "Iteration trace" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Trace without prediction" }),
    ).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Enter an integer");
    expect(screen.getByText("Complete valid loop fields to preview the code.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Original loop pseudocode")).not.toBeInTheDocument();
  });
  it("recovers malformed browser state and resets predictably", async () => {
    localStorage.setItem(STORAGE_KEY, "{bad");
    const user = userEvent.setup();
    render(<App />);
    expect(
      screen.getByText(/Saved session could not be read/),
    ).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{bad");
    await user.type(screen.getByLabelText("Your predicted total"), "99");
    await user.click(screen.getByRole("button", { name: "Reset workspace" }));
    expect(screen.getByLabelText("Your predicted total")).toHaveValue(null);
    expect(screen.getByLabelText("Original start")).toHaveValue(0);
  });
  it("persists a custom loop and restores it on remount", async () => {
    const user = userEvent.setup();
    const view = render(<App />);
    await user.clear(screen.getByLabelText("Original start"));
    await user.type(screen.getByLabelText("Original start"), "2");
    view.unmount();
    render(<App />);
    expect(screen.getByLabelText("Original start")).toHaveValue(2);
    expect(screen.getByText("Your own experiment")).toBeInTheDocument();
  });
});
