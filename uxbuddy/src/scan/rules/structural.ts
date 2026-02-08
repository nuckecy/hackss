import type { SelectionDataV2 } from '../../types/figma';
import type { ScanIssue } from '../../types/scan';
import type { ScanRule, KnowledgeBase } from '../types';

var GENERIC_NAME_PATTERN = /^(Frame|Rectangle|Group|Ellipse|Line|Polygon|Star|Vector|Section)\s*\d*$/;

export const structuralRules: ScanRule[] = [
  {
    id: 'auto-layout',
    category: 'structural',
    check: function (node: SelectionDataV2, _kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];

      // Only check frames/components with children
      var hasChildren = node.childCount !== undefined && node.childCount > 0;
      var isContainer =
        node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'COMPONENT_SET';
      if (!isContainer || !hasChildren) return issues;

      if (node.layoutMode === undefined || node.layoutMode === 'NONE') {
        issues.push({
          id: 'auto-layout-' + node.id,
          severity: 'warning',
          category: 'structural',
          title: 'No auto-layout on container',
          description:
            '"' +
            node.name +
            '" is a container with ' +
            node.childCount +
            ' children but doesn\'t use auto-layout. Auto-layout makes designs more maintainable and responsive.',
          nodeId: node.id,
          nodeName: node.name,
          fixable: true,
          fixType: 'set-auto-layout',
          fixProperties: { layoutMode: 'VERTICAL' },
          currentValue: 'None',
          expectedValue: 'VERTICAL or HORIZONTAL',
        });
      }
      return issues;
    },
  },

  {
    id: 'layer-naming',
    category: 'structural',
    check: function (node: SelectionDataV2, _kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];

      if (GENERIC_NAME_PATTERN.test(node.name)) {
        issues.push({
          id: 'layer-naming-' + node.id,
          severity: 'info',
          category: 'structural',
          title: 'Generic layer name',
          description:
            '"' +
            node.name +
            '" uses Figma\'s default name. Descriptive layer names improve collaboration and handoff.',
          nodeId: node.id,
          nodeName: node.name,
          fixable: false,
        });
      }
      return issues;
    },
  },

  {
    id: 'hidden-layers',
    category: 'structural',
    check: function (node: SelectionDataV2, _kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];

      if (node.visible === false) {
        issues.push({
          id: 'hidden-layer-' + node.id,
          severity: 'info',
          category: 'structural',
          title: 'Hidden layer detected',
          description:
            '"' +
            node.name +
            '" is hidden. Hidden layers add file size and can cause confusion. Consider removing if no longer needed.',
          nodeId: node.id,
          nodeName: node.name,
          fixable: false,
        });
      }
      return issues;
    },
  },
];
