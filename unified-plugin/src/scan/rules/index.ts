import type { ScanRule } from '../types';
import { designSystemRules } from './design-system';
import { accessibilityRules } from './accessibility';
import { structuralRules } from './structural';
import { formPatternRules } from './form-patterns';

export var allRules: ScanRule[] = ([] as ScanRule[]).concat(
  designSystemRules,
  accessibilityRules,
  structuralRules,
  formPatternRules
);

// Rules that only apply to specific node types
var TEXT_ONLY_RULES = ['contrast-ratio', 'text-size', 'token-typography'];
var CONTAINER_RULES = ['auto-layout', 'token-spacing', 'form-field-spacing', 'form-padding', 'form-label-presence', 'form-button-hierarchy', 'form-input-min-height'];
var INSTANCE_RULES = ['variant-validity', 'component-usage', 'component-size'];

export function getRulesForNodeType(type: string): ScanRule[] {
  var result: ScanRule[] = [];

  for (var i = 0; i < allRules.length; i++) {
    var rule = allRules[i];

    // Text-only rules only apply to TEXT nodes (contrast-ratio also applies to containers)
    if (rule.id === 'text-size' || rule.id === 'token-typography') {
      if (type === 'TEXT') result.push(rule);
      continue;
    }

    // contrast-ratio applies to TEXT and container types
    if (rule.id === 'contrast-ratio') {
      result.push(rule); // always run — it checks children for containers
      continue;
    }

    // Container-specific rules
    if (CONTAINER_RULES.indexOf(rule.id) >= 0) {
      if (
        type === 'FRAME' ||
        type === 'COMPONENT' ||
        type === 'COMPONENT_SET' ||
        type === 'INSTANCE' ||
        type === 'GROUP' ||
        type === 'SECTION'
      ) {
        result.push(rule);
      }
      continue;
    }

    // Instance-only rules
    if (INSTANCE_RULES.indexOf(rule.id) >= 0) {
      if (type === 'INSTANCE') result.push(rule);
      continue;
    }

    // All other rules apply universally
    result.push(rule);
  }

  return result;
}
