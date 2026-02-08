import type { SelectionDataV2 } from '../../types/figma';
import type { ScanIssue } from '../../types/scan';
import type { ComponentEntry } from '../../types/knowledge';
import type { ScanRule, KnowledgeBase } from '../types';
import { TokenLookup } from '../checks/token-matcher';
import { validateSpacing } from '../checks/spacing-validator';

function rgbToHex(r: number, g: number, b: number): string {
  var rr = Math.round(r * 255).toString(16);
  var gg = Math.round(g * 255).toString(16);
  var bb = Math.round(b * 255).toString(16);
  if (rr.length === 1) rr = '0' + rr;
  if (gg.length === 1) gg = '0' + gg;
  if (bb.length === 1) bb = '0' + bb;
  return '#' + rr + gg + bb;
}

var _tokenLookupCache: TokenLookup | null = null;
var _tokenLookupTokens: unknown = null;

function getTokenLookup(kb: KnowledgeBase): TokenLookup {
  if (_tokenLookupCache && _tokenLookupTokens === kb.tokens) {
    return _tokenLookupCache;
  }
  _tokenLookupCache = new TokenLookup(kb.tokens);
  _tokenLookupTokens = kb.tokens;
  return _tokenLookupCache;
}

function findComponent(node: SelectionDataV2, kb: KnowledgeBase): ComponentEntry | null {
  if (node.type !== 'INSTANCE') return null;
  var compName = node.componentName || node.componentSetName;
  if (!compName) return null;

  var compNameLower = compName.toLowerCase();
  for (var i = 0; i < kb.components.length; i++) {
    if (kb.components[i].name.toLowerCase() === compNameLower) {
      return kb.components[i];
    }
  }
  return null;
}

