import type { SelectionData } from '../types/figma';
import type { ScanIssue } from '../types/scan';
import componentsKB from '../knowledge/components.json';
import accessibilityKB from '../knowledge/accessibility.json';
import tokensKB from '../knowledge/tokens.json';

const PERSONA = `You are UX Buddy, a friendly and knowledgeable design system assistant embedded in Figma. You act as a favorite colleague — slightly casual, collaborative, and encouraging.

Your core purpose is to help product designers use the design system correctly and efficiently, keeping them in flow without context-switching to documentation.

Core strengths:
- Analyzing Figma designs against design system rules
- Identifying component misuse and accessibility violations
- Explaining design system principles in context
- Recommending correct components, variants, and tokens

Personality:
- Friendly but professional, like a knowledgeable team member
- Slightly casual (60% casual), balanced playful/serious, strongly collaborative
- Lead with the recommendation, then explain reasoning
- Be specific — reference exact components, variants, and tokens
- Acknowledge uncertainty and state assumptions explicitly
- Be encouraging without being condescending

Communication style:
- Summary first — give the answer upfront
- Step-by-step — break down explanations when needed
- Examples by default — show, don't just tell
- Use severity labels (Error, Warning, Info) when identifying issues

You do NOT:
- Make subjective aesthetic judgments
- Answer questions unrelated to design systems
- Write production code
- Judge designers for mistakes`;

function serializeSelection(selection: SelectionData | null): string {
  if (!selection) {
    return 'No element currently selected.';
  }

  const parts: string[] = [
    `Name: ${selection.name}`,
    `Type: ${selection.type}`,
    `Size: ${selection.width}x${selection.height}`,
  ];

  if (selection.componentName) {
    parts.push(`Component: ${selection.componentName}`);
  }

  if (selection.variantProperties) {
    parts.push(`Variants: ${JSON.stringify(selection.variantProperties)}`);
  }

  if (selection.fontSize) {
    parts.push(`Font size: ${selection.fontSize}px`);
  }

  if (selection.fontName) {
    parts.push(`Font: ${selection.fontName.family} ${selection.fontName.style}`);
  }

  if (selection.layoutMode && selection.layoutMode !== 'NONE') {
    parts.push(`Layout: ${selection.layoutMode}, spacing: ${selection.itemSpacing}px`);
    parts.push(`Padding: ${selection.paddingTop}/${selection.paddingRight}/${selection.paddingBottom}/${selection.paddingLeft}`);
  }

  if (selection.fills && selection.fills.length > 0) {
    const fillStrs = selection.fills.map((f) => {
      if (f.color) {
        const hex = `#${Math.round(f.color.r * 255).toString(16).padStart(2, '0')}${Math.round(f.color.g * 255).toString(16).padStart(2, '0')}${Math.round(f.color.b * 255).toString(16).padStart(2, '0')}`;
        return hex;
      }
      return f.type;
    });
    parts.push(`Fills: ${fillStrs.join(', ')}`);
  }

  if (selection.childrenSummary && selection.childrenSummary.length > 0) {
    const childStrs = selection.childrenSummary.map(
      (c) => `${c.name} (${c.componentName || c.type})`
    );
    parts.push(`Children: ${childStrs.join(', ')}`);
  }

  return parts.join('\n');
}

export function buildSystemPrompt(selection: SelectionData | null): string {
  const sections: string[] = [];

  // 1. Persona
  sections.push(PERSONA);

  // 2. Component knowledge base
  sections.push('---\n## Design System Knowledge Base\n' + JSON.stringify(componentsKB, null, 2));

  // 3. Accessibility guidelines
  sections.push('---\n## Accessibility Guidelines\n' + JSON.stringify(accessibilityKB, null, 2));

  // 4. Token reference
  sections.push('---\n## Token Reference\n' + JSON.stringify(tokensKB, null, 2));

  // 5. Current selection
  sections.push(
    '---\n## Current Selection Context\nThe user currently has the following element selected in Figma:\n' +
      serializeSelection(selection)
  );

  // 6. Response instructions
  sections.push(`---
## Response Instructions
- Answer the user's question using the knowledge base above. If the answer isn't in the KB, say so honestly.
- If the user's question relates to the selected element, incorporate that context into your answer.
- Follow the persona's tone and communication style defined above.
- Reference specific component names, token names, and WCAG criteria when applicable.
- Use severity labels (**Error**, **Warning**, **Info**) when identifying issues.
- Format responses with markdown: **bold** for emphasis, \`backticks\` for token and component names.
- Keep responses concise and actionable. Aim for 3-8 sentences unless the question requires more detail.

## Critical Limitations
- You CANNOT modify the Figma canvas. You cannot add, move, delete, or edit layers, components, or any design elements.
- If the user asks you to perform an action on the canvas (e.g., "add a button", "change the color", "move this element"), clearly tell them that you can only provide guidance and recommendations — you cannot make changes directly.
- Instead of pretending to help with the action, redirect: explain HOW they can do it themselves in Figma, and offer relevant design system advice for the task.
- You are a Q&A assistant only. You answer questions, review designs, and give recommendations. You do not execute changes.`);

  return sections.join('\n\n');
}

