import type { SelectionData } from './types/figma';
import type { SelectionDataV2 } from './types/figma';
import { applyFix } from './fix/fix-registry';

figma.showUI(__html__, { width: 414, height: 667 });

// ── V1: Shallow selection extraction ──

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
          data.fills = fills.map((f) => {
            if (f.type === 'SOLID') {
              return {
                type: f.type,
                color: {
                  r: (f as SolidPaint).color.r,
                  g: (f as SolidPaint).color.g,
                  b: (f as SolidPaint).color.b,
                },
                opacity: f.opacity,
              };
            }
            // Pass non-solid fill types (gradients, images) without color
            return { type: f.type };
          });
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

// ── V2: Deep selection extraction ──

const MAX_DEPTH = 3;
const MAX_CHILDREN_PER_LEVEL = 20;
const EXTRACTION_TIMEOUT_MS = 500;

function resolveStyleName(styleId: string | typeof figma.mixed): string | undefined {
  if (!styleId || styleId === figma.mixed) return undefined;
  try {
    const style = figma.getStyleById(styleId as string);
    return style?.name;
  } catch (_) {
    return undefined;
  }
}

function extractDeepSelection(
  node: SceneNode,
  depth: number,
  startTime: number
): SelectionDataV2 | null {
  // Performance guard
  if (Date.now() - startTime > EXTRACTION_TIMEOUT_MS) return null;

  try {
    // Start with all V1 fields
    const base = extractSelectionData(node);
    if (!base) return null;

    const data: SelectionDataV2 = { ...base };

    // Opacity & visibility
    data.opacity = node.opacity;
    data.visible = node.visible;
    data.locked = node.locked;

    // Absolute position
    if ('absoluteTransform' in node) {
      const transform = node.absoluteTransform;
      data.absoluteX = transform[0][2];
      data.absoluteY = transform[1][2];
    }

    // Corner radius
    if ('cornerRadius' in node) {
      const r = (node as RectangleNode).cornerRadius;
      if (r !== figma.mixed) {
        data.cornerRadius = r;
      } else if ('topLeftRadius' in node) {
        const rn = node as RectangleNode;
        data.cornerRadius = [
          rn.topLeftRadius,
          rn.topRightRadius,
          rn.bottomRightRadius,
          rn.bottomLeftRadius,
        ];
      }
    }

    // Constraints
    if ('constraints' in node) {
      const c = (node as FrameNode).constraints;
      data.constraints = {
        horizontal: c.horizontal,
        vertical: c.vertical,
      };
    }

    // Layout child properties
    if ('layoutAlign' in node) {
      data.layoutAlign = (node as FrameNode).layoutAlign as string;
    }
    if ('layoutGrow' in node) {
      data.layoutGrow = (node as FrameNode).layoutGrow as number;
    }

    // Component metadata (instances)
    if (node.type === 'INSTANCE') {
      try {
        const main = node.mainComponent;
        if (main) {
          data.componentId = main.id;
          data.componentDescription = main.description || undefined;
          if (main.parent && main.parent.type === 'COMPONENT_SET') {
            data.componentSetName = main.parent.name;
          }
        }
      } catch (_) {
        // mainComponent may not be accessible
      }
    }

    // Style references
    if ('fillStyleId' in node) {
      const id = (node as GeometryMixin & SceneNode).fillStyleId;
      if (id && id !== figma.mixed) {
        data.fillStyleId = id as string;
        data.fillStyleName = resolveStyleName(id);
      }
    }
    if ('strokeStyleId' in node) {
      const id = (node as GeometryMixin & SceneNode).strokeStyleId;
      if (id && id !== figma.mixed) {
        data.strokeStyleId = id as string;
        data.strokeStyleName = resolveStyleName(id);
      }
    }
    if ('textStyleId' in node) {
      const id = (node as TextNode).textStyleId;
      if (id && id !== figma.mixed) {
        data.textStyleId = id as string;
        data.textStyleName = resolveStyleName(id);
      }
    }
    if ('effectStyleId' in node) {
      const id = (node as BlendMixin & SceneNode).effectStyleId;
      if (id && id !== figma.mixed) {
        data.effectStyleId = id as string;
        data.effectStyleName = resolveStyleName(id);
      }
    }

    // Recursive children
    if ('children' in node && depth < MAX_DEPTH) {
      const parentNode = node as FrameNode;
      data.childCount = parentNode.children.length;
      const childSlice = parentNode.children.slice(0, MAX_CHILDREN_PER_LEVEL);
      const extractedChildren: SelectionDataV2[] = [];

      for (const child of childSlice) {
        if (Date.now() - startTime > EXTRACTION_TIMEOUT_MS) break;
        const childData = extractDeepSelection(child, depth + 1, startTime);
        if (childData) {
          extractedChildren.push(childData);
        }
      }

      data.children = extractedChildren;
    } else if ('children' in node) {
      data.childCount = (node as FrameNode).children.length;
    }

    return data;
  } catch (_) {
    return null;
  }
}

