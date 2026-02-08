import type { SelectionData } from '../../types/figma';
import './SelectionIndicator.css';

interface SelectionIndicatorProps {
  selection: SelectionData | null;
  onClear?: () => void;
}

export function SelectionIndicator({ selection, onClear }: SelectionIndicatorProps) {
  if (!selection) return null;

  const label = selection.componentName
    ? selection.type + ' \u00b7 ' + selection.componentName
    : selection.type + ' \u00b7 ' + selection.name;

  return (
    <div class="selection-indicator">
      <div class="selection-indicator-top">
        <span class="selection-overline">SELECTED</span>
        <span class="selection-dot">{'\u00b7'}</span>
        <span class="selection-value" title={label}>{label}</span>
        <button
          class="selection-clear"
          aria-label="Clear selection"
          onClick={onClear}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
