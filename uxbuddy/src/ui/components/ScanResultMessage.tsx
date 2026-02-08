import type { ScanResult, ScanIssue } from '../../types/scan';
import { renderMarkdown } from './MessageBubble';
import { FixButton } from './FixButton';
import { parseScanResponse } from '../utils/parse-scan-response';
import './ScanResultMessage.css';

interface ScanResultMessageProps {
  scanResult: ScanResult;
  formattedContent: string;
  timestamp: Date;
  fixStatuses: Record<string, 'idle' | 'applying' | 'applied' | 'failed'>;
  fixErrors: Record<string, string>;
  onFix: (issue: ScanIssue) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function ScanResultMessage({
  scanResult,
  formattedContent,
  timestamp,
  fixStatuses,
  fixErrors,
  onFix,
}: ScanResultMessageProps) {
  // Build a lookup map from issue ID to issue
  var issueMap: Record<string, ScanIssue> = {};
  for (var i = 0; i < scanResult.issues.length; i++) {
    issueMap[scanResult.issues[i].id] = scanResult.issues[i];
  }

  var parsed = parseScanResponse(formattedContent, scanResult.issues);

  return (
    <div class="message message-assistant">
      <div class="message-content">
        {parsed.segments.map(function (seg, idx) {
          if (seg.type === 'fix-button' && seg.issueId) {
            var issue = issueMap[seg.issueId];
            if (!issue) return null;
            return (
              <div class="scan-inline-fix" key={'fix-' + idx}>
                <FixButton
                  issue={issue}
                  status={fixStatuses[issue.id] || 'idle'}
                  errorMessage={fixErrors[issue.id]}
                  onFix={function () { onFix(issue); }}
                />
              </div>
            );
          }
          // text segment
          return (
            <div key={'text-' + idx}>
              {renderMarkdown(seg.content || '')}
            </div>
          );
        })}
      </div>
      <div class="message-timestamp">{formatTime(timestamp)}</div>
    </div>
  );
}
