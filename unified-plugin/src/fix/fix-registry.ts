// Fix handlers run in the main thread (Figma sandbox).
// Each handler receives a SceneNode and properties to apply.
// All fixes should be single-operation so Cmd+Z undoes them cleanly.

type FixHandler = (
  node: SceneNode,
  props: Record<string, unknown>
) => void | Promise<void>;

const fixHandlers: Record<string, FixHandler> = {
  'set-padding': function (node: SceneNode, props: Record<string, unknown>): void {
    const frame = node as FrameNode;
    if (props.paddingTop !== undefined) frame.paddingTop = props.paddingTop as number;
    if (props.paddingRight !== undefined) frame.paddingRight = props.paddingRight as number;
    if (props.paddingBottom !== undefined) frame.paddingBottom = props.paddingBottom as number;
    if (props.paddingLeft !== undefined) frame.paddingLeft = props.paddingLeft as number;
  },

  'set-spacing': function (node: SceneNode, props: Record<string, unknown>): void {
    const frame = node as FrameNode;
    if (props.itemSpacing !== undefined) frame.itemSpacing = props.itemSpacing as number;
  },

  'set-fill': function (node: SceneNode, props: Record<string, unknown>): void {
    if (!('fills' in node)) return;
    const paintNode = node as GeometryMixin & SceneNode;
    const fills = JSON.parse(JSON.stringify(paintNode.fills)) as Paint[];
    const color = props.color as { r: number; g: number; b: number } | undefined;
    if (!color) return;

    for (let i = 0; i < fills.length; i++) {
      if (fills[i].type === 'SOLID') {
        (fills[i] as SolidPaint).color = {
          r: color.r / 255,
          g: color.g / 255,
          b: color.b / 255,
        };
        break;
      }
    }
    paintNode.fills = fills;
  },

  'set-radius': function (node: SceneNode, props: Record<string, unknown>): void {
    if (!('cornerRadius' in node)) return;
    const rectNode = node as RectangleNode;
    rectNode.cornerRadius = props.cornerRadius as number;
  },

  'set-font-size': async function (node: SceneNode, props: Record<string, unknown>): Promise<void> {
    if (node.type !== 'TEXT') return;
    const textNode = node as TextNode;
    // Must load font before changing text properties
    const fontName = textNode.fontName;
    if (fontName && typeof fontName === 'object' && 'family' in fontName) {
      // Single font — load it directly
      await figma.loadFontAsync(fontName as FontName);
    } else {
      // Mixed fonts (figma.mixed) — load all unique fonts in the text node
      const len = textNode.characters.length;
      const loaded: Record<string, boolean> = {};
      for (let i = 0; i < len; i++) {
        const fn = textNode.getRangeFontName(i, i + 1) as FontName;
        const key = fn.family + '/' + fn.style;
        if (!loaded[key]) {
          loaded[key] = true;
          await figma.loadFontAsync(fn);
        }
      }
    }
    textNode.fontSize = props.fontSize as number;
  },

  'resize-touch-target': function (node: SceneNode, props: Record<string, unknown>): void {
    if (!('resize' in node)) return;
    const resizable = node as FrameNode;
    const newWidth = Math.max(resizable.width, (props.width as number) || resizable.width);
    const newHeight = Math.max(resizable.height, (props.height as number) || resizable.height);
    resizable.resize(newWidth, newHeight);
  },

  'set-auto-layout': function (node: SceneNode, props: Record<string, unknown>): void {
    if (!('layoutMode' in node)) return;
    const frame = node as FrameNode;
    frame.layoutMode = (props.layoutMode as 'HORIZONTAL' | 'VERTICAL') || 'VERTICAL';
    frame.itemSpacing = (props.itemSpacing as number) || 8;
    const padding = (props.padding as number) || 0;
    frame.paddingTop = padding;
    frame.paddingRight = padding;
    frame.paddingBottom = padding;
    frame.paddingLeft = padding;
  },

  'rename': function (node: SceneNode, props: Record<string, unknown>): void {
    if (typeof props.name === 'string') {
      node.name = props.name;
    }
  },

  'set-opacity': function (node: SceneNode, props: Record<string, unknown>): void {
    if (typeof props.opacity === 'number') {
      node.opacity = props.opacity;
    }
  },
};

function findNodeById(nodeId: string): SceneNode | null {
  // Try the fast path first
  try {
    var node = figma.getNodeById(nodeId);
    if (node && node.type !== 'DOCUMENT' && node.type !== 'PAGE') {
      return node as SceneNode;
    }
  } catch (_) {
    // getNodeById can throw for document/page IDs or removed nodes
  }

  // Fallback: search current page by ID
  return figma.currentPage.findOne(function (n) { return n.id === nodeId; });
}

export async function applyFix(
  nodeId: string,
  fixType: string,
  properties: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!nodeId) {
      return { success: false, error: 'No node ID provided' };
    }

    const node = findNodeById(nodeId);
    if (!node) {
      return { success: false, error: 'Node not found (ID: ' + nodeId + ')' };
    }

    // Check node is not locked
    if (node.locked) {
      return { success: false, error: 'Node is locked' };
    }

    const handler = fixHandlers[fixType];
    if (!handler) {
      return { success: false, error: 'Unknown fix type: ' + fixType };
    }

    await handler(node, properties);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
