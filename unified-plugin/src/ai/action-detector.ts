import sdsComponents from '../knowledge/sds-components.json';
import type { ComponentAction } from '../types';
import { normalizeName } from '../placement/component-finder';

// Build a map of component names to their data
interface ComponentData {
  componentKey: string;
  variantKeys?: Record<string, string>;
  variants?: Record<string, string>;
}

function buildComponentMap(): Map<string, ComponentData> {
  const map = new Map<string, ComponentData>();

  // Add primitives
  if (sdsComponents.primitives) {
    for (const [name, data] of Object.entries(sdsComponents.primitives)) {
      map.set(name.toLowerCase(), {
        componentKey: (data as any).componentKey,
        variantKeys: (data as any).variantKeys,
        variants: (data as any).variants,
      });
    }
  }

  // Add compositions (nested structure)
  if (sdsComponents.compositions) {
    for (const category of Object.values(sdsComponents.compositions)) {
      for (const [name, data] of Object.entries(category as Record<string, any>)) {
        map.set(name.toLowerCase(), {
          componentKey: (data as any).componentKey,
          variantKeys: (data as any).variantKeys,
        });
      }
    }
  }

  return map;
}

const componentMap = buildComponentMap();

// Get all component names sorted by length (longest first)
const componentNames = Array.from(componentMap.keys()).sort((a, b) => b.length - a.length);

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Detect a variant mentioned in text for a given component
 */
function detectVariant(text: string, componentName: string): string | null {
  const data = componentMap.get(componentName.toLowerCase());
  if (!data || !data.variants) return null;

  const variantNames = Object.keys(data.variants);

  // Try to find variant mentions in the text
  for (const variantName of variantNames) {
    const pattern = new RegExp(
      `\\b${escapeRegex(variantName)}\\b|\\(${escapeRegex(variantName)}\\)|variant:\\s*${escapeRegex(variantName)}`,
      'i'
    );

    if (pattern.test(text)) {
      return variantName;
    }
  }

  return null;
}

/**
 * Detect component action from AI response text
 * Looks for component names mentioned with emphasis (bold, code, etc.)
 */
export function detectComponentAction(text: string): ComponentAction | null {
  // Sort by length (longest first) to avoid partial matches
  for (const componentName of componentNames) {
    // Look for component name in bold (**ComponentName**) or code (`ComponentName`)
    const boldPattern = new RegExp(
      `\\*\\*${escapeRegex(componentName)}\\*\\*|` +
      `\`${escapeRegex(componentName)}\`|` +
      `\\b${escapeRegex(componentName)}\\b`,
      'i'
    );

    if (boldPattern.test(text)) {
      const data = componentMap.get(componentName.toLowerCase());
      if (!data) continue;

      const variant = detectVariant(text, componentName);

      // If a variant was detected and we have a specific key for it, use that key
      // This ensures we import the exact variant (e.g., danger-primary) instead of the base component
      let resolvedKey = data.componentKey;
      if (variant && data.variantKeys) {
        const variantLower = variant.toLowerCase();
        for (const [vName, vKey] of Object.entries(data.variantKeys)) {
          if (vName.toLowerCase() === variantLower) {
            resolvedKey = vKey;
            break;
          }
        }
      }

      return {
        type: 'place_component',
        componentKey: resolvedKey,
        componentName: componentName,
        variant: variant,
      };
    }
  }

  return null;
}

/**
 * Get all available component names (for debugging)
 */
export function getAllComponentNames(): string[] {
  return componentNames;
}
