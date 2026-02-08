import { h } from 'preact';
import type { ResponseComponentProps } from '../../../types/responses';
import { Badge } from './shared/Badge';
import { Accordion } from './shared/Accordion';

interface Issue {
  severity: 'error' | 'warning' | 'info';
  element?: string;
  message: string;
  fix?: string;
  reference?: string;
}

function parseIssues(body: string): { errors: Issue[]; warnings: Issue[]; info: Issue[] } {
  const lines = body.split('\n');
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const info: Issue[] = [];

  let currentSeverity: 'error' | 'warning' | 'info' | null = null;
  let currentIssue: Partial<Issue> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect severity sections
    if (trimmed.toLowerCase().includes('**error')) {
      currentSeverity = 'error';
      continue;
    } else if (trimmed.toLowerCase().includes('**warning')) {
      currentSeverity = 'warning';
      continue;
    } else if (trimmed.toLowerCase().includes('**info')) {
      currentSeverity = 'info';
      continue;
    }

    // Parse bullet point issues
    if (currentSeverity && trimmed.match(/^[-*•]\s/)) {
      // Save previous issue
      if (currentIssue && currentIssue.message) {
        const issue = { ...currentIssue, severity: currentSeverity } as Issue;
        if (currentSeverity === 'error') errors.push(issue);
        else if (currentSeverity === 'warning') warnings.push(issue);
        else info.push(issue);
      }

      // Start new issue
      const message = trimmed.replace(/^[-*•]\s/, '');

      // Try to extract element name from patterns like "Element 'Name': message"
      const elementMatch = message.match(/^(.+?)\s+['"](.+?)['"]:\s*(.+)/);
      if (elementMatch) {
        currentIssue = {
          element: `${elementMatch[1]} "${elementMatch[2]}"`,
          message: elementMatch[3]
        };
      } else {
        currentIssue = { message };
      }
    }

    // Parse fix instructions
    else if (currentIssue && trimmed.toLowerCase().startsWith('fix:')) {
      currentIssue.fix = trimmed.replace(/^fix:\s*/i, '');
    }

    // Parse reference
    else if (currentIssue && trimmed.toLowerCase().startsWith('reference:')) {
      currentIssue.reference = trimmed.replace(/^reference:\s*/i, '');
    }
  }

  // Save last issue
  if (currentIssue && currentIssue.message && currentSeverity) {
    const issue = { ...currentIssue, severity: currentSeverity } as Issue;
    if (currentSeverity === 'error') errors.push(issue);
    else if (currentSeverity === 'warning') warnings.push(issue);
    else info.push(issue);
  }

  return { errors, warnings, info };
}

function getSummary(body: string): string {
  const lines = body.split('\n');
  const paragraphs: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty, headings, and severity sections
    if (!trimmed ||
        trimmed.match(/^#{1,3}\s/) ||
        trimmed.toLowerCase().includes('**error') ||
        trimmed.toLowerCase().includes('**warning') ||
        trimmed.toLowerCase().includes('**info')) {
      continue;
    }

    // Stop at first issue list
    if (trimmed.match(/^[-*•]\s/)) {
      break;
    }

    paragraphs.push(trimmed);
  }

  return paragraphs.join(' ');
}

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <div class={`response-issue-card response-issue-${issue.severity}`}>
      {issue.element && (
        <div class="response-issue-element">{issue.element}</div>
      )}
      <div class="response-issue-message">{issue.message}</div>
      {issue.fix && (
        <div class="response-issue-fix">
          <strong>Fix:</strong> {issue.fix}
        </div>
      )}
      {issue.reference && (
        <div class="response-issue-reference">
          <code>{issue.reference}</code>
        </div>
      )}
    </div>
  );
}

export function DesignAnalysisResponse({ metadata, body }: ResponseComponentProps) {
  const {
    analysisType,
    frameName,
    patternName,
    overallStatus,
    errorCount = 0,
    warningCount = 0,
    infoCount = 0
  } = metadata;

  const { errors, warnings, info } = parseIssues(body);
  const summary = getSummary(body);

  // Use counts from metadata if available, otherwise use parsed counts
  const finalErrorCount = errorCount || errors.length;
  const finalWarningCount = warningCount || warnings.length;
  const finalInfoCount = infoCount || info.length;

  const totalIssues = finalErrorCount + finalWarningCount + finalInfoCount;
  const statusVariant = overallStatus === 'pass' ? 'success' :
                       overallStatus === 'error' ? 'error' : 'warning';

  return (
    <div class="response-design-analysis">
      {/* Header */}
      <div class="response-analysis-header">
        {(frameName || patternName) && (
          <h3 class="response-analysis-title">
            {analysisType === 'frame' ? '📐 Frame Analysis' : '🎨 Pattern Analysis'}
            {frameName && `: "${frameName}"`}
            {patternName && `: ${patternName}`}
          </h3>
        )}

        {overallStatus && (
          <Badge variant={statusVariant}>
            {overallStatus === 'pass' ? '✓ Pass' :
             overallStatus === 'error' ? '✗ Errors Found' : '⚠ Warnings'}
          </Badge>
        )}
      </div>

      {/* Summary */}
      {summary && <p class="response-analysis-summary">{summary}</p>}

      {/* Issue Counts */}
      {totalIssues > 0 && (
        <div class="response-issue-counts">
          {finalErrorCount > 0 && (
            <span class="response-issue-count response-issue-count-error">
              {finalErrorCount} {finalErrorCount === 1 ? 'Error' : 'Errors'}
            </span>
          )}
          {finalWarningCount > 0 && (
            <span class="response-issue-count response-issue-count-warning">
              {finalWarningCount} {finalWarningCount === 1 ? 'Warning' : 'Warnings'}
            </span>
          )}
          {finalInfoCount > 0 && (
            <span class="response-issue-count response-issue-count-info">
              {finalInfoCount} {finalInfoCount === 1 ? 'Info' : 'Info'}
            </span>
          )}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div class="response-issues-section">
          <Accordion
            summary={`Errors (${errors.length})`}
            defaultExpanded={true}
          >
            <div class="response-issues-list">
              {errors.map((issue, idx) => (
                <IssueCard key={idx} issue={issue} />
              ))}
            </div>
          </Accordion>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div class="response-issues-section">
          <Accordion
            summary={`Warnings (${warnings.length})`}
            defaultExpanded={errors.length === 0}
          >
            <div class="response-issues-list">
              {warnings.map((issue, idx) => (
                <IssueCard key={idx} issue={issue} />
              ))}
            </div>
          </Accordion>
        </div>
      )}

      {/* Info */}
      {info.length > 0 && (
        <div class="response-issues-section">
          <Accordion
            summary={`Info (${info.length})`}
            defaultExpanded={errors.length === 0 && warnings.length === 0}
          >
            <div class="response-issues-list">
              {info.map((issue, idx) => (
                <IssueCard key={idx} issue={issue} />
              ))}
            </div>
          </Accordion>
        </div>
      )}

      {/* No issues */}
      {totalIssues === 0 && (
        <div class="response-no-issues">
          <span class="response-no-issues-icon">✓</span>
          <p>No issues found! This design follows the design system guidelines.</p>
        </div>
      )}
    </div>
  );
}
