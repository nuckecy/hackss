export interface ComponentScanRules {
  required_tokens?: Record<string, string[]>;
  size_constraints?: {
    min_width?: number;
    min_height?: number;
    size_map?: Record<string, { height: number; padding_h?: number }>;
  };
  required_variants?: string[];
  forbidden_overrides?: string[];
}

export interface ComponentEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  variants: Record<string, string[]>;
  properties: Record<
    string,
    {
      type: string;
      required: boolean;
      default?: unknown;
      description?: string;
    }
  >;
  tokens: Record<string, string>;
  accessibility: {
    role?: string;
    min_touch_target?: string;
    contrast_ratio?: string;
    focus_indicator?: string;
    aria_label?: string;
    keyboard?: string;
  };
  usage: {
    do: string[];
    dont: string[];
  };
  related_components: string[];
  scan_rules?: ComponentScanRules;
}

export interface AccessibilityCheckConfig {
  check_type: string;
  thresholds?: Record<string, number>;
  applies_to_types?: string[];
  severity: string;
}

export interface AccessibilityRule {
  id: string;
  title: string;
  wcag_criterion: string;
  level: 'A' | 'AA' | 'AAA';
  description: string;
  requirement: string;
  how_to_check: string;
  common_violations: string[];
  applies_to: string[];
  check_config?: AccessibilityCheckConfig;
}

export interface TokenEntry {
  name: string;
  value: string;
  category: string;
  description: string;
  usage_context: string;
}
