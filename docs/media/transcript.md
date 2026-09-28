# looplens — real browser walkthrough

Sound-off demonstration. Every product interaction recorded against the local running app.

## 00:00:00,122 · 01 / THE PROBLEM

A loop can look right and still stop one step too early. LoopLens makes each iteration visible.

## 00:00:08,124 · 02 / PREDICT

The original adds 0 through 4. The bound is 5, but the condition is strictly less than 5.

## 00:00:16,126 · 02 / PREDICT

Try a prediction of 15 before revealing the answer. A wrong guess becomes a testable explanation.

## 00:00:24,127 · 03 / TRACE

Run the bounded simulator. It starts at total = 0; no arbitrary code or model is executed.

## 00:00:31,129 · 03 / TRACE

The first iteration visits i = 0. Adding zero leaves total unchanged, and the next i is 1.

## 00:00:39,131 · 03 / TRACE

Advance again: i = 1 changes total from 0 to 1. The table and graph follow the same revealed rows.

## 00:00:47,133 · 04 / READ THE EVIDENCE

Finish the trace: five iterations produce 10. The recorded prediction of 15 does not match.

## 00:00:55,135 · 05 / CHANGE ONE THING

The alternative includes the end bound with ≤. Compare the two versions to test that change.

## 00:01:03,137 · 05 / CHANGE ONE THING

The first difference is iteration 6: the original has stopped, while the alternative visits 5.

## 00:01:11,138 · 06 / VERIFY THE REPAIR

Apply the inclusive boundary to the original, then rerun the same prediction.

## 00:01:19,139 · 06 / VERIFY THE REPAIR

Now there are six iterations and the total is 15. The new trace supports the original prediction.

## 00:01:27,141 · 07 / EXPORT

Both complete traces now match. Export a Markdown receipt containing the loops, prediction and rows.

## 00:01:36,143 · 08 / TAKEAWAY

Predict → trace → change → verify. A local learning tool for small integer loops, capped at 200 iterations.
