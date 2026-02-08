/**
 * Response metadata types for specialized chat responses
 */

export type ResponseType =
  | 'component-lookup'
  | 'accessibility'
  | 'token'
  | 'comparison'
  | 'not-found'
  | 'design-analysis';

export interface ResponseMetadata {
  type?: ResponseType;
  // Component lookup metadata
  componentName?: string;
  status?: 'stable' | 'beta' | 'deprecated';
  // Accessibility metadata
  criterion?: string;
  level?: 'A' | 'AA' | 'AAA';
  // Token metadata
  tokenName?: string;
  category?: 'color' | 'spacing' | 'typography' | 'radius' | 'shadow';
  value?: string;
  // Comparison metadata
  options?: string[];
  // Not found metadata
  query?: string;
  suggestions?: string[];
  // Design analysis metadata
  analysisType?: 'frame' | 'pattern';
  frameName?: string;
  patternName?: string;
  overallStatus?: 'pass' | 'warning' | 'error';
  errorCount?: number;
  warningCount?: number;
  infoCount?: number;
}

export interface ParsedResponse {
  metadata: ResponseMetadata;
  body: string;
}

export interface ResponseComponentProps {
  metadata: ResponseMetadata;
  body: string;
  action?: any;
  quickActions?: Array<{ label: string; onClick: () => void; icon?: string }>;
}
