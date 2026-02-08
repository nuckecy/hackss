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

interface PlacementResultMessage {
  type: 'placement-result';
  success: boolean;
  message: string;
  componentName?: string;
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

interface ProviderSettingsResponseMessage {
  type: 'provider-settings-response';
  selectedProvider: string;
  keys: {
    gemini: string | null;
    claude: string | null;
    gpt: string | null;
  };
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

interface PlaceComponentMessage {
  type: 'place-component';
  componentKey: string;
  componentName: string;
  variant: string | null;
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

interface RequestDeepSelectionMessage {
  type: 'request-deep-selection';
}

interface ApplyFixMessage {
  type: 'apply-fix';
  nodeId: string;
  fixType: string;
  properties: Record<string, unknown>;
}

export type MainToUIMessage =
  | SelectionChangedMessage
  | PluginReadyMessage
  | ApiKeyResponseMessage
  | ApiKeySavedMessage
  | ApiKeyClearedMessage
  | PlacementResultMessage
  | ProviderSettingsResponseMessage
  | ProviderKeySavedMessage
  | ProviderKeyClearedMessage
  | DeepSelectionDataMessage
  | FixAppliedMessage;

export type UIToMainMessage =
  | RequestSelectionMessage
  | GetApiKeyMessage
  | SaveApiKeyMessage
  | ClearApiKeyMessage
  | PlaceComponentMessage
  | GetProviderSettingsMessage
  | SaveProviderKeyMessage
  | ClearProviderKeyMessage
  | SetSelectedProviderMessage
  | RequestDeepSelectionMessage
  | ApplyFixMessage;

export function postToUI(msg: MainToUIMessage): void {
  figma.ui.postMessage(msg);
}

export function postToMain(msg: UIToMainMessage): void {
  parent.postMessage({ pluginMessage: msg }, '*');
}
