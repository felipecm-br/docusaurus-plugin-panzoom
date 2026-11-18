# Upgrading to 2.0

Version 2.0 changes how the wheel and touch behave over pan and zoom elements, so that scrolling a page never zooms or
moves a diagram by accident. Everything else is new and turned off unless you enable it.

## What changed

| Behavior                                 | 1.x               | 2.0                               |
| ---------------------------------------- | ----------------- | --------------------------------- |
| Plain mouse wheel over an element        | Zooms the element | Scrolls the page and shows a hint |
| Ctrl (Cmd) + wheel, trackpad pinch       | Zooms the element | Zooms the element                 |
| One-finger swipe over an element (touch) | Pans the element  | Scrolls the page                  |
| Two-finger gesture over an element       | Pans and zooms    | Pans and zooms                    |

The defaults behind this are `enableWheelZoom: false`, `enableWheelZoomWithCtrl: true` and `touchAction: 'pan-x pan-y'`.

## Keep the 1.x behavior

```js title="docusaurus.config.js"
module.exports = {
  themeConfig: {
    zoom: {
      enableWheelZoom: true, // the plain wheel zooms again
      touchAction: 'none', // one finger pans again
    },
  },
};
```

## New in 2.0

All of these need `toolbar.enabled: true`.

- `expand.mode: 'modal'` opens an element in a full-screen dialog with its own pan and zoom, and the same toolbar as the
  page. `'inline'` (the default) keeps the in-page expand.
- `copy.enabled: true` adds a button that copies the source of Mermaid diagrams.
- The toolbar follows the light and dark theme, is always shown on touch screens, and shows while a button has keyboard
  focus.

See [User Interactions](../02-user-interactions.md) and the
[Expand and Copy example](../04-examples/04-expand-dialog.md).
