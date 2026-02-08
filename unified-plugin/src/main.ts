import type { SelectionData } from './types/figma';
import { handleComponentPlacement } from './placement/placement-handler';

figma.showUI(__html__, { width: 414, height: 667 });

function extractSelectionData(node: SceneNode): SelectionData | null {
  try {
    const data: SelectionData = {
      id: node.id,
      name: node.name,
      type: node.type,
      width: node.width,
      height: node.height,
    };

    // Component instance properties
    if (node.type === 'INSTANCE') {
      try {
        if (node.mainComponent) {
          data.componentName = node.mainComponent.name;
        }
        const variantProps = node.variantProperties;
        if (variantProps) {
          data.variantProperties = variantProps;
        }
      } catch (_) {
        // mainComponent may not be accessible
      }
    }

    // Text properties
    if (node.type === 'TEXT') {
      try {
        const fontSize = node.fontSize;
        if (typeof fontSize === 'number') {
          data.fontSize = fontSize;
        }
        const fontName = node.fontName;
        if (fontName && typeof fontName === 'object' && 'family' in fontName) {
          data.fontName = {
            family: (fontName as FontName).family,
            style: (fontName as FontName).style,
          };
        }
        const lineHeight = node.lineHeight;
        if (lineHeight && typeof lineHeight === 'object' && 'value' in lineHeight) {
          const lh = lineHeight as { value: number; unit: string };
          data.lineHeight = { value: lh.value, unit: lh.unit };
        }
        data.characters = node.characters.substring(0, 200);
      } catch (_) {
        // Mixed values throw errors
      }
    }

    // Fills and strokes (nodes that support them)
    if ('fills' in node) {
      try {
        const fills = node.fills;
        if (Array.isArray(fills)) {
          data.fills = fills
            .filter((f): f is SolidPaint => f.type === 'SOLID')
            .map((f) => ({
              type: f.type,
              color: {
                r: f.color.r,
                g: f.color.g,
                b: f.color.b,
              },
              opacity: f.opacity,
            }));
        }
      } catch (_) {
        // Skip if fills not accessible
      }
    }

    if ('strokes' in node) {
      try {
        const strokes = node.strokes;
        if (Array.isArray(strokes)) {
          data.strokes = strokes
            .filter((s): s is SolidPaint => s.type === 'SOLID')
            .map((s) => ({
              type: s.type,
              color: {
                r: s.color.r,
                g: s.color.g,
                b: s.color.b,
              },
            }));
        }
      } catch (_) {
        // Skip if strokes not accessible
      }
    }

    // Auto-layout properties (frames and components)
    if ('layoutMode' in node) {
      try {
        const layoutNode = node as FrameNode;
        data.layoutMode = layoutNode.layoutMode;
        if (layoutNode.layoutMode !== 'NONE') {
          data.itemSpacing = layoutNode.itemSpacing;
          data.paddingTop = layoutNode.paddingTop;
          data.paddingRight = layoutNode.paddingRight;
          data.paddingBottom = layoutNode.paddingBottom;
          data.paddingLeft = layoutNode.paddingLeft;
        }
      } catch (_) {
        // Skip layout props if not accessible
      }
    }

    // Children summary (1 level deep, max 10)
    if ('children' in node) {
      try {
        const parentNode = node as FrameNode;
        data.childrenSummary = parentNode.children.slice(0, 10).map((child) => {
          const summary: { name: string; type: string; componentName?: string } = {
            name: child.name,
            type: child.type,
          };
          if (child.type === 'INSTANCE' && child.mainComponent) {
            summary.componentName = child.mainComponent.name;
          }
          return summary;
        });
      } catch (_) {
        // Skip children if not accessible
      }
    }

    return data;
  } catch (_) {
    return null;
  }
}

function sendCurrentSelection(): void {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'selection-changed', data: null });
    return;
  }

  const data = extractSelectionData(selection[0]);
  figma.ui.postMessage({ type: 'selection-changed', data });
}

// Listen for selection changes
figma.on('selectionchange', () => {
  sendCurrentSelection();
});

// Listen for messages from UI
figma.ui.onmessage = async (msg: {
  type: string;
  key?: string;
  provider?: string;
  componentKey?: string;
  componentName?: string;
  variant?: string | null;
}) => {
  if (msg.type === 'request-selection') {
    sendCurrentSelection();
  } else if (msg.type === 'get-api-key') {
    const key = await figma.clientStorage.getAsync('gemini-api-key');
    figma.ui.postMessage({ type: 'api-key-response', key: key || null });
  } else if (msg.type === 'save-api-key' && msg.key) {
    await figma.clientStorage.setAsync('gemini-api-key', msg.key);
    figma.ui.postMessage({ type: 'api-key-saved' });
  } else if (msg.type === 'clear-api-key') {
    await figma.clientStorage.deleteAsync('gemini-api-key');
    figma.ui.postMessage({ type: 'api-key-cleared' });
  } else if (msg.type === 'get-provider') {
    const provider = await figma.clientStorage.getAsync('ai-provider');
    figma.ui.postMessage({ type: 'provider-response', provider: provider || 'gemini' });
  } else if (msg.type === 'save-provider' && msg.provider) {
    await figma.clientStorage.setAsync('ai-provider', msg.provider);
    figma.ui.postMessage({ type: 'provider-saved' });
  } else if (msg.type === 'place-component') {
    // Component placement
    await handleComponentPlacement({
      componentKey: msg.componentKey || '',
      componentName: msg.componentName || '',
      variant: msg.variant || null,
    });
  }
};

// Send initial selection state and notify UI that plugin is ready
sendCurrentSelection();
figma.ui.postMessage({ type: 'plugin-ready' });
