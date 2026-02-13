import { useState, useEffect, useRef } from 'preact/hooks';
import type { SelectionDataV2 } from '../../types/figma';
import type { ScanResult, ScanIssue } from '../../types/scan';
import type { KnowledgeBase } from '../../scan/types';
import { ScanEngine } from '../../scan/scan-engine';
import { createProvider } from '../../ai/provider';
import type { ProviderType } from '../../ai/provider';
import { buildScanFormatPrompt } from '../../ai/system-prompt';
import { getLocale } from '../../i18n/i18n';
import componentsKB from '../../knowledge/components.json';
import accessibilityKB from '../../knowledge/accessibility.json';
import tokensKB from '../../knowledge/tokens.json';

function postToMain(msg: Record<string, unknown>): void {
  parent.postMessage({ pluginMessage: msg }, '*');
}

const kb: KnowledgeBase = {
  components: componentsKB as KnowledgeBase['components'],
  accessibility: accessibilityKB as KnowledgeBase['accessibility'],
  tokens: tokensKB as KnowledgeBase['tokens'],
};

const scanEngine = new ScanEngine(kb);

interface UseScanReturn {
  isScanning: boolean;
  scanNodeName: string | null;
  lastScanResult: ScanResult | null;
  fixStatuses: Record<string, 'idle' | 'applying' | 'applied' | 'failed'>;
  fixErrors: Record<string, string>;
  triggerScan: () => void;
  handleFix: (issue: ScanIssue) => void;
}

