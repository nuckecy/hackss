import type { SelectionData, SelectionDataV2 } from './figma';

// Component action types
export interface ComponentAction {
  type: 'place_component';
  componentKey: string;
  componentName: string;
  variant: string | null;
}

// Main → UI messages
interface SelectionChangedMessage {
  type: 'selection-changed';
  data: SelectionData | null;
}

interface PluginReadyMessage {
  type: 'plugin-ready';
}

interface ApiKeyResponseMessage {
  type: 'api-key-response';
  key: string | null;
}

interface ApiKeySavedMessage {
  type: 'api-key-saved';
}

interface ApiKeyClearedMessage {
  type: 'api-key-cleared';
}

interface DeepSelectionDataMessage {
  type: 'deep-selection-data';
  data: SelectionDataV2 | null;
}

interface FixAppliedMessage {
  type: 'fix-applied';
  nodeId: string;
  fixType: string;
  success: boolean;
  error?: string;
}

interface CurrentUserMessage {
  type: 'current-user';
  name: string | null;
}

interface ProviderSettingsResponseMessage {
  type: 'provider-settings-response';
  selectedProvider: string;
  keys: Record<string, string | null>;
}

interface ProviderKeySavedMessage {
  type: 'provider-key-saved';
  provider: string;
}

interface ProviderKeyClearedMessage {
  type: 'provider-key-cleared';
  provider: string;
}

interface PlacementResultMessage {
  type: 'placement-result';
  success: boolean;
  message: string;
  componentName?: string;
}

interface LocaleResponseMessage {
  type: 'locale-response';
  locale: string;
}

interface AccessibilitySettingsResponseMessage {
  type: 'accessibility-settings-response';
  fontSize: string;
}

interface AnalysisDataMessage {
  type: 'analysis-data';
  data: any;
  frameName: string;
}

interface AnalysisErrorMessage {
  type: 'analysis-error';
  message: string;
}

// UI → Main messages
interface RequestSelectionMessage {
  type: 'request-selection';
}

interface GetApiKeyMessage {
  type: 'get-api-key';
}

interface SaveApiKeyMessage {
  type: 'save-api-key';
  key: string;
}

interface ClearApiKeyMessage {
  type: 'clear-api-key';
}

interface RequestDeepSelectionMessage {
  type: 'request-deep-selection';
}

interface ApplyFixMessage {
  type: 'apply-fix';
  nodeId: string;
  fixType: string;
  properties: Record<string, unknown>;
}

interface RequestCurrentUserMessage {
  type: 'request-current-user';
}

interface OpenDrawerMessage {
  type: 'open-drawer';
}

interface CloseDrawerMessage {
  type: 'close-drawer';
}

interface GetProviderSettingsMessage {
  type: 'get-provider-settings';
}

interface SaveProviderKeyMessage {
  type: 'save-provider-key';
  provider: string;
  key: string;
}

interface ClearProviderKeyMessage {
  type: 'clear-provider-key';
  provider: string;
}

interface SetSelectedProviderMessage {
  type: 'set-selected-provider';
  provider: string;
}

interface ClearSelectionMessage {
  type: 'clear-selection';
}

interface PlaceComponentMessage {
  type: 'place-component';
  componentKey: string;
  componentName: string;
  variant: string | null;
}

interface GetLocaleMessage {
  type: 'get-locale';
}

interface SaveLocaleMessage {
  type: 'save-locale';
  locale: string;
}

interface GetAccessibilitySettingsMessage {
  type: 'get-accessibility-settings';
}

interface SaveAccessibilitySettingsMessage {
  type: 'save-accessibility-settings';
  fontSize: string;
}

interface AnalyzeFrameMessage {
  type: 'analyze-frame';
}

export type MainToUIMessage =
  | SelectionChangedMessage
  | PluginReadyMessage
  | ApiKeyResponseMessage
  | ApiKeySavedMessage
  | ApiKeyClearedMessage
  | DeepSelectionDataMessage
  | FixAppliedMessage
  | CurrentUserMessage
  | ProviderSettingsResponseMessage
  | ProviderKeySavedMessage
  | ProviderKeyClearedMessage
  | PlacementResultMessage
  | LocaleResponseMessage
  | AccessibilitySettingsResponseMessage
  | AnalysisDataMessage
  | AnalysisErrorMessage;

export type UIToMainMessage =
  | RequestSelectionMessage
  | GetApiKeyMessage
  | SaveApiKeyMessage
  | ClearApiKeyMessage
  | RequestDeepSelectionMessage
  | ApplyFixMessage
  | RequestCurrentUserMessage
  | OpenDrawerMessage
  | CloseDrawerMessage
  | GetProviderSettingsMessage
  | SaveProviderKeyMessage
  | ClearProviderKeyMessage
  | SetSelectedProviderMessage
  | ClearSelectionMessage
  | PlaceComponentMessage
  | GetLocaleMessage
  | SaveLocaleMessage
  | GetAccessibilitySettingsMessage
  | SaveAccessibilitySettingsMessage
  | AnalyzeFrameMessage;

export function postToUI(msg: MainToUIMessage): void {
  figma.ui.postMessage(msg);
}

export function postToMain(msg: UIToMainMessage): void {
  parent.postMessage({ pluginMessage: msg }, '*');
}