export const designSystemRules: ScanRule[] = [
  {
    id: 'token-fills',
    category: 'design-system',
    check: function (node: SelectionDataV2, kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];
      var fills = node.fills;
      if (!fills || fills.length === 0) return issues;

      var tokenLookup = getTokenLookup(kb);

      var hasGradient = false;
      for (var i = 0; i < fills.length; i++) {
        var f = fills[i];
        if (f.type !== 'SOLID') {
          if (f.type === 'GRADIENT_LINEAR' || f.type === 'GRADIENT_RADIAL' ||
              f.type === 'GRADIENT_ANGULAR' || f.type === 'GRADIENT_DIAMOND') {
            hasGradient = true;
          }
          continue;
        }
        if (!f.color) continue;
        var hex = rgbToHex(f.color.r, f.color.g, f.color.b);
        var result = tokenLookup.findClosestToken(hex, 'color');
        if (!result.match) {
          issues.push({
            id: 'token-fills-' + i + '-' + node.id,
            severity: 'warning',
            category: 'design-system',
            title: 'Fill color not in token palette',
            description:
              '"' + node.name + '": fill color ' +
              hex.toUpperCase() +
              ' does not match any design token.' +
              (result.suggestion ? ' Closest token: ' + result.suggestion + '.' : ''),
            nodeId: node.id,
            nodeName: node.name,
            fixable: false,
            currentValue: hex.toUpperCase(),
            expectedValue: result.suggestion || undefined,
          });
        }
      }
      if (hasGradient) {
        issues.push({
          id: 'token-fills-gradient-' + node.id,
          severity: 'info',
          category: 'design-system',
          title: 'Gradient fill detected',
          description:
            '"' + node.name + '" uses a gradient fill. Gradient fills can\'t be validated against the token palette automatically.',
          nodeId: node.id,
          nodeName: node.name,
          fixable: false,
        });
      }
      return issues;
    },
  },

  {
    id: 'token-spacing',
    category: 'design-system',
    check: function (node: SelectionDataV2, kb: KnowledgeBase): ScanIssue[] {
      var tokenLookup = getTokenLookup(kb);
      return validateSpacing(node, tokenLookup);
    },
  },

  {
    id: 'token-radius',
    category: 'design-system',
    check: function (node: SelectionDataV2, kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];
      if (node.cornerRadius === undefined) return issues;

      var tokenLookup = getTokenLookup(kb);
      var radii: number[] = [];

      if (typeof node.cornerRadius === 'number') {
        radii = [node.cornerRadius];
      } else if (Array.isArray(node.cornerRadius)) {
        radii = node.cornerRadius;
      }

      for (var i = 0; i < radii.length; i++) {
        var r = radii[i];
        var result = tokenLookup.findClosestToken(r, 'radius');
        if (!result.match && result.suggestion) {
          issues.push({
            id: 'token-radius-' + i + '-' + node.id,
            severity: 'warning',
            category: 'design-system',
            title: 'Non-standard border radius',
            description:
              '"' + node.name + '": border radius ' +
              r +
              'px doesn\'t match any radius token. Closest: ' +
              result.suggestion +
              ' (' +
              result.suggestedValue +
              'px).',
            nodeId: node.id,
            nodeName: node.name,
            fixable: true,
            fixType: 'set-radius',
            fixProperties: { cornerRadius: result.suggestedValue },
            currentValue: r + 'px',
            expectedValue: result.suggestion,
          });
          break; // one radius issue per node is enough
        }
      }
      return issues;
    },
  },

  {
    id: 'token-typography',
    category: 'design-system',
    check: function (node: SelectionDataV2, kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];
      if (node.type !== 'TEXT' || node.fontSize === undefined) return issues;

      var tokenLookup = getTokenLookup(kb);
      var result = tokenLookup.findClosestToken(node.fontSize, 'fontSize');

      if (!result.match && result.suggestion) {
        issues.push({
          id: 'token-typography-' + node.id,
          severity: 'warning',
          category: 'design-system',
          title: 'Non-standard font size',
          description:
            '"' + node.name + '": font size ' +
            node.fontSize +
            'px doesn\'t match any type scale token. Closest: ' +
            result.suggestion +
            ' (' +
            result.suggestedValue +
            'px).',
          nodeId: node.id,
          nodeName: node.name,
          fixable: true,
          fixType: 'set-font-size',
          fixProperties: { fontSize: result.suggestedValue },
          currentValue: node.fontSize + 'px',
          expectedValue: result.suggestion,
        });
      }
      return issues;
    },
  },

  {
    id: 'variant-validity',
    category: 'design-system',
    check: function (node: SelectionDataV2, kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];
      if (node.type !== 'INSTANCE') return issues;

      var comp = findComponent(node, kb);
      if (!comp || !comp.variants) return issues;

      var props = node.variantProperties || {};
      var propKeys = Object.keys(props);

      // Check existing variant values are valid
      for (var k = 0; k < propKeys.length; k++) {
        var propName = propKeys[k];
        var propValue = props[propName];
        var validValues = comp.variants[propName];
        if (validValues && validValues.indexOf(propValue) === -1) {
          issues.push({
            id: 'variant-' + propName + '-' + node.id,
            severity: 'info',
            category: 'design-system',
            title: 'Unknown variant value',
            description:
              comp.name +
              ' variant "' +
              propName +
              '" has value "' +
              propValue +
              '" which is not a known variant. Valid values: ' +
              validValues.join(', ') +
              '.',
            nodeId: node.id,
            nodeName: node.name,
            fixable: false,
            currentValue: propValue,
            expectedValue: validValues.join(', '),
          });
        }
      }

      // Check required variants from scan_rules are present
      var scanRules = comp.scan_rules;
      if (scanRules && scanRules.required_variants) {
        var required = scanRules.required_variants;
        for (var r = 0; r < required.length; r++) {
          var reqName = required[r];
          if (!props[reqName] && comp.variants[reqName]) {
            issues.push({
              id: 'variant-missing-' + reqName + '-' + node.id,
              severity: 'info',
              category: 'design-system',
              title: 'Missing variant dimension',
              description:
                comp.name +
                ' should have a "' +
                reqName +
                '" variant set. Available values: ' +
                comp.variants[reqName].join(', ') +
                '.',
              nodeId: node.id,
              nodeName: node.name,
              fixable: false,
            });
          }
        }
      }

      return issues;
    },
  },

  {
    id: 'component-size',
    category: 'design-system',
    check: function (node: SelectionDataV2, kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];
      if (node.type !== 'INSTANCE') return issues;

      var comp = findComponent(node, kb);
      if (!comp || !comp.scan_rules || !comp.scan_rules.size_constraints) return issues;

      var constraints = comp.scan_rules.size_constraints;

      // Check min_height
      if (constraints.min_height && node.height < constraints.min_height) {
        issues.push({
          id: 'component-min-height-' + node.id,
          severity: 'warning',
          category: 'design-system',
          title: comp.name + ' too short',
          description:
            comp.name +
            ' height is ' +
            Math.round(node.height) +
            'px but minimum is ' +
            constraints.min_height +
            'px.',
          nodeId: node.id,
          nodeName: node.name,
          fixable: true,
          fixType: 'resize-touch-target',
          fixProperties: {
            width: node.width,
            height: Math.max(node.height, constraints.min_height),
          },
          currentValue: Math.round(node.height) + 'px',
          expectedValue: '\u2265 ' + constraints.min_height + 'px',
        });
      }

      // Check min_width
      if (constraints.min_width && node.width < constraints.min_width) {
        issues.push({
          id: 'component-min-width-' + node.id,
          severity: 'warning',
          category: 'design-system',
          title: comp.name + ' too narrow',
          description:
            comp.name +
            ' width is ' +
            Math.round(node.width) +
            'px but minimum is ' +
            constraints.min_width +
            'px.',
          nodeId: node.id,
          nodeName: node.name,
          fixable: true,
          fixType: 'resize-touch-target',
          fixProperties: {
            width: Math.max(node.width, constraints.min_width),
            height: node.height,
          },
          currentValue: Math.round(node.width) + 'px',
          expectedValue: '\u2265 ' + constraints.min_width + 'px',
        });
      }

      // Check size_map — match current variant size to expected height
      if (constraints.size_map && node.variantProperties) {
        var sizeVariant = node.variantProperties['size'] || node.variantProperties['Size'];
        if (sizeVariant) {
          var expected = constraints.size_map[sizeVariant];
          if (expected && expected.height && Math.abs(node.height - expected.height) > 1) {
            issues.push({
              id: 'component-size-mismatch-' + node.id,
              severity: 'warning',
              category: 'design-system',
              title: comp.name + ' height mismatch for size "' + sizeVariant + '"',
              description:
                comp.name +
                ' (' +
                sizeVariant +
                ') should be ' +
                expected.height +
                'px tall but is ' +
                Math.round(node.height) +
                'px.',
              nodeId: node.id,
              nodeName: node.name,
              fixable: true,
              fixType: 'resize-touch-target',
              fixProperties: {
                width: node.width,
                height: expected.height,
              },
              currentValue: Math.round(node.height) + 'px',
              expectedValue: expected.height + 'px',
            });
          }
        }
      }

      return issues;
    },
  },

  {
    id: 'component-usage',
    category: 'design-system',
    check: function (node: SelectionDataV2, kb: KnowledgeBase): ScanIssue[] {
      var issues: ScanIssue[] = [];
      if (node.type !== 'INSTANCE') return issues;

      var comp = findComponent(node, kb);
      if (!comp) return issues;

      // Surface usage anti-patterns as informational issues
      if (comp.usage && comp.usage.dont) {
        var donts = comp.usage.dont;
        for (var d = 0; d < donts.length; d++) {
          issues.push({
            id: 'usage-dont-' + d + '-' + node.id,
            severity: 'info',
            category: 'design-system',
            title: comp.name + ' usage reminder',
            description: donts[d],
            nodeId: node.id,
            nodeName: node.name,
            fixable: false,
          });
        }
      }

      // Check forbidden overrides from scan_rules
      var scanRules = comp.scan_rules;
      if (scanRules && scanRules.forbidden_overrides) {
        var overrides = scanRules.forbidden_overrides;
        for (var o = 0; o < overrides.length; o++) {
          var prop = overrides[o];
          // Check if the instance has overridden a forbidden property
          if (prop === 'fill' && node.fillStyleId === undefined && node.fills && node.fills.length > 0) {
            // If node has fills but no style reference, it may be a detached override
            if (!node.fillStyleName) {
              issues.push({
                id: 'forbidden-override-' + prop + '-' + node.id,
                severity: 'warning',
                category: 'design-system',
                title: comp.name + ' has overridden ' + prop,
                description:
                  comp.name +
                  ' instances should not override "' +
                  prop +
                  '". Use the component\'s built-in variants instead.',
                nodeId: node.id,
                nodeName: node.name,
                fixable: false,
              });
            }
          }
        }
      }

      return issues;
    },
  },
];
