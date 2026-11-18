import panzoom, { PanzoomObject } from '@panzoom/panzoom';
import type { ClientModule } from '@docusaurus/types';
import { PanZoomPluginOptions, PanZoomPluginToolbarPosition } from './PanzoomPluginOptions';
import SvgZoomIn from './img/zoom-in';
import SvgZoomOut from './img/zoom-out';
import SvgZoomReset from './img/zoom-reset';
import SvgZoomExpand from './img/zoom-expand';
import SvgPin from './img/pin';
import SvgPinFilled from './img/pin-filled';
import SvgCopy from './img/copy';
import SvgCheck from './img/check';
import './styles/panzoom.css';

// oxlint-disable-next-line typescript/no-require-imports
const config = require('@generated/docusaurus.config').default;
const { themeConfig } = config;
const { zoom }: { zoom: PanZoomPluginOptions } = themeConfig;
const {
  selectors = ['div.mermaid[data-processed="true"]', 'div.docusaurus-mermaid-container', '.drawio'],
  wrap = true,
  timeout = 1000,
  excludeClass = 'panzoom-exclude',
  toolbar: { enabled = false, position = PanZoomPluginToolbarPosition.TopRight, opacity = 0 } = {},
  enableWheelZoom = false,
  enableWheelZoomWithShift = false,
  enableWheelZoomWithCtrl = true,
  enableDoubleClickResetZoom = true,
  restrictZoomOutBeyondOrigin = false,
  expand: { enabled: expandEnabled = false, mode: expandMode = 'inline' } = {},
  copy: { enabled: copyEnabled = false } = {},
  ...panZoomConfig
} = zoom;

// SVG close icon (Material Symbols "close")
const SvgClose =
  '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>';

/**
 * Per-element state shared between the toolbar and the event listeners
 */
type PanZoomState = {
  /**
   * While pinned, pan/zoom is suspended at the current view so that text can be selected
   */
  pinned: boolean;
};

// Inline styles that panzoom sets to make the element draggable. They are cleared while pinned.
const INTERACTION_STYLES = ['cursor', 'userSelect', 'touchAction'] as const;

/**
 * Suspend or resume pan/zoom on the element while keeping the current transform.
 * While pinned, the pointer handlers are unbound and the element behaves like normal content
 * (text cursor, text selection), so that the user can select the text inside it.
 *
 * @returns A function that toggles the pinned state
 */
const createPinController = (element: HTMLElement, instance: PanzoomObject, state: PanZoomState) => {
  const targets = [element, element.parentElement].filter((target): target is HTMLElement => target !== null);
  const savedStyles = new Map<HTMLElement, Record<string, string>>();

  return (pinned: boolean) => {
    if (state.pinned === pinned) {
      return;
    }
    state.pinned = pinned;

    if (pinned) {
      // destroy() only unbinds the pointer handlers. The current transform is kept.
      instance.destroy();
      targets.forEach((target) => {
        const saved: Record<string, string> = {};
        INTERACTION_STYLES.forEach((prop) => {
          saved[prop] = target.style[prop];
          target.style[prop] = '';
        });
        savedStyles.set(target, saved);
      });
      return;
    }

    targets.forEach((target) => {
      const saved = savedStyles.get(target);
      INTERACTION_STYLES.forEach((prop) => {
        target.style[prop] = saved?.[prop] ?? '';
      });
    });
    savedStyles.clear();
    instance.bind();
  };
};

/**
 * Read the Mermaid source of a diagram rendered by `@docusaurus/theme-mermaid`.
 * The theme keeps the source only in the React props of the Mermaid component (`value`),
 * so walk up the React fiber tree from the element until a component with that prop is found.
 *
 * @returns The source, or null when the element has none (images, draw.io, raw mermaid.js)
 */
