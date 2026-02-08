import type { SelectionDataV2 } from '../../types/figma';
import type { ScanIssue } from '../../types/scan';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

function linearize(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function getContrastRatio(fg: RGB, bg: RGB): number {
  const l1 = getRelativeLuminance(fg.r, fg.g, fg.b);
  const l2 = getRelativeLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function checkContrast(
  node: SelectionDataV2,
  bgColor?: RGB
): ScanIssue | null {
  if (node.type !== 'TEXT') return null;

  const fills = node.fills;
  if (!fills || fills.length === 0) return null;

  const solidFill = fills.find(function (f) {
    return f.type === 'SOLID' && f.color;
  });
  if (!solidFill || !solidFill.color) return null;

  const fgColor: RGB = solidFill.color;

  // Use provided bg or default to white
  const bg: RGB = bgColor || { r: 1, g: 1, b: 1 };

  const ratio = getContrastRatio(fgColor, bg);

  const fontSize = node.fontSize;
  const fontStyle = node.fontName ? node.fontName.style : '';
  const isBold =
    fontStyle.toLowerCase().indexOf('bold') >= 0 ||
    fontStyle.indexOf('700') >= 0 ||
    fontStyle.indexOf('800') >= 0 ||
    fontStyle.indexOf('900') >= 0;
  const isLargeText =
    typeof fontSize === 'number' && (fontSize >= 18 || (fontSize >= 14 && isBold));

  const requiredRatio = isLargeText ? 3 : 4.5;

  if (ratio >= requiredRatio) return null;

  const textPreview = node.characters ? node.characters.substring(0, 30) : node.name;

  return {
    id: 'contrast-' + node.id,
    severity: 'error',
    category: 'accessibility',
    title: 'Insufficient color contrast',
    description:
      'Text "' +
      textPreview +
      '" has a contrast ratio of ' +
      ratio.toFixed(2) +
      ':1, which does not meet the WCAG AA requirement of ' +
      requiredRatio +
      ':1 for ' +
      (isLargeText ? 'large' : 'normal') +
      ' text.',
    nodeId: node.id,
    nodeName: node.name,
    fixable: false,
    currentValue: ratio.toFixed(2) + ':1',
    expectedValue: '\u2265 ' + requiredRatio + ':1',
  };
}
