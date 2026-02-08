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
