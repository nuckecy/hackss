import type { SelectionData, SelectionDataV2 } from './types/figma';
import { handleComponentPlacement } from './placement/placement-handler';
import { applyFix } from './fix/fix-registry';

figma.showUI(__html__, { width: 414, height: 667 });

async function extractSelectionData(node: SceneNode): Promise<SelectionData | null> {
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
        const mainComponent = await node.getMainComponentAsync();
        if (mainComponent) {
          data.componentName = mainComponent.name;
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
        const childrenPromises = parentNode.children.slice(0, 10).map(async (child) => {
          const summary: { name: string; type: string; componentName?: string } = {
            name: child.name,
            type: child.type,
          };
          if (child.type === 'INSTANCE') {
            try {
              const mainComponent = await child.getMainComponentAsync();
              if (mainComponent) {
                summary.componentName = mainComponent.name;
              }
            } catch (_) {
              // Skip if not accessible
            }
          }
          return summary;
        });
        data.childrenSummary = await Promise.all(childrenPromises);
      } catch (_) {
        // Skip children if not accessible
      }
    }

    return data;
  } catch (_) {
    return null;
  }
}

async function sendCurrentSelection(): Promise<void> {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'selection-changed', data: null });
    return;
  }

  const data = await extractSelectionData(selection[0]);
  figma.ui.postMessage({ type: 'selection-changed', data });
}

// ── V2: Deep selection extraction for scan & fix ──

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

async function extractDeepSelection(
  node: SceneNode,
  depth: number,
  startTime: number
): Promise<SelectionDataV2 | null> {
  // Performance guard
  if (Date.now() - startTime > EXTRACTION_TIMEOUT_MS) return null;

  try {
    // Start with all V1 fields
    const base = await extractSelectionData(node);
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
        const main = await node.getMainComponentAsync();
        if (main) {
          data.componentId = main.id;
          data.componentDescription = main.description || undefined;
          const parent = await main.getParentAsync();
          if (parent && parent.type === 'COMPONENT_SET') {
            data.componentSetName = parent.name;
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
        const childData = await extractDeepSelection(child, depth + 1, startTime);
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

async function sendDeepSelection(): Promise<void> {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'deep-selection-data', data: null });
    return;
  }

  const startTime = Date.now();
  const data = await extractDeepSelection(selection[0], 0, startTime);
  figma.ui.postMessage({ type: 'deep-selection-data', data });
}

// Listen for selection changes
figma.on('selectionchange', () => {
  sendCurrentSelection();
});

// Extract frame data recursively for scanning
async function extractFrameData(node: SceneNode): Promise<any> {
  const data: any = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  // Extract dimensions and position
  if ('width' in node && 'height' in node) {
    data.width = node.width;
    data.height = node.height;
  }
  if ('x' in node && 'y' in node) {
    data.x = node.x;
    data.y = node.y;
  }

  // Extract fills/colors
  if ('fills' in node && Array.isArray(node.fills)) {
    data.fills = node.fills
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

  // Extract text properties
  if (node.type === 'TEXT') {
    try {
      const fontSize = node.fontSize;
      if (typeof fontSize === 'number') {
        data.fontSize = fontSize;
      }
      const fontName = node.fontName;
      if (fontName && typeof fontName === 'object' && 'family' in fontName) {
        data.fontName = fontName;
      }
      data.characters = node.characters.substring(0, 200);
    } catch (_) {
      // Skip mixed properties
    }
  }

  // Extract component instance info
  if (node.type === 'INSTANCE') {
    try {
      const mainComponent = await node.getMainComponentAsync();
      if (mainComponent) {
        data.componentName = mainComponent.name;
      }
      if (node.variantProperties) {
        data.variantProperties = node.variantProperties;
      }
    } catch (_) {
      // Skip if not accessible
    }
  }

  // Extract auto-layout properties
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
      // Skip if not accessible
    }
  }

  // Recursively process children (limit depth to avoid huge payloads)
  if ('children' in node && node.children.length > 0) {
    const childrenPromises = node.children
      .slice(0, 50) // Limit to 50 children per node
      .map((child) => extractFrameData(child));
    data.children = await Promise.all(childrenPromises);
  }

  return data;
}

