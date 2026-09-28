# LoopLens learning receipt

## My prediction

15

## Comparison

Both complete execution traces match. These configurations produce the same trace and total.

## Original loop

```js
let total = 0;
for (let i = 0; i <= 5; i += 1) {
  total += i;
}
```

Complete: 6 iterations. The condition is now false.

Final total: **15**

| Iteration | i | Before | After | Next i |
| --- | --- | --- | --- | --- |
| 1 | 0 | 0 | 0 | 1 |
| 2 | 1 | 0 | 1 | 2 |
| 3 | 2 | 1 | 3 | 3 |
| 4 | 3 | 3 | 6 | 4 |
| 5 | 4 | 6 | 10 | 5 |
| 6 | 5 | 10 | 15 | 6 |

## Alternative loop

```js
let total = 0;
for (let i = 0; i <= 5; i += 1) {
  total += i;
}
```

Complete: 6 iterations. The condition is now false.

Final total: **15**

| Iteration | i | Before | After | Next i |
| --- | --- | --- | --- | --- |
| 1 | 0 | 0 | 0 | 1 |
| 2 | 1 | 0 | 1 | 2 |
| 3 | 2 | 1 | 3 | 3 |
| 4 | 3 | 3 | 6 | 4 |
| 5 | 4 | 6 | 10 | 5 |
| 6 | 5 | 10 | 15 | 6 |

---
Generated locally by LoopLens. Each trace is limited to 200 iterations. Totals for incomplete runs are partial.
