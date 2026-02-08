import type { SelectionData } from './types/figma';
import { handleComponentPlacement } from './placement/placement-handler';

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