const getDiagramSource = (element: HTMLElement): string | null => {
  const attribute = element.getAttribute('data-mermaid-source');
  if (attribute) {
    return attribute;
  }

  // Only Mermaid diagrams carry a source. Other elements may sit under unrelated components with a
  // `value` prop, so do not walk their tree at all.
  const isMermaid =
    element.classList.contains('docusaurus-mermaid-container') ||
    element.querySelector(':scope > svg[aria-roledescription]') !== null;
  if (!isMermaid) {
    return null;
  }

  const fiberKey = Object.keys(element).find((key) => key.startsWith('__reactFiber$'));
  if (!fiberKey) {
    return null;
  }

  type Fiber = { memoizedProps?: Record<string, unknown> | null; return?: Fiber | null };
  let fiber = (element as unknown as Record<string, Fiber | undefined>)[fiberKey] ?? null;
  for (let depth = 0; fiber && depth < 10; depth += 1) {
    const value = fiber.memoizedProps?.value;
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    fiber = fiber.return ?? null;
  }
  return null;
};

type ExpandToggle = { open: () => void; close: () => void; onClose?: () => void };

/**
 * What the toolbar offers besides zoom and pin
 */
type ToolbarExtras = {
  /**
   * Diagram source for the copy button. No copy button when null.
   */
  source: string | null;
  /**
   * In-page expand toggle (expand.mode = 'inline')
   */
  expandToggle?: ExpandToggle;
  /**
   * Opens the full-screen dialog (expand.mode = 'modal')
   */
  openModal?: (opener: HTMLButtonElement) => void;
  /**
   * Closes the full-screen dialog. Adds a close button, used by the dialog's own toolbar.
   */
  close?: () => void;
};

/**
 * Zoom with the wheel, unless pinned, and respecting restrictZoomOutBeyondOrigin
 */
const zoomWithWheel = (instance: PanzoomObject, state: PanZoomState, event: WheelEvent) => {
  // Leave the wheel to the page scroll while pinned
  if (state.pinned) {
    return;
  }

  if (restrictZoomOutBeyondOrigin) {
    // Allow zooming in or zooming out only to the original size
    if (event.deltaY < 0 || (event.deltaY > 0 && instance.getScale() > 1)) {
      instance.zoomWithWheel(event);
    }
  } else {
    instance.zoomWithWheel(event);
  }
};

/**
 * Open a copy of the element in a full-screen dialog with its own panzoom instance.
 * The original element and its pan/zoom state are left untouched.
 * The dialog has the same toolbar as the page (zoom, pin, copy), with a close button in place of expand.
 * The wheel always zooms inside the dialog. Escape, the close button, or a click on
 * the backdrop close it, and focus goes back to the button that opened it.
 *
 * @param element The element panzoom is applied to
 * @param source The diagram source for the copy button, or null
 * @param opener The button that opened the dialog
 */
const openModal = (element: HTMLElement, source: string | null, opener: HTMLElement) => {
  const overlay = document.createElement('div');
  // No excludeClass here: panzoom ignores pointer events inside an excluded ancestor, which would block dragging
  overlay.className = 'panzoom-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Expanded diagram');

  const content = document.createElement('div');
  content.className = 'panzoom-modal-content';

  const clone = element.cloneNode(true) as HTMLElement;
  // Keep data-panzoom on the copy so a route update while the dialog is open does not set it up again
  clone.removeAttribute('id');
  clone.style.transform = '';
  clone.classList.add('panzoom-modal-stage');
  // The toolbar of the original element is not part of the element itself, but drop any stray one
  clone.querySelectorAll('.panzoom-toolbar, .panzoom-scroll-hint').forEach((child) => child.remove());

  content.appendChild(clone);
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const instance = panzoom(clone, { excludeClass, ...panZoomConfig });
  const state: PanZoomState = { pinned: false };

  // No page to scroll behind the dialog, so the plain wheel zooms
  content.addEventListener('wheel', (event) => zoomWithWheel(instance, state, event));
  if (enableDoubleClickResetZoom) {
    clone.addEventListener('dblclick', () => {
      // Double-click selects a word while pinned
      if (!state.pinned) {
        instance.reset();
      }
    });
  }

  const close = () => {
    document.removeEventListener('keydown', handleKeydown);
    instance.destroy();
    overlay.remove();
    document.body.style.overflow = previousOverflow;
    opener.focus();
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      close();
    }
  };

  const setPinned = createPinController(clone, instance, state);
  const toolbar = createToolbar(content, instance, position, state, setPinned, { source, close });

  // Close on a click on the backdrop. A drag that starts on the diagram and ends on the backdrop
  // also fires a click there, so only close when the press started on the backdrop too.
  let pressedOnBackdrop = false;
  overlay.addEventListener('pointerdown', (event) => {
    pressedOnBackdrop = event.target === overlay;
  });
  overlay.addEventListener('click', (event) => {
    if (pressedOnBackdrop && event.target === overlay) {
      close();
    }
  });
  document.addEventListener('keydown', handleKeydown);
  toolbar.querySelector<HTMLButtonElement>('.panzoom-close-button')?.focus();
};

