export interface ScanIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: 'design-system' | 'accessibility' | 'structural' | 'form-patterns';
  title: string;
  description: string;
  nodeId: string;
  nodeName: string;
  fixable: boolean;
  fixType?: string;
  fixProperties?: Record<string, unknown>;
  currentValue?: string;
  expectedValue?: string;
}

export interface ScanResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  timestamp: Date;
  issues: ScanIssue[];
  passed: string[];
}

export interface FixAction {
  type: string;
  nodeId: string;
  properties: Record<string, unknown>;
}

export interface FixResult {
  success: boolean;
  fixType: string;
  nodeId: string;
  error?: string;
}