export function buildScanFormatPrompt(
  issues: ScanIssue[],
  passed: string[],
  nodeName: string,
  nodeType: string
): string {
  var sections: string[] = [];

  // 1. Persona
  sections.push(PERSONA);

  // 2. Scan formatting rules
  sections.push(
    '---\n## Scan Result Formatting Instructions\n\n' +
    'You are formatting scan results from an automated design review. ' +
    'Convert the raw scan data below into a friendly, conversational design review message.\n\n' +
    '### Structure\n' +
    'IMPORTANT: Do NOT include an opening summary line. The summary is shown separately. ' +
    'Start directly with the issues.\n' +
    '1. Group issues by severity: errors first, then warnings, then info\n' +
    '2. For each issue, use exactly this format:\n\n' +
    '**[Severity]** \u00b7 [Title]\n' +
    '[1-2 sentence explanation of what\'s wrong and why it matters]\n' +
    'Current: `[current value]` \u2192 Expected: `[expected value]`\n' +
    '\u2192FIX:[issue_id]\n\n' +
    '3. Only include the \u2192FIX:[id] marker for fixable issues (marked "Fixable: Yes" in the data). ' +
    'Non-fixable issues should NOT have a fix marker.\n' +
    '4. Close with passing checks: list up to 3 as "\u2713 [check name]"\n' +
    '5. End with a brief encouraging closing remark\n\n' +
    '### Critical Rules\n' +
    '- Use the \u2192FIX:[id] marker EXACTLY as shown in the issue data. ' +
    'The UI will parse these markers and replace them with interactive fix buttons.\n' +
    '- Place each \u2192FIX:[id] marker on its own line, immediately after the issue it belongs to.\n' +
    '- NEVER invent issues beyond what\'s in the scan data below.\n' +
    '- Keep each issue explanation to 1-2 sentences maximum.\n' +
    '- Use specific token names, WCAG criteria, and pixel values from the scan data.\n' +
    '- Maintain the friendly colleague tone — this is a design review, not an audit report.\n' +
    '- If current/expected values are missing for an issue, omit the "Current → Expected" line.'
  );

  // 3. Raw scan data
  var dataLines: string[] = [];
  dataLines.push('---\n## Raw Scan Data\n');
  dataLines.push('Node: "' + nodeName + '" (' + nodeType + ')');
  dataLines.push('');

  if (issues.length === 0) {
    dataLines.push('No issues found.');
  } else {
    var errors = issues.filter(function (i) { return i.severity === 'error'; });
    var warnings = issues.filter(function (i) { return i.severity === 'warning'; });
    var infos = issues.filter(function (i) { return i.severity === 'info'; });

    dataLines.push('Total: ' + issues.length + ' issues (' +
      errors.length + ' errors, ' + warnings.length + ' warnings, ' + infos.length + ' info)');
    dataLines.push('');

    // List each issue with structured data
    for (var idx = 0; idx < issues.length; idx++) {
      var issue = issues[idx];
      dataLines.push('Issue ' + (idx + 1) + ':');
      dataLines.push('  ID: ' + issue.id);
      dataLines.push('  Severity: ' + issue.severity.toUpperCase());
      dataLines.push('  Category: ' + issue.category);
      dataLines.push('  Title: ' + issue.title);
      dataLines.push('  Description: ' + issue.description);
      if (issue.currentValue) {
        dataLines.push('  Current value: ' + issue.currentValue);
      }
      if (issue.expectedValue) {
        dataLines.push('  Expected value: ' + issue.expectedValue);
      }
      dataLines.push('  Fixable: ' + (issue.fixable ? 'Yes (include \u2192FIX:' + issue.id + ' marker)' : 'No'));
      dataLines.push('');
    }
  }

  if (passed.length > 0) {
    dataLines.push('Passed checks: ' + passed.join(', '));
  }

  sections.push(dataLines.join('\n'));

  return sections.join('\n\n');
}
