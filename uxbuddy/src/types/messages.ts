import type { SelectionData } from './figma';

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

export type MainToUIMessage =
  | SelectionChangedMessage
  | PluginReadyMessage
  | ApiKeyResponseMessage
  | ApiKeySavedMessage
  | ApiKeyClearedMessage;

export type UIToMainMessage =
  | RequestSelectionMessage
  | GetApiKeyMessage
  | SaveApiKeyMessage
  | ClearApiKeyMessage;

export function postToUI(msg: MainToUIMessage): void {
  figma.ui.postMessage(msg);
}

export function postToMain(msg: UIToMainMessage): void {
  parent.postMessage({ pluginMessage: msg }, '*');
}