/**
 * Creates a toolbar with zoom controls for a panzoom instance
 *
 * @param container The container element to append the toolbar to
 * @param instance The panzoom instance to control
 * @param position The position of the toolbar
 * @param state The state of the panzoom element
 * @param setPinned Function to suspend or resume pan/zoom
 * @param extras Copy, expand and close buttons to add after zoom and pin
 * @returns The toolbar element
 */
const createToolbar = (
  container: HTMLElement,
  instance: PanzoomObject,
  position: PanZoomPluginToolbarPosition,
  state: PanZoomState,
  setPinned: (pinned: boolean) => void,
  extras: ToolbarExtras,
): HTMLDivElement => {
  const { source, expandToggle, openModal: onOpenModal, close } = extras;
  const toolbar = document.createElement('div');
  toolbar.className = `panzoom-toolbar panzoom-toolbar-${position} ${excludeClass}`;

  // Apply custom opacity from configuration
  toolbar.style.opacity = opacity.toString();

  // Prevent double-click events from bubbling up to the container
  // By default the panzoom library will reset on double click
  toolbar.addEventListener('dblclick', (e) => {
    e.stopPropagation();
  });

  // Helper function to create toolbar buttons
  const createButton = (svg: string, title: string, action: () => void): HTMLButtonElement => {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = svg;
    button.title = title;
    button.className = excludeClass;
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      action();
    });
    return button;
  };

  // Create and append all buttons

  const zoomButtons = [
    // Zoom in
    createButton(SvgZoomIn, 'Zoom in', () => {
      instance.zoomIn();
    }),
    // Zoom out
    createButton(SvgZoomOut, 'Zoom out', () => {
      if (!restrictZoomOutBeyondOrigin) {
        instance.zoomOut();
        return;
      }
      if (instance.getScale() > 1) {
        instance.zoomOut();
      }
    }),
    // Reset zoom
    createButton(SvgZoomReset, 'Reset zoom', () => {
      instance.reset();
    }),
  ];

  // Pin the current view to allow text selection
  const pinButton = createButton(SvgPin, '', () => {
    setPinned(!state.pinned);
    updatePinState();
  });

  const updatePinState = () => {
    const { pinned } = state;
    pinButton.innerHTML = pinned ? SvgPinFilled : SvgPin;
    pinButton.title = pinned ? 'Unpin to enable pan and zoom' : 'Pin to select text';
    pinButton.setAttribute('aria-pressed', String(pinned));
    container.classList.toggle('panzoom-pinned', pinned);
    zoomButtons.forEach((button) => {
      button.disabled = pinned;
    });
  };
  updatePinState();

  const extraButtons: HTMLButtonElement[] = [];

  // Copy the diagram source
  if (source) {
    const copyButton = createButton(SvgCopy, 'Copy source', () => {
      navigator.clipboard
        .writeText(source)
        .then(() => {
          copyButton.innerHTML = SvgCheck;
          copyButton.title = 'Copied';
          setTimeout(() => {
            copyButton.innerHTML = SvgCopy;
            copyButton.title = 'Copy source';
          }, 1500);
        })
        .catch((error: unknown) => {
          console.warn('[docusaurus-plugin-panzoom] copy failed:', error);
        });
    });
    copyButton.setAttribute('aria-label', 'Copy diagram source');
    extraButtons.push(copyButton);
  }

  // Full-screen dialog with an independent copy of the element
  if (onOpenModal) {
    const expandButton = createButton(SvgZoomExpand, 'Expand (full screen)', () => {
      onOpenModal(expandButton);
    });
    expandButton.setAttribute('aria-label', 'Expand diagram in full screen');
    extraButtons.push(expandButton);
  }

  // Close button of the full-screen dialog
  if (close) {
    const closeButton = createButton(SvgClose, 'Close', close);
    closeButton.classList.add('panzoom-close-button');
    closeButton.setAttribute('aria-label', 'Close');
    extraButtons.push(closeButton);
  }

  // Expand / collapse toggle button — swaps icon and title between states
  if (expandToggle) {
    const expandBtn = document.createElement('button');
    expandBtn.innerHTML = SvgZoomExpand;
    expandBtn.title = 'Expand';
    expandBtn.className = excludeClass;

    // Register a reset callback so Escape key (and any programmatic close)
    // also restores the button icon/title to the collapsed state.
    expandToggle.onClose = () => {
      expandBtn.innerHTML = SvgZoomExpand;
      expandBtn.title = 'Expand';
    };

    expandBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (container.classList.contains('panzoom-expand-active')) {
        expandToggle.close();
        // icon reset is handled by expandToggle.onClose above
      } else {
        expandToggle.open();
        expandBtn.innerHTML = SvgClose;
        expandBtn.title = 'Collapse';
      }
    });
    extraButtons.push(expandBtn);
  }

  [...zoomButtons, pinButton, ...extraButtons].forEach((button) => toolbar.appendChild(button));
  container.appendChild(toolbar);
  return toolbar;
};

