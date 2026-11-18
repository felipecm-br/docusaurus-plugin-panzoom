# docusaurus-plugin-panzoom

This plugin adds the ability to pan and zoom images and SVG images inside of a Docusaurus website. This is useful for
embedding diagrams or complex mermaid.js renders around models and object schemas. The normal theme doesn't scale
tremendously well in a browser so some augmentation for complex diagrams is necessary.

This implements the excellent [@panzoom/panzoom](https://www.npmjs.com/package/@panzoom/panzoom) plugin.

## Installation

```bash
npm install @fdevbr/docusaurus-plugin-panzoom
```

```javascript
// In docusaurus.config.js
// ...
plugins: ['@fdevbr/docusaurus-plugin-panzoom'],
// or
plugins: [['@fdevbr/docusaurus-plugin-panzoom', {} /* options */]],
```

## Configuration

The plugin accepts the following configuration options:

```javascript
// In docusaurus.config.js
// ...
themeConfig: {
  zoom: {
    // A list of selectors to look for elements to enable pan and zoom
    // Default: ['div.mermaid[data-processed="true"]', 'div.docusaurus-mermaid-container', '.drawio']
    selectors: ['div.mermaid[data-processed="true"]', '.drawio'],

    // Whether to wrap the panzoom items in a div with overflow:hidden
    // This constrains the pan zoom detail into the original container
    // Default: true
    wrap: true,

    // The amount of time to wait in MS before the plugin client module tries to look for
    // and alter pan zoom elements. Some renders take a little bit before they appear in the dom.
    // Default: 1000
    timeout: 1000,

    // Add this class to any element within the Panzoom element that you want to exclude from
    // Panzoom handling. That element's children will also be excluded.
    // Default: 'panzoom-exclude'
    excludeClass: 'panzoom-exclude',

    // Whether the plain mouse wheel zooms the element instead of scrolling the page.
    // Default: false
    enableWheelZoom: false,

    // Whether to enable zooming with the mouse wheel while holding the shift key.
    // Works independently of enableWheelZoom.
    // Default: false
    enableWheelZoomWithShift: false,

    // Whether to enable zooming with the mouse wheel while holding Ctrl (Cmd on macOS).
    // Trackpad pinch also zooms. Works independently of enableWheelZoom. While the plain
    // wheel scrolls the page, a short "Ctrl + scroll to zoom" hint appears over the element.
    // Default: true
    enableWheelZoomWithCtrl: true,

    // Whether to enable double-click to reset zoom.
    // Default: true
    enableDoubleClickResetZoom: true,

    // Whether to restrict zooming out beyond the original size of the element.
    // Default: false
    restrictZoomOutBeyondOrigin: false,

    // Toolbar options: shows zoom in, zoom out, and reset buttons.
    toolbar: {
      // Whether to show the toolbar.
      // Default: false
      enabled: false,

      // Toolbar position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
      // Default: 'top-right'
      position: 'top-right',

      // Toolbar opacity when not hovered (0 to 1). Becomes fully opaque on hover.
      // Default: 0
      opacity: 0,
    },

    // Expand feature: adds an expand button to the toolbar.
    // Requires toolbar.enabled: true
    expand: {
      // Whether to show the expand button in the toolbar.
      // Default: false
      enabled: false,

      // 'inline': hides the sidebar, TOC, navbar, and site footer so the diagram fills the page.
      // 'modal': opens a copy of the diagram in a full-screen dialog with its own pan and zoom.
      // Default: 'inline'
      mode: 'inline',
    },

    // Copy feature: adds a button that copies the Mermaid source of diagrams rendered by
    // @docusaurus/theme-mermaid. Other elements get no button.
    // Requires toolbar.enabled: true
    copy: {
      // Default: false
      enabled: false,
    },

    // You can also pass any options supported by @panzoom/panzoom
    // See: https://github.com/timmywil/panzoom for available options
  }
}
```

## Upgrading from 1.x

Version 2.0 stops page scrolling from zooming or moving diagrams:

- The plain mouse wheel scrolls the page and shows a short "Ctrl + scroll to zoom" hint. Zoom with Ctrl (Cmd) + wheel
  or a trackpad pinch.
- On touch screens, one finger scrolls the page and two fingers pan and pinch-zoom.

To keep the 1.x behavior, set `enableWheelZoom: true` and `touchAction: 'none'` in `themeConfig.zoom`.

## Interactions

- **Mouse**: drag to pan, Ctrl (Cmd) + wheel to zoom, double-click to reset.
- **Touch**: one finger scrolls the page, two fingers pan and pinch-zoom. The toolbar is always visible.
- **Keyboard**: the toolbar shows while a button has focus. In the full-screen dialog, `+` / `-` zoom, `0` resets, the
  arrow keys pan, and `Escape` closes it; focus stays inside the dialog.
- **Accessibility**: every button has an accessible name, copy results are announced, colors follow the light and dark
  theme, and `prefers-reduced-motion` turns off animations.

Any [@panzoom/panzoom](https://github.com/timmywil/panzoom) option goes directly in `themeConfig.zoom`, for example
`cursor: 'pointer'` or `touchAction: 'none'`.

## Expand Feature

When `expand.enabled` is set to `true`, an expand button appears in the toolbar. `expand.mode` picks what it does.

### In-page mode (`mode: 'inline'`, default)

Clicking the button (or pressing `Escape` to exit) triggers the following behaviour:

**On expand:**

- Hides the sidebar, table-of-contents column, navbar, and site footer
- Stretches the main content area to near-full-width
- Scrolls to the top of the page so the diagram is immediately visible
- The toolbar buttons become `position: fixed` so they stay on screen while panning/zooming

**On collapse:**

- Restores all hidden elements
- Smoothly scrolls back to the diagram so you don't lose your place
- The toolbar expand button icon resets correctly (including when closed via `Escape`)

```javascript
themeConfig: {
  zoom: {
    toolbar: { enabled: true },
    expand: { enabled: true },
  }
}
```

### Full-screen dialog (`mode: 'modal'`)

Opens a copy of the element in a full-screen dialog. The original element keeps its pan and zoom state.

- The diagram is scaled to fit the screen when the dialog opens
- Drag to pan; the wheel always zooms inside the dialog
- The same toolbar as the page (zoom in, zoom out, reset, pin, copy), with a close button in place of expand;
  double-click resets
- Close with the close button, `Escape`, or a click on the backdrop; focus returns to the expand button

```javascript
themeConfig: {
  zoom: {
    toolbar: { enabled: true },
    expand: { enabled: true, mode: 'modal' },
  }
}
```

## Copy Feature

When `copy.enabled` is set to `true`, Mermaid diagrams rendered by `@docusaurus/theme-mermaid` get a copy button that
puts the diagram source on the clipboard. The icon turns into a check mark for a moment after copying. Images, draw.io
diagrams, and other elements have no source, so they get no button.

```javascript
themeConfig: {
  zoom: {
    toolbar: { enabled: true },
    copy: { enabled: true },
  }
}
```

> [!NOTE] This package is a fork of
> [@r74tech/docusaurus-plugin-panzoom](https://github.com/r74tech/docusaurus-plugin-panzoom), which itself is a fork of
> [act-org/docusaurus-plugin-panzoom](https://github.com/act-org/docusaurus-plugin-panzoom), under the MIT license.
>
> Changes introduced in this fork (`@fdevbr`):
>
> - **In-page expand mode**: adds an expand button that hides the sidebar, TOC, navbar, and site footer and expands the
>   diagram to near-full-width inline, without opening a dialog.
> - **Fixed toolbar in expand mode**: toolbar buttons stay pinned to the viewport corner while panning.
> - **Scroll to top on expand**: the page scrolls to the top when expand mode is activated.
> - **Scroll back on collapse**: the page scrolls back to the diagram when expand mode is exited.
> - **Full-screen dialog**: `expand.mode: 'modal'` opens the diagram in a dialog instead.
> - **Copy Mermaid source**: `copy.enabled` adds a button that copies the diagram source.
> - **Touch-friendly page scrolling**: one finger scrolls the page over a diagram, two fingers pan and zoom.
> - **Keyboard, screen reader, dark theme and reduced motion support** for the toolbar and the full-screen dialog.
> - **Ctrl + wheel zoom by default**: scrolling the page over a diagram no longer zooms it. Zoom with Ctrl (Cmd) +
>   wheel or a trackpad pinch; a hint says so when you scroll. Set `enableWheelZoom: true` for the old behavior.
>
> If you don't need these features, consider using
> [@r74tech/docusaurus-plugin-panzoom](https://www.npmjs.com/package/@r74tech/docusaurus-plugin-panzoom) directly.

## License

MIT, see [LICENSE](LICENSE) for more details.
