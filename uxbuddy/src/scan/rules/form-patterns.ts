import type { SelectionDataV2 } from '../../types/figma';
import type { ScanIssue } from '../../types/scan';
import type { ScanRule, KnowledgeBase } from '../types';

// Component names that indicate form elements (matched case-insensitively)
var FORM_COMPONENT_NAMES = [
  'input', 'select', 'checkbox', 'radio', 'toggle', 'switch', 'textarea',
];

function isFormComponent(child: SelectionDataV2): boolean {
  if (child.type !== 'INSTANCE') return false;
  var name = (child.componentName || child.componentSetName || '').toLowerCase();
  for (var i = 0; i < FORM_COMPONENT_NAMES.length; i++) {
    if (name.indexOf(FORM_COMPONENT_NAMES[i]) >= 0) return true;
  }
  return false;
}

function countFormComponents(node: SelectionDataV2): number {
  if (!node.children) return 0;
  var count = 0;
  for (var i = 0; i < node.children.length; i++) {
    if (isFormComponent(node.children[i])) {
      count++;
    }
    // Check one level deeper for nested field groups
    var grandchildren = node.children[i].children;
    if (grandchildren) {
      for (var j = 0; j < grandchildren.length; j++) {
        if (isFormComponent(grandchildren[j])) {
          count++;
        }
      }
    }
  }
  return count;
}

function isFormLikeFrame(node: SelectionDataV2): boolean {
  if (
    node.type !== 'FRAME' &&
    node.type !== 'COMPONENT' &&
    node.type !== 'SECTION'
  ) {
    return false;
  }
  if (!node.children || node.children.length === 0) return false;
  return countFormComponents(node) >= 2;
}

function hasTextChild(node: SelectionDataV2): boolean {
  if (!node.children) return false;
  for (var i = 0; i < node.children.length; i++) {
    if (node.children[i].type === 'TEXT') return true;
  }
  return false;
}