/**
 * Creates an in-page expand experience for a panzoom element.
 *
 * When activated, hides the Docusaurus sidebar and right TOC column, expands
 * the main content container to close 100% width. The original panzoom
 * instance and element remain untouched — no cloning, no modal/dialog.
 *
 * Returns { open, close } so the toolbar button can toggle both the layout
 * state and its own icon/title.
 *
 * Targets:
 *   - Sidebar     : aside.theme-doc-sidebar-container   (stable ThemeClassName)
 *   - TOC col     : .col--3                             (Docusaurus grid class)
 *   - Main        : main[class*="docMainContainer"]     (CSS-module element)
 *   - Content col : [class*="docItemCol"]               (CSS-module element)
 *
 * @param container The wrapper element that holds the panzoom element
 * @param onClose Optional callback invoked after the expand mode is closed (e.g. to reset button icon)
 */
const createExpandToggle = (container: HTMLElement): ExpandToggle => {
  const getLayoutElements = () => {
    const sidebar = document.querySelector<HTMLElement>('aside.theme-doc-sidebar-container');
    // The right TOC column is a direct child of the .row that also contains the docItemCol
    const tocCol = document.querySelector<HTMLElement>('.col--3');
    const mainContainer = document.querySelector<HTMLElement>('[class*="docMainContainer"]');
    // The doc content column (CSS-module class docItemCol) — targeted via attribute selector
    const docItemCol = document.querySelector<HTMLElement>('[class*="docItemCol"]');
    // The infima .container div inside the main container (holds padding/max-width)
    const docContainer = mainContainer?.querySelector<HTMLElement>(':scope > .container') ?? null;
    return { sidebar, tocCol, mainContainer, docItemCol, docContainer };
  };

  /**
   * Collect all sibling elements that should be hidden when the panzoom
   * container is expanded. Walks up the DOM from `container` to `article`
   * (inclusive), tagging every sibling of each ancestor with
   * `panzoom-expand-sibling`. Stops at `article` so page chrome above
   * (navbar, etc.) is never touched.
   */
  const getSiblings = (): HTMLElement[] => {
    const siblings: HTMLElement[] = [];
    let node: HTMLElement | null = container;

    while (node && node.tagName.toLowerCase() !== 'article') {
      const parent: HTMLElement | null = node.parentElement;
      if (parent) {
        Array.from(parent.children).forEach((child) => {
          if (child !== node && child instanceof HTMLElement) {
            siblings.push(child);
          }
        });
      }
      node = parent;
    }

    // Also hide article-level siblings (breadcrumbs, version badge, mobile
    // TOC, footer) and the paginator that sits just below the article.
    if (node && node.tagName.toLowerCase() === 'article') {
      const articleParent = node.parentElement;
      if (articleParent) {
        Array.from(articleParent.children).forEach((child) => {
          if (child !== node && child instanceof HTMLElement) {
            siblings.push(child);
          }
        });
      }
    }

    return siblings;
  };

  const open = () => {
    const { sidebar, tocCol, mainContainer, docItemCol, docContainer } = getLayoutElements();

    if (sidebar) sidebar.classList.add('panzoom-expand-hidden');
    if (tocCol) tocCol.classList.add('panzoom-expand-hidden');
    if (mainContainer) mainContainer.classList.add('panzoom-expand-main');
    if (docItemCol) docItemCol.classList.add('panzoom-expand-doc-item');
    if (docContainer) docContainer.classList.add('panzoom-expand-container');

    getSiblings().forEach((el) => el.classList.add('panzoom-expand-sibling'));

    // Hide the Docusaurus navbar and site footer.
    // The site footer uses the stable class `theme-layout-footer` (wrapping div)
    // and the semantic <footer> element inside it. We target both to be safe.
    const navbar = document.querySelector<HTMLElement>('.navbar');
    if (navbar) navbar.classList.add('panzoom-expand-hidden');
    document.querySelectorAll<HTMLElement>('footer, .theme-layout-footer').forEach((el) => {
      el.classList.add('panzoom-expand-hidden');
    });

    container.classList.add('panzoom-expand-active');

    // Scroll to the top of the page so the expanded diagram is centered in view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const close = () => {
    const { sidebar, tocCol, mainContainer, docItemCol, docContainer } = getLayoutElements();

    if (sidebar) sidebar.classList.remove('panzoom-expand-hidden');
    if (tocCol) tocCol.classList.remove('panzoom-expand-hidden');
    if (mainContainer) mainContainer.classList.remove('panzoom-expand-main');
    if (docItemCol) docItemCol.classList.remove('panzoom-expand-doc-item');
    if (docContainer) docContainer.classList.remove('panzoom-expand-container');

    document.querySelectorAll<HTMLElement>('.panzoom-expand-sibling').forEach((el) => {
      el.classList.remove('panzoom-expand-sibling');
    });

    // Restore the navbar and site footer
    const navbar = document.querySelector<HTMLElement>('.navbar');
    if (navbar) navbar.classList.remove('panzoom-expand-hidden');
    document.querySelectorAll<HTMLElement>('footer, .theme-layout-footer').forEach((el) => {
      el.classList.remove('panzoom-expand-hidden');
    });

    container.classList.remove('panzoom-expand-active');

    // Scroll the exited element back into view
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Notify caller (e.g. toolbar button) so it can reset its icon/title
    result.onClose?.();
  };

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && container.classList.contains('panzoom-expand-active')) {
      close();
    }
  });

  const result: ExpandToggle = { open, close };
  return result;
};

