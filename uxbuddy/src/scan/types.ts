import type { SelectionDataV2 } from '../types/figma';
import type { ScanIssue } from '../types/scan';
import type { ComponentEntry, AccessibilityRule, TokenEntry } from '../types/knowledge';

export interface KnowledgeBase {
  components: ComponentEntry[];
  accessibility: AccessibilityRule[];
  tokens: TokenEntry[];
}

export interface ScanRule {
  id: string;
  category: 'design-system' | 'accessibility' | 'structural';
  check: (node: SelectionDataV2, kb: KnowledgeBase) => ScanIssue[];
}
