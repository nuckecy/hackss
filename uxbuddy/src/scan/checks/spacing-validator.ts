import type { SelectionDataV2 } from '../../types/figma';
import type { ScanIssue } from '../../types/scan';
import type { TokenLookup } from './token-matcher';

export function validateSpacing(
  node: SelectionDataV2,
  tokenLookup: TokenLookup
): ScanIssue[] {
  const issues: ScanIssue[] = [];

  if (node.layoutMode === undefined || node.layoutMode === 'NONE') return issues;

  const paddings: Array<{ key: string; value: number | undefined; prop: string }> = [
    { key: 'paddingTop', value: node.paddingTop, prop: 'paddingTop' },
    { key: 'paddingRight', value: node.paddingRight, prop: 'paddingRight' },
    { key: 'paddingBottom', value: node.paddingBottom, prop: 'paddingBottom' },
    { key: 'paddingLeft', value: node.paddingLeft, prop: 'paddingLeft' },
  ];

  for (var i = 0; i < paddings.length; i++) {
    var entry = paddings[i];
    if (entry.value === undefined) continue;
    var result = tokenLookup.findClosestToken(entry.value, 'spacing');
    if (!result.match && result.suggestion) {
      var fixProps: Record<string, unknown> = {};
      fixProps[entry.prop] = result.suggestedValue;
      issues.push({
        id: 'spacing-' + entry.key + '-' + node.id,
        severity: 'warning',
        category: 'design-system',
        title: 'Non-standard ' + entry.key,
        description:
          '"' + node.name + '": ' +
          entry.key +
          ' is ' +
          entry.value +
          'px which doesn\'t match any spacing token. Closest: ' +
          result.suggestion +
          ' (' +
          result.suggestedValue +
          'px).',
        nodeId: node.id,
        nodeName: node.name,
        fixable: true,
        fixType: 'set-padding',
        fixProperties: fixProps,
        currentValue: entry.value + 'px',
        expectedValue: result.suggestion,
      });
    }
  }

  if (node.itemSpacing !== undefined) {
    var spacingResult = tokenLookup.findClosestToken(node.itemSpacing, 'spacing');
    if (!spacingResult.match && spacingResult.suggestion) {
      issues.push({
        id: 'spacing-itemSpacing-' + node.id,
        severity: 'warning',
        category: 'design-system',
        title: 'Non-standard item spacing',
        description:
          '"' + node.name + '": item spacing is ' +
          node.itemSpacing +
          'px which doesn\'t match any spacing token. Closest: ' +
          spacingResult.suggestion +
          ' (' +
          spacingResult.suggestedValue +
          'px).',
        nodeId: node.id,
        nodeName: node.name,
        fixable: true,
        fixType: 'set-spacing',
        fixProperties: { itemSpacing: spacingResult.suggestedValue },
        currentValue: node.itemSpacing + 'px',
        expectedValue: spacingResult.suggestion,
      });
    }
  }

  return issues;
}
