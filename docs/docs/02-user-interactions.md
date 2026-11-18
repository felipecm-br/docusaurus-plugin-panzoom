# User Interactions

For elements with pan and zoom functionality enabled, users can:

- **Pan**: Click and drag the element to move the view area
- **Zoom**: Hold Ctrl (Cmd on macOS) and use the mouse wheel, or pinch on a trackpad. The plain wheel keeps scrolling
  the page and shows a short "Ctrl + scroll to zoom" hint over the element. Set `enableWheelZoom: true` to zoom with the
  plain wheel, or `enableWheelZoomWithShift: true` to zoom with Shift + wheel
- **Reset**: Double-click the element to reset to the original view state

## Touch screens

- **One finger** scrolls the page, even when it lands on the element. The element stays where it is.
- **Two fingers** pan and pinch-zoom the element.
- The toolbar is always visible, since touch screens have no hover.
- In the full-screen dialog, one finger pans.

To pan with one finger on the page instead, set `touchAction: 'none'` (this also stops one-finger page scrolling over
the element).

## Keyboard

- `Tab` reaches the toolbar buttons, and the toolbar becomes visible while one of them has focus.
- In the full-screen dialog, focus stays inside the dialog. `+` and `-` zoom, `0` resets, the arrow keys pan, and
  `Escape` closes it and returns focus to the expand button.
- With the in-page expand, `Escape` collapses the element.

Every toolbar button has an accessible name, the pin button reports its state with `aria-pressed`, the in-page expand
button reports `aria-expanded`, and copy results are announced to screen readers.

## Reduced motion

When the operating system asks for reduced motion (`prefers-reduced-motion: reduce`), zoom buttons and reset jump
straight to the new view, the toolbar and hints appear without fading, and expanding scrolls without animation.

If the toolbar is enabled, users can also use the toolbar buttons to zoom in, zoom out, and reset the view. See the
[Configuration](03-getting-started/02-configuration.md) section to learn how to enable/disable the toolbar.

## Pinning to select text

The toolbar also has a pin button. Pinning suspends pan and zoom while keeping the current view, so that users can
select and copy the text inside the element (e.g. labels of a diagram). While pinned:

- dragging selects text instead of panning, and the cursor behaves as usual (e.g. a text cursor over text)
- the mouse wheel scrolls the page instead of zooming
- double-clicking selects a word instead of resetting the view
- the zoom buttons are disabled and the toolbar stays visible

Click the pin button again to resume pan and zoom.
