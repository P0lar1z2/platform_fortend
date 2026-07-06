# Raventik Frontend Agent Notes

## Mobile First Verification

- Every user-facing UI or interaction change must consider mobile behavior, especially iOS-sized viewports.
- Before reporting a frontend change as complete, verify the affected flow at a mobile viewport as well as desktop when practical.
- Controls must remain tappable, text must not collapse into vertical characters, dialogs must fit the viewport, and scrolling/closing behavior must work on touch screens.
- If mobile verification cannot be completed, explicitly report the gap and the reason.