export function useScan(
  apiKey: string,
  selectedProvider: ProviderType,
  addMessage: (role: 'user' | 'assistant', content: string, scanResult?: ScanResult) => void
): UseScanReturn {
  var isScanning = useRef(false);
  var waitingForData = useRef(false);
  var currentScanName = useRef<string | null>(null);
  var resolveData = useRef<((data: SelectionDataV2 | null) => void) | null>(null);

  var stateVersion = useState(0);
  var forceUpdate = function () { stateVersion[1](function (v) { return v + 1; }); };

  var lastScanResultRef = useRef<ScanResult | null>(null);
  var fixStatusesRef = useRef<Record<string, 'idle' | 'applying' | 'applied' | 'failed'>>({});
  var fixErrorsRef = useRef<Record<string, string>>({});

  useEffect(function () {
    function handleMessage(event: MessageEvent): void {
      var msg = event.data && event.data.pluginMessage;
      if (!msg) return;

      if (msg.type === 'deep-selection-data' && waitingForData.current && resolveData.current) {
        waitingForData.current = false;
        resolveData.current(msg.data || null);
        resolveData.current = null;
      }

      if (msg.type === 'fix-applied') {
        // Find matching issue by fixType
        var statuses = fixStatusesRef.current;
        var keys = Object.keys(statuses);
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          if (statuses[key] === 'applying') {
            // Check if this fix-applied corresponds to this issue
            if (lastScanResultRef.current) {
              var issues = lastScanResultRef.current.issues;
              for (var j = 0; j < issues.length; j++) {
                if (issues[j].id === key && issues[j].fixType === msg.fixType) {
                  fixStatusesRef.current[key] = msg.success ? 'applied' : 'failed';
                  if (!msg.success && msg.error) {
                    fixErrorsRef.current[key] = msg.error;
                  }
                  forceUpdate();
                  return;
                }
              }
            }
          }
        }
        // Fallback: update any 'applying' status for this fixType
        for (var k = 0; k < keys.length; k++) {
          if (statuses[keys[k]] === 'applying') {
            fixStatusesRef.current[keys[k]] = msg.success ? 'applied' : 'failed';
            if (!msg.success && msg.error) {
              fixErrorsRef.current[keys[k]] = msg.error;
            }
            forceUpdate();
            return;
          }
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return function () { window.removeEventListener('message', handleMessage); };
  }, []);

  function requestDeepSelection(): Promise<SelectionDataV2 | null> {
    return new Promise(function (resolve) {
      waitingForData.current = true;
      resolveData.current = resolve;
      postToMain({ type: 'request-deep-selection' });

      // Timeout after 3 seconds
      setTimeout(function () {
        if (waitingForData.current) {
          waitingForData.current = false;
          resolveData.current = null;
          resolve(null);
        }
      }, 3000);
    });
  }

  function triggerScan(): void {
    if (isScanning.current) return;

    isScanning.current = true;
    fixStatusesRef.current = {};
    fixErrorsRef.current = {};
    forceUpdate();

    requestDeepSelection().then(function (deepData) {
      if (!deepData) {
        isScanning.current = false;
        currentScanName.current = null;
        forceUpdate();
        addMessage('assistant', 'No element selected. Please select a layer in Figma and try again.');
        return;
      }

      currentScanName.current = deepData.name;
      forceUpdate();

      // Run scan engine locally (synchronous)
      var results = scanEngine.scanRecursive(deepData);

      // Merge all results into one combined result
      var combinedResult: ScanResult = {
        nodeId: deepData.id,
        nodeName: deepData.name,
        nodeType: deepData.type,
        timestamp: new Date(),
        issues: [],
        passed: [],
      };

      for (var i = 0; i < results.length; i++) {
        for (var j = 0; j < results[i].issues.length; j++) {
          combinedResult.issues.push(results[i].issues[j]);
        }
        for (var k = 0; k < results[i].passed.length; k++) {
          if (combinedResult.passed.indexOf(results[i].passed[k]) === -1) {
            combinedResult.passed.push(results[i].passed[k]);
          }
        }
      }

      lastScanResultRef.current = combinedResult;

      // Summary bubble first (separate from the detail)
      var summaryText = buildSummaryText(combinedResult);
      addMessage('assistant', summaryText);

      // If no issues, we're done — no detail bubble needed
      if (combinedResult.issues.length === 0) {
        isScanning.current = false;
        currentScanName.current = null;
        forceUpdate();
        return;
      }

      // Build scan format prompt with persona + formatting rules + raw data
      var scanPrompt = buildScanFormatPrompt(
        combinedResult.issues,
        combinedResult.passed,
        combinedResult.nodeName,
        combinedResult.nodeType,
        getLocale()
      );

      // Try AI formatting, fall back to structured summary
      var provider = createProvider(selectedProvider, apiKey);
      provider
        .chat(
          [{ role: 'user', content: 'Format these scan results into a conversational design review.' }],
          scanPrompt
        )
        .then(function (formatted) {
          addMessage('assistant', formatted, combinedResult);
        })
        .catch(function () {
          // Fallback: use the raw summary as the message
          addMessage('assistant', formatFallback(combinedResult), combinedResult);
        })
        .finally(function () {
          isScanning.current = false;
          currentScanName.current = null;
          forceUpdate();
        });
    });
  }

  function handleFix(issue: ScanIssue): void {
    if (!issue.fixable || !issue.fixType || !issue.fixProperties) return;

    fixStatusesRef.current[issue.id] = 'applying';
    forceUpdate();

    postToMain({
      type: 'apply-fix',
      nodeId: issue.nodeId,
      fixType: issue.fixType,
      properties: issue.fixProperties,
    });
  }

  return {
    isScanning: isScanning.current,
    scanNodeName: currentScanName.current,
    lastScanResult: lastScanResultRef.current,
    fixStatuses: fixStatusesRef.current,
    fixErrors: fixErrorsRef.current,
    triggerScan: triggerScan,
    handleFix: handleFix,
  };
}

function buildSummaryText(result: ScanResult): string {
  if (result.issues.length === 0) {
    var passedList = result.passed.slice(0, 3);
    var passLines: string[] = [];
    for (var p = 0; p < passedList.length; p++) {
      passLines.push('\u2713 ' + passedList[p]);
    }
    return 'Everything looks good on your **' + result.nodeName + '**! All ' +
      result.passed.length + ' checks passed.\n\n' +
      passLines.join('\n') + '\n\nNice work.';
  }

  var errors = 0;
  var warnings = 0;
  var infos = 0;
  for (var i = 0; i < result.issues.length; i++) {
    var sev = result.issues[i].severity;
    if (sev === 'error') errors++;
    else if (sev === 'warning') warnings++;
    else infos++;
  }

  var parts: string[] = [];
  if (errors > 0) parts.push(errors + (errors === 1 ? ' error' : ' errors'));
  if (warnings > 0) parts.push(warnings + (warnings === 1 ? ' warning' : ' warnings'));
  if (infos > 0) parts.push(infos + (infos === 1 ? ' note' : ' notes'));

  return 'I checked your **' + result.nodeName + '** and found ' + parts.join(', ') + '.';
}

function formatFallback(result: ScanResult): string {
  var lines: string[] = [];

  // Group by severity
  var groups = [
    { sev: 'error', label: 'Error' },
    { sev: 'warning', label: 'Warning' },
    { sev: 'info', label: 'Info' },
  ];

  for (var g = 0; g < groups.length; g++) {
    var filtered: ScanIssue[] = [];
    for (var f = 0; f < result.issues.length; f++) {
      if (result.issues[f].severity === groups[g].sev) {
        filtered.push(result.issues[f]);
      }
    }
    for (var i = 0; i < filtered.length; i++) {
      var issue = filtered[i];
      lines.push('**' + groups[g].label + '** \u00b7 ' + issue.title);
      lines.push(issue.description);
      if (issue.currentValue && issue.expectedValue) {
        lines.push('Current: `' + issue.currentValue + '` \u2192 Expected: `' + issue.expectedValue + '`');
      }
      if (issue.fixable) {
        lines.push('\u2192FIX:' + issue.id);
      }
      lines.push('');
    }
  }

  if (result.passed.length > 0) {
    var shown = result.passed.slice(0, 3);
    for (var s = 0; s < shown.length; s++) {
      lines.push('\u2713 ' + shown[s]);
    }
    lines.push('');
  }

  lines.push('A few tweaks and this will be solid!');

  return lines.join('\n');
}