// Listen for messages from UI
figma.ui.onmessage = async (msg: {
  type: string;
  key?: string;
  provider?: string;
  componentKey?: string;
  componentName?: string;
  variant?: string | null;
  nodeId?: string;
  fixType?: string;
  properties?: Record<string, unknown>;
}) => {
  if (msg.type === 'request-selection') {
    sendCurrentSelection();
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
  } else if (msg.type === 'get-provider') {
    const provider = await figma.clientStorage.getAsync('ai-provider');
    figma.ui.postMessage({ type: 'provider-response', provider: provider || 'gemini' });
  } else if (msg.type === 'save-provider' && msg.provider) {
    await figma.clientStorage.setAsync('ai-provider', msg.provider);
    figma.ui.postMessage({ type: 'provider-saved' });
  } else if (msg.type === 'get-provider-settings') {
    // Get selected provider and all API keys
    const selectedProvider = await figma.clientStorage.getAsync('selected-provider');
    const geminiKey = await figma.clientStorage.getAsync('api-key-gemini');
    const claudeKey = await figma.clientStorage.getAsync('api-key-claude');
    const gptKey = await figma.clientStorage.getAsync('api-key-gpt');

    // Migration: check for old gemini-api-key and migrate if exists
    if (!geminiKey) {
      const oldKey = await figma.clientStorage.getAsync('gemini-api-key');
      if (oldKey) {
        await figma.clientStorage.setAsync('api-key-gemini', oldKey);
        await figma.clientStorage.deleteAsync('gemini-api-key');
      }
    }

    figma.ui.postMessage({
      type: 'provider-settings-response',
      selectedProvider: selectedProvider || 'gemini',
      keys: {
        gemini: (geminiKey || await figma.clientStorage.getAsync('api-key-gemini')) || null,
        claude: claudeKey || null,
        gpt: gptKey || null,
      },
    });
  } else if (msg.type === 'save-provider-key' && msg.provider && msg.key) {
    await figma.clientStorage.setAsync(`api-key-${msg.provider}`, msg.key);
    figma.ui.postMessage({ type: 'provider-key-saved', provider: msg.provider });
  } else if (msg.type === 'clear-provider-key' && msg.provider) {
    await figma.clientStorage.deleteAsync(`api-key-${msg.provider}`);
    figma.ui.postMessage({ type: 'provider-key-cleared', provider: msg.provider });
  } else if (msg.type === 'set-selected-provider' && msg.provider) {
    await figma.clientStorage.setAsync('selected-provider', msg.provider);
  } else if (msg.type === 'get-locale') {
    const locale = await figma.clientStorage.getAsync('user-locale');
    figma.ui.postMessage({ type: 'locale-response', locale: locale || 'en' });
  } else if (msg.type === 'save-locale' && (msg as any).locale) {
    await figma.clientStorage.setAsync('user-locale', (msg as any).locale);
  } else if (msg.type === 'get-accessibility-settings') {
    const fontSize = await figma.clientStorage.getAsync('font-size');
    const screenReaderMode = await figma.clientStorage.getAsync('screen-reader-mode');
    figma.ui.postMessage({
      type: 'accessibility-settings-response',
      fontSize: fontSize || 'medium',
      screenReaderMode: screenReaderMode || false,
    });
  } else if (msg.type === 'save-accessibility-settings') {
    const settings = msg as any;
    await figma.clientStorage.setAsync('font-size', settings.fontSize);
    await figma.clientStorage.setAsync('screen-reader-mode', settings.screenReaderMode);
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
  } else if (msg.type === 'place-component') {
    // Component placement
    await handleComponentPlacement({
      componentKey: msg.componentKey || '',
      componentName: msg.componentName || '',
      variant: msg.variant || null,
    });
  } else if (msg.type === 'analyze-frame') {
    // Frame scanning for design system compliance
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'analysis-error',
        message: 'Please select a frame to analyze',
      });
      return;
    }

    const node = selection[0];

    if (
      node.type !== 'FRAME' &&
      node.type !== 'COMPONENT' &&
      node.type !== 'INSTANCE' &&
      node.type !== 'SECTION'
    ) {
      figma.ui.postMessage({
        type: 'analysis-error',
        message: 'Please select a frame, component, section, or instance',
      });
      return;
    }

    const frameData = await extractFrameData(node);

    figma.ui.postMessage({
      type: 'analysis-data',
      data: frameData,
      frameName: node.name,
    });
  }
};

// Send initial selection state and notify UI that plugin is ready
sendCurrentSelection();
figma.ui.postMessage({ type: 'plugin-ready' });
