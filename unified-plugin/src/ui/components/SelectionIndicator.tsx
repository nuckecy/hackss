import type { SelectionData } from '../../types/figma';
import './SelectionIndicator.css';

interface SelectionIndicatorProps {
  selection: SelectionData | null;
}

export function SelectionIndicator({ selection }: SelectionIndicatorProps) {
  if (!selection) return null;

  const label = selection.componentName
    ? `${selection.componentName} · ${selection.type}`
    : `${selection.name} · ${selection.type}`;

  return (
    <div class="selection-indicator">
      <span class="selection-overline">SELECTED</span>
      <span class="selection-dot">{'·'}</span>
      <span class="selection-value" title={label}>{label}</span>
    </div>
  );
}
