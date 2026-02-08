import { findComponentByName, getDefaultVariant } from './component-finder';

interface PlaceComponentPayload {
  componentKey: string;
  componentName: string;
  variant: string | null;
}

interface PlacementResult {
  success: boolean;
  message: string;
  componentName?: string;
}

/**
 * Handle component placement request from UI
 */
export async function handleComponentPlacement(
  payload: PlaceComponentPayload
): Promise<void> {
  try {
    const { componentKey, componentName, variant } = payload;

    let instance: InstanceNode | null = null;
    let resolvedName = componentName;

    // Strategy 1: Import by key from the published library (most reliable)
    if (componentKey && componentKey !== 'YOUR_KEY_HERE') {
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
              if (propValue.type === 'VARIANT') {
                // Check if this variant property has a matching value
                const lowerVariant = variant.toLowerCase();
                const lowerPropName = propName.toLowerCase();
                if (
                  lowerPropName === 'variant' ||
                  lowerPropName.includes('variant') ||
                  lowerPropName === 'type' ||
                  lowerPropName === 'style'
                ) {
                  instance.setProperties({
                    [propName]: variant.charAt(0).toUpperCase() + variant.slice(1)
                  });
                  break;
                }
              }
            }
          } catch (variantErr) {
            console.log('Could not set variant:', variantErr);
          }
        }
      } catch (importErr) {
        console.log('importComponentByKeyAsync failed:', importErr);
      }
    }

    // Strategy 2: Find component by name in the current file
    if (!instance) {
      const found = await findComponentByName(componentName);

      if (found) {
        if (found.type === 'COMPONENT_SET') {
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
      const result: PlacementResult = {
        success: false,
        message: `Could not find "${componentName}" in this file. Open the SDS library file and try again, or enable it as a team library.`,
      };

      figma.ui.postMessage(
        Object.assign({ type: 'placement-result' }, result)
      );

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
      instance.y = selected.y + (selected as any).height + 20;
    } else {
      const viewport = figma.viewport.center;
      instance.x = viewport.x - instance.width / 2;
      instance.y = viewport.y - instance.height / 2;
    }

    // Select the new instance and scroll to it
    figma.currentPage.selection = [instance];
    figma.viewport.scrollAndZoomIntoView([instance]);

    const result: PlacementResult = {
      success: true,
      message: `Placed ${resolvedName} into your file.`,
      componentName: resolvedName,
    };

    figma.ui.postMessage(
      Object.assign({ type: 'placement-result' }, result)
    );

    figma.notify(`Placed ${resolvedName}`);
  } catch (error: any) {
    console.error('Placement error:', error);

    const result: PlacementResult = {
      success: false,
      message: `Placement failed: ${error.message}`,
    };

    figma.ui.postMessage(
      Object.assign({ type: 'placement-result' }, result)
    );

    figma.notify(`Placement failed: ${error.message}`, { error: true });
  }
}