// Text of the hint shown when the plain wheel scrolls the page instead of zooming
const SCROLL_HINT = enableWheelZoomWithCtrl
  ? 'Ctrl + scroll to zoom (⌘ on Mac)'
  : enableWheelZoomWithShift
    ? 'Shift + scroll to zoom'
    : '';

const scrollHintTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

/**
 * Briefly show which key zooms, centered on the visible part of the container.
 * The hint ignores the pointer, so it never blocks the page scroll.
 *
 * @param container The container the wheel event happened on
 */
const showScrollHint = (container: HTMLElement) => {
  if (!SCROLL_HINT) {
    return;
  }

  let hint = container.querySelector<HTMLElement>(':scope > .panzoom-scroll-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.className = `panzoom-scroll-hint ${excludeClass}`;
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = SCROLL_HINT;
    container.appendChild(hint);
  }
  // Center the hint on the visible part of the container, so tall diagrams still show it
  const rect = container.getBoundingClientRect();
  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, window.innerHeight);
  hint.style.top = `${(visibleTop + visibleBottom) / 2 - rect.top}px`;
  hint.classList.add('panzoom-scroll-hint-visible');

  clearTimeout(scrollHintTimers.get(container));
  scrollHintTimers.set(
    container,
    setTimeout(() => hint.classList.remove('panzoom-scroll-hint-visible'), 900),
  );
};

