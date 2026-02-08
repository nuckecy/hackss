import sdsComponents from '../knowledge/sds-components.json';
import { normalizeName } from './component-finder';

interface ComponentData {
  componentKey: string;
  variantKeys?: Record<string, string>;
}

// Build a flat map of component names to their keys
function buildComponentKeyMap(): Map<string, ComponentData> {
  const map = new Map<string, ComponentData>();

  // Add primitives
  if (sdsComponents.primitives) {
    for (const [name, data] of Object.entries(sdsComponents.primitives)) {
      const normalized = normalizeName(name);
      map.set(normalized, {
        componentKey: (data as any).componentKey,
        variantKeys: (data as any).variantKeys,
      });
    }
  }

  // Add compositions
  if (sdsComponents.compositions) {
    for (const category of Object.values(sdsComponents.compositions)) {
      for (const [name, data] of Object.entries(category as Record<string, any>)) {
        const normalized = normalizeName(name);
        map.set(normalized, {
          componentKey: (data as any).componentKey,
          variantKeys: (data as any).variantKeys,
        });
      }
    }
  }

  return map;
}

const componentKeyMap = buildComponentKeyMap();

/**
 * Get the component key for a component name
 */
export function getComponentKey(componentName: string): string | null {
  const normalized = normalizeName(componentName);
  const data = componentKeyMap.get(normalized);
  return data?.componentKey || null;
}

/**
 * Get the variant key for a component and variant name
 */
export function getVariantKey(componentName: string, variantName: string): string | null {
  const normalized = normalizeName(componentName);
  const data = componentKeyMap.get(normalized);

  if (!data || !data.variantKeys) return null;

  const normalizedVariant = normalizeName(variantName);

  // Try exact match first
  for (const [key, value] of Object.entries(data.variantKeys)) {
    if (normalizeName(key) === normalizedVariant) {
      return value;
    }
  }

  // Try partial match
  for (const [key, value] of Object.entries(data.variantKeys)) {
    if (normalizeName(key).includes(normalizedVariant)) {
      return value;
    }
  }

  return null;
}

/**
 * Get all component names (for debugging/testing)
 */
export function getAllComponentNames(): string[] {
  return Array.from(componentKeyMap.keys());
}
