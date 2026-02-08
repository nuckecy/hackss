import type { ScanIssue } from '../../types/scan';

export interface ScanSegment {
  type: 'text' | 'fix-button';
  content?: string;
  issueId?: string;
}

var FIX_MARKER_RE = /\u2192FIX:([^\s\n]+)/g;

export function parseScanResponse(
  content: string,
  issues: ScanIssue[]
): { segments: ScanSegment[] } {
  var segments: ScanSegment[] = [];
  var issueIds = new Set<string>();
  for (var i = 0; i < issues.length; i++) {
    if (issues[i].fixable) {
      issueIds.add(issues[i].id);
    }
  }

  var lastIndex = 0;
  var match: RegExpExecArray | null;

  // Reset regex state
  FIX_MARKER_RE.lastIndex = 0;

  while ((match = FIX_MARKER_RE.exec(content)) !== null) {
    var issueId = match[1];

    // Only create fix-button segment if this is a known fixable issue
    if (!issueIds.has(issueId)) {
      continue;
    }

    // Add preceding text segment
    if (match.index > lastIndex) {
      var text = content.slice(lastIndex, match.index).trim();
      if (text) {
        segments.push({ type: 'text', content: text });
      }
    }

    segments.push({ type: 'fix-button', issueId: issueId });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    var remaining = content.slice(lastIndex).trim();
    if (remaining) {
      segments.push({ type: 'text', content: remaining });
    }
  }

  // If no markers found at all, return the whole content as one text segment
  if (segments.length === 0 && content.trim()) {
    segments.push({ type: 'text', content: content.trim() });
  }

  return { segments: segments };
}
