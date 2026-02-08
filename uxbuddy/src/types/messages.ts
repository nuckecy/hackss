import type { SelectionData, SelectionDataV2 } from './figma';

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
  | ProviderKeyClearedMessage;

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
  | ClearSelectionMessage;

export function postToUI(msg: MainToUIMessage): void {
  figma.ui.postMessage(msg);
}

export function postToMain(msg: UIToMainMessage): void {
  parent.postMessage({ pluginMessage: msg }, '*');
}
