# LoopLens design

## Scene and register
A teen sits with a laptop beside a paper notebook after school, trying to understand a stubborn loop in a well-lit room. A light cool paper surface makes values and code easy to compare; the dark navy trace workspace focuses attention on the active iteration. This is a product, not a marketing landing page.

## Visual system
Use cool tinted paper and navy ink with restrained yellow-green highlighting for the active step and primary run action. Errors use a muted red with explicit text. Typography is bundled Geist for interface and Geist Mono for code and numeric evidence. Buttons use crisp 8px corners, panels 12px; no decorative gradients, glass, nested cards or stock imagery.

## Structure
Compact wordmark and local save status. Short left-aligned page introduction, a challenge selector rail, then an asymmetric workspace: configuration and prediction to the left, live trace to the right. The trace has code above state variables, a data-derived loop path and a real value table. Comparison and a debug receipt follow. On narrow screens the rail becomes a wrapping row, the workspace becomes one column, and tables scroll inside their own region only.

## Interaction
Every action has a visible label. Native numeric fields and selects keep keyboard behavior familiar. A prediction starts a trace; skipping prediction is allowed through a separate button. Previous, next and finish actions expose each iteration. Changing the original loop resets the trace and comparison. The compared version is an editable alternative, not an assertion that an arbitrary loop is correct. Challenge hints give the intended fix.

## Accessibility and motion
Use semantic landmarks, labeled fields, visible focus, status announcements and a textual equivalent of the SVG trace. Controls have at least 44px targets. Only pointer button-press feedback moves, within 160ms. Keyboard actions have no animation; reduced motion disables movement. No autoplay, drag dependency, hover-only content or ornamental motion.

## Reference decision
The coordinating task inspected the live MotionSites homepage; the Apps route was inaccessible and Sections timed out. No suitable complete reference prompt was accessible. This original utility layout follows the actual compare-and-trace task; no template code or reference assets are copied.
