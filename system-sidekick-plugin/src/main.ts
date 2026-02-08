import { on, emit, showUI } from "@create-figma-plugin/utilities";

interface PlaceComponentPayload {
  componentKey: string;
  componentName: string;
  variant: string | null;
}

// Normalize a name for comparison: lowercase and strip spaces/hyphens
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[\s\-_]/g, "");
}

// Find a component or component set by name across all pages
async function findComponentByName(
  name: string
): Promise<ComponentNode | ComponentSetNode | null> {
  // Load all pages so we can search the entire file
  await figma.loadAllPagesAsync();

  const normalized = normalizeName(name);

  // Try normalized match on component sets (e.g., "buttondanger" matches "Button Danger")
  const componentSet = figma.root.findOne(
    (n) =>
      n.type === "COMPONENT_SET" && normalizeName(n.name) === normalized
  ) as ComponentSetNode | null;

  if (componentSet) return componentSet;

  // Try normalized match on individual components
  const component = figma.root.findOne(
    (n) =>
      n.type === "COMPONENT" && normalizeName(n.name) === normalized
  ) as ComponentNode | null;

  if (component) return component;

  // Try partial match (e.g., "button" matches "Button Danger")
  const partialSet = figma.root.findOne(
    (n) =>
      n.type === "COMPONENT_SET" &&
      normalizeName(n.name).includes(normalized)
  ) as ComponentSetNode | null;

  if (partialSet) return partialSet;

  return null;
}

// Get the default variant from a component set
function getDefaultVariant(
  componentSet: ComponentSetNode,
  preferredVariant: string | null
): ComponentNode {
  const children = componentSet.children.filter(
    (c) => c.type === "COMPONENT"
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
      c.name.includes("Default") ||
      c.name.includes("default")
  );

  return defaultVariant || children[0];
}

export default function () {
  // Open the UI panel
  showUI({ width: 400, height: 600 });

  // Listen for placement requests from the UI
  on("PLACE_COMPONENT", async (payload: PlaceComponentPayload) => {
    try {
      const { componentKey, componentName, variant } = payload;

      let instance: InstanceNode | null = null;
      let resolvedName = componentName;

      // Strategy 1: Import by key from the published library (most reliable)
      if (componentKey && componentKey !== "YOUR_KEY_HERE") {
        try {
          const imported =
            await figma.importComponentByKeyAsync(componentKey);
          instance = imported.createInstance();
          resolvedName = imported.name;

          // Apply variant if specified (e.g., "alert" for Notification)
          if (variant && instance.componentProperties) {
            try {
              const props = instance.componentProperties;
              for (const [propName, propValue] of Object.entries(props)) {
                if (propValue.type === "VARIANT") {
                  // Check if this variant property has a matching value
                  const lowerVariant = variant.toLowerCase();
                  const lowerPropName = propName.toLowerCase();
                  if (
                    lowerPropName === "variant" ||
                    lowerPropName.includes("variant") ||
                    lowerPropName === "type" ||
                    lowerPropName === "style"
                  ) {
                    instance.setProperties({ [propName]: variant.charAt(0).toUpperCase() + variant.slice(1) });
                    break;
                  }
                }
              }
            } catch (variantErr) {
              console.log("Could not set variant:", variantErr);
            }
          }
        } catch (importErr) {
          console.log("importComponentByKeyAsync failed:", importErr);
        }
      }

      // Strategy 2: Find component by name in the current file
      if (!instance) {
        const found = await findComponentByName(componentName);

        if (found) {
          if (found.type === "COMPONENT_SET") {
            const targetVariant = getDefaultVariant(found, variant);
            instance = targetVariant.createInstance();
            resolvedName = found.name;
          } else {
            instance = found.createInstance();
            resolvedName = found.name;
          }
        }
      }

      // If we couldn't find or import the component
      if (!instance) {
        emit("PLACEMENT_RESULT", {
          success: false,
          message: `Could not find "${componentName}" in this file. Open the SDS library file and try again, or enable it as a team library.`,
        });
        figma.notify(`Component "${componentName}" not found in this file`, {
          error: true,
        });
        return;
      }

      // Position the instance
      const selection = figma.currentPage.selection;
      if (selection.length > 0) {
        const selected = selection[0];
        instance.x = selected.x;
        instance.y = selected.y + selected.height + 20;
      } else {
        const viewport = figma.viewport.center;
        instance.x = viewport.x - instance.width / 2;
        instance.y = viewport.y - instance.height / 2;
      }

      // Select the new instance and scroll to it
      figma.currentPage.selection = [instance];
      figma.viewport.scrollAndZoomIntoView([instance]);

      emit("PLACEMENT_RESULT", {
        success: true,
        message: `Placed ${resolvedName} into your file.`,
        componentName: resolvedName,
      });

      figma.notify(`Placed ${resolvedName}`);
    } catch (error: any) {
      console.error("Placement error:", error);
      emit("PLACEMENT_RESULT", {
        success: false,
        message: `Placement failed: ${error.message}`,
      });
      figma.notify(`Placement failed: ${error.message}`, { error: true });
    }
  });

  // Track selection changes and send context to UI
  figma.on("selectionchange", () => {
    const selection = figma.currentPage.selection;

    if (selection.length > 0) {
      const node = selection[0];
      emit("SELECTION_CONTEXT", {
        nodeName: node.name,
        nodeType: node.type,
        width: "width" in node ? (node as any).width : null,
        height: "height" in node ? (node as any).height : null,
      });
    } else {
      emit("SELECTION_CONTEXT", {
        nodeName: null,
        nodeType: null,
        width: null,
        height: null,
      });
    }
  });
}