export var formPatternRules: ScanRule[] = [
  // Rule 1: Form field spacing should be space.4 (8px)
  {
    id: 'form-field-spacing',
    category: 'form-patterns',
    check: function (node: SelectionDataV2, _kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];
      if (!isFormLikeFrame(node)) return issues;
      if (!node.layoutMode || node.layoutMode === 'NONE') return issues;

      var EXPECTED_SPACING = 8; // space.4

      if (node.itemSpacing !== undefined && node.itemSpacing !== EXPECTED_SPACING) {
        issues.push({
          id: 'form-field-spacing-' + node.id,
          severity: 'warning',
          category: 'form-patterns',
          title: 'Form field spacing should use space.4',
          description:
            '"' + node.name + '" has item spacing of ' +
            node.itemSpacing + 'px. Form fields should be spaced at space.4 (8px) ' +
            'for consistent rhythm between fields.',
          nodeId: node.id,
          nodeName: node.name,
          fixable: true,
          fixType: 'set-spacing',
          fixProperties: { itemSpacing: EXPECTED_SPACING },
          currentValue: node.itemSpacing + 'px',
          expectedValue: 'space.4 (8px)',
        });
      }

      return issues;
    },
  },

  // Rule 2: Form container padding should be space.6 (16px)
  {
    id: 'form-padding',
    category: 'form-patterns',
    check: function (node: SelectionDataV2, _kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];
      if (!isFormLikeFrame(node)) return issues;
      if (!node.layoutMode || node.layoutMode === 'NONE') return issues;

      var EXPECTED_PADDING = 16; // space.6
      var paddings = [
        { key: 'paddingTop', value: node.paddingTop },
        { key: 'paddingRight', value: node.paddingRight },
        { key: 'paddingBottom', value: node.paddingBottom },
        { key: 'paddingLeft', value: node.paddingLeft },
      ];

      var wrongPaddings: string[] = [];
      var fixProps: Record<string, unknown> = {};

      for (var i = 0; i < paddings.length; i++) {
        var p = paddings[i];
        if (p.value !== undefined && p.value !== EXPECTED_PADDING) {
          wrongPaddings.push(p.key + ': ' + p.value + 'px');
          fixProps[p.key] = EXPECTED_PADDING;
        }
      }

      if (wrongPaddings.length > 0) {
        issues.push({
          id: 'form-padding-' + node.id,
          severity: 'warning',
          category: 'form-patterns',
          title: 'Form padding should use space.6',
          description:
            '"' + node.name + '" has non-standard padding (' +
            wrongPaddings.join(', ') +
            '). Form containers should use space.6 (16px) padding.',
          nodeId: node.id,
          nodeName: node.name,
          fixable: true,
          fixType: 'set-padding',
          fixProperties: fixProps,
          currentValue: wrongPaddings.join(', '),
          expectedValue: 'space.6 (16px) on all sides',
        });
      }

      return issues;
    },
  },

  // Rule 3: Every form input must have a visible label
  {
    id: 'form-label-presence',
    category: 'form-patterns',
    check: function (node: SelectionDataV2, _kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];
      if (!isFormLikeFrame(node)) return issues;
      if (!node.children) return issues;

      for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i];

        if (isFormComponent(child)) {
          // Strategy 1: Input component has a child TEXT node (embedded label)
          var hasEmbeddedLabel = hasTextChild(child);

          // Strategy 2: Sibling TEXT node immediately before or after
          var hasSiblingLabel = false;
          if (i > 0 && node.children[i - 1].type === 'TEXT') {
            hasSiblingLabel = true;
          }
          if (i < node.children.length - 1 && node.children[i + 1].type === 'TEXT') {
            hasSiblingLabel = true;
          }

          if (!hasEmbeddedLabel && !hasSiblingLabel) {
            issues.push({
              id: 'form-label-' + child.id,
              severity: 'error',
              category: 'form-patterns',
              title: 'Form input missing label',
              description:
                '"' + child.name + '" (' +
                (child.componentName || child.componentSetName || 'form component') +
                ') does not have a visible text label nearby. ' +
                'Every form input must have a label for accessibility (WCAG 1.3.1).',
              nodeId: child.id,
              nodeName: child.name,
              fixable: false,
            });
          }
        }

        // Check wrapper frames that contain form inputs (field groups)
        if ((child.type === 'FRAME' || child.type === 'COMPONENT') && child.children) {
          for (var g = 0; g < child.children.length; g++) {
            var grandchild = child.children[g];
            if (isFormComponent(grandchild)) {
              var groupHasLabel = hasTextChild(child);
              var inputHasLabel = hasTextChild(grandchild);
              if (!groupHasLabel && !inputHasLabel) {
                issues.push({
                  id: 'form-label-' + grandchild.id,
                  severity: 'error',
                  category: 'form-patterns',
                  title: 'Form input missing label',
                  description:
                    '"' + grandchild.name + '" inside group "' + child.name +
                    '" does not have a visible text label. ' +
                    'Add a text layer as a label (WCAG 1.3.1).',
                  nodeId: grandchild.id,
                  nodeName: grandchild.name,
                  fixable: false,
                });
              }
            }
          }
        }
      }

      return issues;
    },
  },

  // Rule 4: Only one filled (primary) button per form
  {
    id: 'form-button-hierarchy',
    category: 'form-patterns',
    check: function (node: SelectionDataV2, _kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];
      if (!isFormLikeFrame(node)) return issues;

      var filledButtons: SelectionDataV2[] = [];

      function collectFilledButtons(children: SelectionDataV2[] | undefined): void {
        if (!children) return;
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          if (child.type === 'INSTANCE') {
            var compName = (child.componentName || child.componentSetName || '').toLowerCase();
            if (
              compName.indexOf('button') >= 0 &&
              compName.indexOf('iconbutton') === -1 &&
              compName.indexOf('icon-button') === -1 &&
              compName.indexOf('icon_button') === -1
            ) {
              var variant =
                child.variantProperties &&
                (child.variantProperties['variant'] || child.variantProperties['Variant']);
              if (variant === 'filled') {
                filledButtons.push(child);
              }
            }
          }
          // Recurse into child frames (action bars, button groups)
          if (child.children) {
            collectFilledButtons(child.children);
          }
        }
      }

      collectFilledButtons(node.children);

      if (filledButtons.length > 1) {
        var buttonNames: string[] = [];
        for (var b = 0; b < filledButtons.length; b++) {
          buttonNames.push('"' + filledButtons[b].name + '"');
        }
        issues.push({
          id: 'form-button-hierarchy-' + node.id,
          severity: 'warning',
          category: 'form-patterns',
          title: 'Multiple filled buttons in form',
          description:
            '"' + node.name + '" has ' + filledButtons.length +
            ' filled buttons (' + buttonNames.join(', ') +
            '). Forms should have one filled (primary) button for the forward action. ' +
            'Use outlined or ghost variants for secondary actions.',
          nodeId: node.id,
          nodeName: node.name,
          fixable: false,
        });
      }

      return issues;
    },
  },

  // Rule 5: Form inputs should meet minimum height (md size = 36px)
  {
    id: 'form-input-min-height',
    category: 'form-patterns',
    check: function (node: SelectionDataV2, _kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];
      if (!isFormLikeFrame(node)) return issues;
      if (!node.children) return issues;

      var MIN_HEIGHT = 36; // md size

      function checkInputHeight(child: SelectionDataV2): void {
        if (!isFormComponent(child)) return;
        if (child.height < MIN_HEIGHT) {
          issues.push({
            id: 'form-input-min-height-' + child.id,
            severity: 'warning',
            category: 'form-patterns',
            title: 'Form input too small',
            description:
              '"' + child.name + '" is ' + Math.round(child.height) +
              'px tall. Form inputs should use the md size (' + MIN_HEIGHT +
              'px) or larger for comfortable data entry.',
            nodeId: child.id,
            nodeName: child.name,
            fixable: true,
            fixType: 'resize-touch-target',
            fixProperties: {
              width: child.width,
              height: MIN_HEIGHT,
            },
            currentValue: Math.round(child.height) + 'px',
            expectedValue: '>= ' + MIN_HEIGHT + 'px',
          });
        }
      }

      for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i];
        checkInputHeight(child);

        // Check nested children (field groups)
        if (child.children) {
          for (var j = 0; j < child.children.length; j++) {
            checkInputHeight(child.children[j]);
          }
        }
      }

      return issues;
    },
  },
];
