import type { SelectionData } from './figma';

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

export type MainToUIMessage =
  | SelectionChangedMessage
  | PluginReadyMessage
  | ApiKeyResponseMessage
  | ApiKeySavedMessage
  | ApiKeyClearedMessage
  | PlacementResultMessage;

export type UIToMainMessage =
  | RequestSelectionMessage
  | GetApiKeyMessage
  | SaveApiKeyMessage
  | ClearApiKeyMessage
  | PlaceComponentMessage;

export function postToUI(msg: MainToUIMessage): void {
  figma.ui.postMessage(msg);
}

export function postToMain(msg: UIToMainMessage): void {
  parent.postMessage({ pluginMessage: msg }, '*');
}