// ── Selection sending ──

function sendCurrentSelection(): void {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'selection-changed', data: null });
    return;
  }

  const data = extractSelectionData(selection[0]);
  figma.ui.postMessage({ type: 'selection-changed', data });
}

function sendDeepSelection(): void {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'deep-selection-data', data: null });
    return;
  }

  const startTime = Date.now();
  const data = extractDeepSelection(selection[0], 0, startTime);
  figma.ui.postMessage({ type: 'deep-selection-data', data });
}

// ── Event listeners ──

// Listen for selection changes (V1)
figma.on('selectionchange', () => {
  sendCurrentSelection();
});

// Listen for messages from UI
figma.ui.onmessage = async (msg: {
  type: string;
  key?: string;
  provider?: string;
  nodeId?: string;
  fixType?: string;
  properties?: Record<string, unknown>;
}) => {
  if (msg.type === 'request-selection') {
    sendCurrentSelection();
  } else if (msg.type === 'clear-selection') {
    figma.currentPage.selection = [];
  } else if (msg.type === 'request-deep-selection') {
    sendDeepSelection();
  } else if (msg.type === 'get-api-key') {
    const key = await figma.clientStorage.getAsync('gemini-api-key');
    figma.ui.postMessage({ type: 'api-key-response', key: key || null });
  } else if (msg.type === 'save-api-key' && msg.key) {
    await figma.clientStorage.setAsync('gemini-api-key', msg.key);
    figma.ui.postMessage({ type: 'api-key-saved' });
  } else if (msg.type === 'clear-api-key') {
    await figma.clientStorage.deleteAsync('gemini-api-key');
    figma.ui.postMessage({ type: 'api-key-cleared' });
  } else if (msg.type === 'request-current-user') {
    var user = figma.currentUser;
    var userName = user && user.name ? user.name : null;
    figma.ui.postMessage({ type: 'current-user', name: userName });
  } else if (msg.type === 'get-provider-settings') {
    var selectedProvider = await figma.clientStorage.getAsync('selected-provider');
    var geminiKey = await figma.clientStorage.getAsync('gemini-api-key');
    var claudeKey = await figma.clientStorage.getAsync('claude-api-key');
    var gptKey = await figma.clientStorage.getAsync('gpt-api-key');
    figma.ui.postMessage({
      type: 'provider-settings-response',
      selectedProvider: selectedProvider || 'gemini',
      keys: {
        gemini: geminiKey || null,
        claude: claudeKey || null,
        gpt: gptKey || null,
      },
    });
  } else if (msg.type === 'save-provider-key' && msg.provider && msg.key) {
    await figma.clientStorage.setAsync(msg.provider + '-api-key', msg.key);
    figma.ui.postMessage({ type: 'provider-key-saved', provider: msg.provider });
  } else if (msg.type === 'clear-provider-key' && msg.provider) {
    await figma.clientStorage.deleteAsync(msg.provider + '-api-key');
    figma.ui.postMessage({ type: 'provider-key-cleared', provider: msg.provider });
  } else if (msg.type === 'set-selected-provider' && msg.provider) {
    await figma.clientStorage.setAsync('selected-provider', msg.provider);
  } else if (msg.type === 'apply-fix' && msg.nodeId && msg.fixType && msg.properties) {
    // V2: Apply fix via fix registry
    const result = await applyFix(msg.nodeId, msg.fixType, msg.properties);
    figma.ui.postMessage({
      type: 'fix-applied',
      nodeId: msg.nodeId,
      fixType: msg.fixType,
      success: result.success,
      error: result.error,
    });
  }
};

// Send initial selection state and notify UI that plugin is ready
sendCurrentSelection();
figma.ui.postMessage({ type: 'plugin-ready' });

// Send current user info at startup
var startupUser = figma.currentUser;
var startupUserName = startupUser && startupUser.name ? startupUser.name : null;
figma.ui.postMessage({ type: 'current-user', name: startupUserName });
