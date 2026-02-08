export type { SelectionData, SelectionDataV2 } from './figma';
export type {
  MainToUIMessage,
  UIToMainMessage,
  ComponentAction,
} from './messages';
export { postToUI, postToMain } from './messages';
export type {
  ParsedResponse,
  ResponseMetadata,
} from './responses';
export type {
  ScanIssue,
  ScanResult,
  FixAction,
  FixResult,
} from './scan';
export type {
  ComponentEntry,
  AccessibilityRule,
  TokenEntry,
} from './knowledge';
