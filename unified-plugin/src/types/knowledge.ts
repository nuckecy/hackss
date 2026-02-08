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
}

export interface TokenEntry {
  name: string;
  value: string;
  category: string;
  description: string;
  usage_context: string;
}

export interface DesignPattern {
  id: string;
  title: string;
  category: string;
  rule: string;
  decision_framework: {
    steps?: string[];
    tree?: Record<string, string>;
    context_to_token?: Record<string, string>;
  };
  reasoning: string[];
  common_violations: string[];
  guidance_approach: string;
  see_also?: string[];
  flow_context?: Record<string, string>;
  flow_types?: Record<string, string>;
  evaluation_framework?: { steps: string[] };
  how_to_detect?: string[];
  key_heuristic?: string;
  key_distinction?: Record<string, string>;
  common_misconceptions?: string[];
  common_flow_issues?: string[];
}
