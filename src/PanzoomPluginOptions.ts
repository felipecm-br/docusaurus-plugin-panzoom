import type { PanzoomOptions } from '@panzoom/panzoom';

export enum PanZoomPluginToolbarPosition {
  TopRight = 'top-right',
  TopLeft = 'top-left',
  BottomRight = 'bottom-right',
  BottomLeft = 'bottom-left',
}

export type PanZoomPluginOptions = PanzoomOptions & {
  /**
   * A list of selectors to look for elements to enable pan and zoom
   *
   * The default value is ['div.mermaid[data-processed="true"]', '.drawio']
   */
  selectors?: string[];

  /**
   * Whether to wrap the panzoom items in a div with overflow:hidden.  This constrains
   * the pan zoom detail into the original container.
   *
   * default: true
   */
  wrap?: boolean;

  /**
   * The amount of time to wait in MS before the plugin client module tries to look for
   * and alter pan zoom elements.  Some renders take a little bit before they appear in the
   * dom to find.
   *
   * The default is 1000
   */
  timeout?: number;

  /**
   * Add this class to any element within the Panzoom element that you want to exclude from Panzoom handling.
   * That element's children will also be excluded. e.g. links and buttons that should not propagate the click event.
   *
   * default: 'panzoom-exclude'
   */
  excludeClass?: string;

  /**
   * Toolbar options for the Panzoom plugin.
   */
  toolbar?: {
    /**
     * Whether to enable and show a control toolbar with buttons for zoom in, zoom out, and reset.
     *
     * default: false
     */
    enabled?: boolean;

    /**
     * The toolbar position (top-right, top-left, bottom-right, bottom-left)
     *
     * default: 'top-right'
     */
    position?: PanZoomPluginToolbarPosition;

    /**
     * The toolbar opacity when not hovered (value between 0 and 1)
     * The toolbar will become fully opaque (opacity: 1) when hovered.
     *
     * example: 0.5
     * default: 0
     */
    opacity?: number;
  };

  /**
   * Whether to enable zooming with the plain mouse wheel.
   * If true, the wheel zooms the element instead of scrolling the page when the pointer is over it.
   *
   * default: false (the plain wheel scrolls the page; see `enableWheelZoomWithCtrl`)
   */
  enableWheelZoom?: boolean;

  /**
   * Whether to enable zooming with the mouse wheel while holding the shift key.
   * If true, the user can zoom in and out using the mouse wheel while holding the shift key.
   *
   * This option is independent of `enableWheelZoom`. Meaning, even if `enableWheelZoom` is false,
   * and `enableWheelZoomWithShift` is true, the user can still zoom using shift + mouse whee.
   * Also, `enableWheelZoom` and `enableWheelZoomWithShift` can be used together.
   *
   * default: false
   */
  enableWheelZoomWithShift?: boolean;

  /**
   * Whether to enable zooming with the mouse wheel while holding the Ctrl key (Cmd on macOS).
   * Trackpad pinch gestures also report the Ctrl key, so they zoom too.
   *
   * Like `enableWheelZoomWithShift`, this option is independent of `enableWheelZoom`.
   * With the defaults (`enableWheelZoom: false`), the plain wheel scrolls the page and shows a short
   * "Ctrl + scroll to zoom" hint over the element.
   *
   * default: true
   */
  enableWheelZoomWithCtrl?: boolean;

  /**
   * Whether to enable double-click to reset zoom.
   * If true, double-clicking on the panzoom element will reset the zoom level.
   *
   * default: true
   */
  enableDoubleClickResetZoom?: boolean;

  /**
   * Whether to restrict zooming out beyond the original size of the element.
   *
   * default: false
   */
  restrictZoomOutBeyondOrigin?: boolean;

  /**
   * Expand feature options. When enabled, an expand button is added to the toolbar.
   */
  expand?: {
    /**
     * Whether to show the expand button in the toolbar.
     *
     * default: false
     */
    enabled?: boolean;

    /**
     * How the element is expanded.
     *
     * - `inline`: hides the navbar, sidebar, TOC, footer and the rest of the page content so the
     *   original element fills the page. The element keeps its pan and zoom state.
     * - `modal`: opens a copy of the element in a full-screen dialog with its own pan and zoom.
     *   The wheel always zooms inside the dialog. Close it with the close button, Escape, or a
     *   click on the backdrop.
     *
     * default: 'inline'
     */
    mode?: PanZoomPluginExpandMode;
  };

  /**
   * Copy feature options. When enabled, a copy button is added to the toolbar of every
   * Mermaid diagram rendered by `@docusaurus/theme-mermaid`. It copies the diagram source.
   * Elements without a readable source (images, draw.io, raw mermaid.js output) get no button.
   */
  copy?: {
    /**
     * Whether to show the copy button in the toolbar.
     *
     * default: false
     */
    enabled?: boolean;
  };
};

export type PanZoomPluginExpandMode = 'inline' | 'modal';
