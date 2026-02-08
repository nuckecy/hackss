export interface SelectionData {
  id: string;
  name: string;
  type: string;
  componentName?: string;
  variantProperties?: Record<string, string>;
  width: number;
  height: number;
  fills?: Array<{
    type: string;
    color?: { r: number; g: number; b: number };
    opacity?: number;
  }>;
  strokes?: Array<{
    type: string;
    color?: { r: number; g: number; b: number };
  }>;
  fontSize?: number;
  fontName?: { family: string; style: string };
  lineHeight?: { value: number; unit: string };
  characters?: string;
  layoutMode?: string;
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  childrenSummary?: Array<{
    name: string;
    type: string;
    componentName?: string;
  }>;
}

export interface SelectionDataV2 extends SelectionData {
  // Recursive children (up to 3 levels deep, 20 per level)
  children?: SelectionDataV2[];
  childCount?: number;

  // Component metadata
  componentId?: string;
  componentDescription?: string;
  componentSetName?: string;

  // Style references
  fillStyleId?: string;
  fillStyleName?: string;
  strokeStyleId?: string;
  strokeStyleName?: string;
  textStyleId?: string;
  textStyleName?: string;
  effectStyleId?: string;
  effectStyleName?: string;

  // Layout constraints
  constraints?: { horizontal: string; vertical: string };
  layoutAlign?: string;
  layoutGrow?: number;

  // Position
  absoluteX?: number;
  absoluteY?: number;

  // Visibility & state
  opacity?: number;
  visible?: boolean;
  locked?: boolean;

  // Shape
  cornerRadius?: number | number[];
}
