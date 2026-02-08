import type { SelectionDataV2 } from '../../types/figma';
import type { ScanIssue } from '../../types/scan';
import type { ScanRule, KnowledgeBase } from '../types';
import { checkContrast } from '../checks/contrast';
import type { RGB } from '../checks/contrast';

function getFirstSolidFillColor(node: SelectionDataV2): RGB | undefined {
  var fills = node.fills;
  if (!fills) return undefined;
  for (var i = 0; i < fills.length; i++) {
    if (fills[i].type === 'SOLID' && fills[i].color) {
      return fills[i].color as RGB;
    }
  }
  return undefined;
}

// Interactive component types that need touch target checks
var INTERACTIVE_TYPES = ['INSTANCE'];
var INTERACTIVE_COMPONENT_NAMES = [
  'button', 'iconbutton', 'icon-button', 'icon_button',
  'input', 'select', 'checkbox', 'radio', 'toggle', 'switch',
  'tab', 'link',
];

function isInteractive(node: SelectionDataV2): boolean {
  if (INTERACTIVE_TYPES.indexOf(node.type) >= 0 && node.componentName) {
    var name = node.componentName.toLowerCase();
    for (var i = 0; i < INTERACTIVE_COMPONENT_NAMES.length; i++) {
      if (name.indexOf(INTERACTIVE_COMPONENT_NAMES[i]) >= 0) return true;
    }
  }
  return false;
}

export const accessibilityRules: ScanRule[] = [
  {
    id: 'contrast-ratio',
    category: 'accessibility',
    check: function (node: SelectionDataV2, _kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];

      // Check the node itself if it's text
      if (node.type === 'TEXT') {
        var issue = checkContrast(node);
        if (issue) issues.push(issue);
        return issues;
      }

      // For container nodes, check text children against parent's background fill
      var bgColor = getFirstSolidFillColor(node);
      var children = node.children;
      if (!children) return issues;

      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child.type === 'TEXT') {
          var childIssue = checkContrast(child, bgColor);
          if (childIssue) issues.push(childIssue);
        }
      }
      return issues;
    },
  },

  {
    id: 'touch-target',
    category: 'accessibility',
    check: function (node: SelectionDataV2, _kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];
      if (!isInteractive(node)) return issues;

      var minSize = 44;
      var tooSmall = node.width < minSize || node.height < minSize;
      if (!tooSmall) return issues;

      var smallest = Math.min(node.width, node.height);
      issues.push({
        id: 'touch-target-' + node.id,
        severity: 'error',
        category: 'accessibility',
        title: 'Touch target too small',
        description:
          node.name +
          ' is ' +
          Math.round(node.width) +
          'x' +
          Math.round(node.height) +
          'px. Interactive elements need at least ' +
          minSize +
          'x' +
          minSize +
          'px for WCAG 2.5.8 compliance.',
        nodeId: node.id,
        nodeName: node.name,
        fixable: true,
        fixType: 'resize-touch-target',
        fixProperties: {
          width: Math.max(node.width, minSize),
          height: Math.max(node.height, minSize),
        },
        currentValue: Math.round(smallest) + 'px',
        expectedValue: '\u2265 ' + minSize + 'px',
      });
      return issues;
    },
  },

  {
    id: 'text-size',
    category: 'accessibility',
    check: function (node: SelectionDataV2, _kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];
      if (node.type !== 'TEXT') return issues;

      var fontSize = node.fontSize;
      if (typeof fontSize !== 'number') return issues;

      var minSize = 11;
      if (fontSize >= minSize) return issues;

      issues.push({
        id: 'text-size-' + node.id,
        severity: 'warning',
        category: 'accessibility',
        title: 'Text may be too small',
        description:
          'Text "' +
          (node.characters || node.name).substring(0, 30) +
          '" is ' +
          fontSize +
          'px. Minimum recommended size is ' +
          minSize +
          'px for readability.',
        nodeId: node.id,
        nodeName: node.name,
        fixable: true,
        fixType: 'set-font-size',
        fixProperties: { fontSize: minSize },
        currentValue: fontSize + 'px',
        expectedValue: '\u2265 ' + minSize + 'px',
      });
      return issues;
    },
  },
];
