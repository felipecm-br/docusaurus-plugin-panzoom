# Introduction

**docusaurus-plugin-panzoom** is a plugin that adds pan and zoom functionality to images and SVG elements in Docusaurus
websites.

## Overview

Complex diagrams and charts, especially those generated with [Mermaid](https://mermaid-js.github.io/mermaid/), can be
difficult to examine in detail in a browser. This plugin allows users to drag to move (pan) and zoom in or out of
diagrams for better visibility.

This plugin implements the excellent [@panzoom/panzoom](https://www.npmjs.com/package/@panzoom/panzoom) library.

## Key Features

- Adds pan and zoom functionality to images, SVG elements, or any other HTML elements in Docusaurus
- Works with [Mermaid](https://mermaid-js.github.io/mermaid/) generated diagrams
- Customizable selectors to target specific elements
- Option to wrap elements to contain them within their original container
- Scrolling the page never zooms by accident: zoom with Ctrl (Cmd) + wheel or a trackpad pinch, and a hint says so
- On touch screens, one finger scrolls the page and two fingers pan and pinch-zoom
- Options to zoom with the plain wheel or with Shift + wheel instead
- Option to use double-click to reset the zoom
- Option to restrict zooming out beyond the original size of the element
- Toolbar for zooming in and out, resetting the view, and pinning the view to select text
- Expand an element in the page or in a full-screen dialog with its own pan and zoom
- Copy the source of Mermaid diagrams
- Keyboard and screen reader support, light and dark themes, and reduced motion

## Note

This package (`@fdevbr/docusaurus-plugin-panzoom`) is a fork of
[r74tech/docusaurus-plugin-panzoom](https://github.com/r74tech/docusaurus-plugin-panzoom), itself a fork of
[act-org/docusaurus-plugin-panzoom](https://github.com/act-org/docusaurus-plugin-panzoom), under the MIT license. It
adds the expand, copy, touch, keyboard and theming features above and keeps merging upstream fixes.

## License

MIT, see [LICENSE](https://github.com/felipecm-br/docusaurus-plugin-panzoom/blob/main/LICENSE) for more details.