/**
 * Attach event listeners to the element where panzoom is applied.
 * The listeners to add are based on the configuration options provided.
 *
 * @param element The element to add event listeners to
 * @param instance The panzoom instance to control
 * @param state The state of the panzoom element
 */
const addEventListeners = (element: HTMLElement, instance: PanzoomObject, state: PanZoomState) => {
  const handleZoomWithWheel = (event: WheelEvent) => zoomWithWheel(instance, state, event);

  // Handle the wheel zoom functionality if at least one of the options is enabled
  if (enableWheelZoom || enableWheelZoomWithShift || enableWheelZoomWithCtrl) {
    element.addEventListener('wheel', (event) => {
      // Handle zoom with shift key
      if (enableWheelZoomWithShift && event.shiftKey) {
        handleZoomWithWheel(event);
        return;
      }

      // Handle zoom with ctrl key (cmd on macOS, also sent by trackpad pinch)
      if (enableWheelZoomWithCtrl && (event.ctrlKey || event.metaKey)) {
        handleZoomWithWheel(event);
        return;
      }

      // Handle regular zoom
      if (enableWheelZoom && !event.shiftKey) {
        handleZoomWithWheel(event);
        return;
      }

      // The wheel scrolls the page: tell the user which key zooms
      if (!state.pinned && event.deltaY !== 0) {
        showScrollHint(element);
      }
    });
  }

  // Handle double-click reset zoom
  if (enableDoubleClickResetZoom) {
    element.addEventListener('dblclick', () => {
      // Double-click selects a word while pinned
      if (state.pinned) {
        return;
      }
      instance.reset();
    });
  }
};

/**
 * Main work method to zoom the set of elements.  You can pass in global options to the pan zoom component
 * as well as control whether the items will be wrapped.
 *
 * @param selectors
 */
const zoomElements = (selectors: string[]) => {
  const foundElements: Element[] = [];

  selectors.forEach((selector) => {
    foundElements.push(...document.querySelectorAll(selector));
  });

  foundElements.forEach((element) => {
    // Guard against double-initialisation (e.g. StrictMode or repeated route updates)
    if (element.getAttribute('data-panzoom')) return;
    element.setAttribute('data-panzoom', 'true');

    let container: HTMLElement;

    if (wrap) {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('style', 'overflow: hidden; position: relative;');
      element.parentElement?.insertBefore(wrapper, element);
      wrapper.appendChild(element);
      container = wrapper;
    } else {
      const htmlElement = element as HTMLElement;
      htmlElement.style.position = 'relative';
      container = htmlElement;
    }
    const instance = panzoom(element as HTMLElement, { excludeClass, ...panZoomConfig });
    const state: PanZoomState = { pinned: false };

    addEventListeners(container, instance, state);

    // Add toolbar if enabled
    if (enabled) {
      const htmlElement = element as HTMLElement;
      const setPinned = createPinController(htmlElement, instance, state);
      // Read the source now: the dialog's copy has no React props to read it from
      const source = copyEnabled ? getDiagramSource(htmlElement) : null;
      createToolbar(container, instance, position, state, setPinned, {
        source,
        // Wire the expand toggle (if feature is on) into the toolbar
        expandToggle: expandEnabled && expandMode === 'inline' ? createExpandToggle(container) : undefined,
        openModal:
          expandEnabled && expandMode === 'modal' ? (opener) => openModal(htmlElement, source, opener) : undefined,
      });
    }
  });
};

/**
 * Client module implementation.  Wait a bit before trying this, some components like mermaid take a second to process / render
 */
const ZoomModule: ClientModule = {
  onRouteDidUpdate() {
    setTimeout(() => {
      zoomElements(selectors);
    }, timeout);
  },
};

export default ZoomModule;
