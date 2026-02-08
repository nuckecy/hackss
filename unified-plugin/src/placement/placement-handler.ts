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
    // The componentKey may already be a variant-specific key (resolved by action-detector),
    // but as a fallback we also try looking up the variant key from the mapper.
    if (componentKey && componentKey !== 'YOUR_KEY_HERE') {
      // First, try importing the key we were given (may already be variant-specific)
      try {
        const imported =
          await figma.importComponentByKeyAsync(componentKey);
        instance = imported.createInstance();
        resolvedName = imported.name;
      } catch (importErr) {
        console.log('importComponentByKeyAsync failed for given key:', importErr);
      }

      // If we got an instance but a variant was requested, try to apply it
      // via variant properties as a fallback (in case the key was the base key)
      if (instance && variant) {
        try {
          const props = instance.componentProperties;
          if (props) {
            for (const [propName, propValue] of Object.entries(props)) {
              if (propValue.type === 'VARIANT') {
                // Try setting the variant value with various capitalizations
                const capitalizedVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
                try {
                  instance.setProperties({ [propName]: capitalizedVariant });
                  break;
                } catch {
                  // Try lowercase
                  try {
                    instance.setProperties({ [propName]: variant.toLowerCase() });
                    break;
                  } catch {
                    // Try as-is
                    try {
                      instance.setProperties({ [propName]: variant });
                      break;
                    } catch {
                      // This property doesn't accept this variant value, try next property
                    }
                  }
                }
              }
            }
          }
        } catch (variantErr) {
          console.log('Could not set variant property:', variantErr);
        }
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
