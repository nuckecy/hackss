// Normalize a name for comparison: lowercase and strip spaces/hyphens
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[\s\-_]/g, '');
}

// Find a component or component set by name across all pages
export async function findComponentByName(
  name: string
): Promise<ComponentNode | ComponentSetNode | null> {
  // Load all pages so we can search the entire file
  await figma.loadAllPagesAsync();

  const normalized = normalizeName(name);

  // Try normalized match on component sets (e.g., "buttondanger" matches "Button Danger")
  const componentSet = figma.root.findOne(
    (n) =>
      n.type === 'COMPONENT_SET' && normalizeName(n.name) === normalized
  ) as ComponentSetNode | null;

  if (componentSet) return componentSet;

  // Try normalized match on individual components
  const component = figma.root.findOne(
    (n) =>
      n.type === 'COMPONENT' && normalizeName(n.name) === normalized
  ) as ComponentNode | null;

  if (component) return component;

  // Try partial match (e.g., "button" matches "Button Danger")
  const partialSet = figma.root.findOne(
    (n) =>
      n.type === 'COMPONENT_SET' &&
      normalizeName(n.name).includes(normalized)
  ) as ComponentSetNode | null;

  if (partialSet) return partialSet;

  return null;
}

// Get the default variant from a component set
export function getDefaultVariant(
  componentSet: ComponentSetNode,
  preferredVariant: string | null
): ComponentNode {
  const children = componentSet.children.filter(
    (c) => c.type === 'COMPONENT'
  ) as ComponentNode[];

  if (preferredVariant) {
    // Try to find a variant matching the preferred name
    const lowerPref = preferredVariant.toLowerCase();
    const match = children.find((c) =>
      c.name.toLowerCase().includes(lowerPref)
    );
    if (match) return match;
  }

  // Try to find a "Default" state variant
  const defaultVariant = children.find(
    (c) =>
      c.name.includes('Default') ||
      c.name.includes('default')
  );

  return defaultVariant || children[0];
}
