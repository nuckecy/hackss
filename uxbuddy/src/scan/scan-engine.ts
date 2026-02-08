import type { SelectionDataV2 } from '../types/figma';
import type { ScanResult, ScanIssue } from '../types/scan';
import type { KnowledgeBase } from './types';
import { TokenLookup } from './checks/token-matcher';
import { getRulesForNodeType } from './rules/index';

var SEVERITY_ORDER: Record<string, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

export class ScanEngine {
  private kb: KnowledgeBase;
  private tokenLookup: TokenLookup;

  constructor(knowledgeBase: KnowledgeBase) {
    this.kb = knowledgeBase;
    this.tokenLookup = new TokenLookup(knowledgeBase.tokens);
  }

  scan(node: SelectionDataV2): ScanResult {
    var rules = getRulesForNodeType(node.type);
    var issues: ScanIssue[] = [];
    var passed: string[] = [];

    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      try {
        var ruleIssues = rule.check(node, this.kb);
        if (ruleIssues.length === 0) {
          passed.push(rule.id);
        } else {
          for (var j = 0; j < ruleIssues.length; j++) {
            issues.push(ruleIssues[j]);
          }
        }
      } catch (_) {
        // Skip rules that error out — don't crash the scan
      }
    }

    // Sort by severity: error first, then warning, then info
    issues.sort(function (a, b) {
      var aOrder = SEVERITY_ORDER[a.severity] !== undefined ? SEVERITY_ORDER[a.severity] : 3;
      var bOrder = SEVERITY_ORDER[b.severity] !== undefined ? SEVERITY_ORDER[b.severity] : 3;
      return aOrder - bOrder;
    });

    return {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      timestamp: new Date(),
      issues: issues,
      passed: passed,
    };
  }

  scanRecursive(node: SelectionDataV2): ScanResult[] {
    var results: ScanResult[] = [];

    // Skip hidden nodes — they don't need scanning
    if (node.visible === false) return results;

    // Scan the node itself
    results.push(this.scan(node));

    // Scan children recursively
    var children = node.children;
    if (children) {
      for (var i = 0; i < children.length; i++) {
        var childResults = this.scanRecursive(children[i]);
        for (var j = 0; j < childResults.length; j++) {
          results.push(childResults[j]);
        }
      }
    }

    return results;
  }
}
