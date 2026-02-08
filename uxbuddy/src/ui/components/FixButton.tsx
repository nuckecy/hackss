import { useRef } from 'preact/hooks';
import './FixButton.css';
import type { ScanIssue } from '../../types/scan';

interface FixButtonProps {
  issue: ScanIssue;
  onFix: () => void;
  status: 'idle' | 'applying' | 'applied' | 'failed';
  errorMessage?: string;
}

export function FixButton({ issue, onFix, status, errorMessage }: FixButtonProps) {
  var lastClickRef = useRef(0);

  function handleClick(): void {
    var now = Date.now();
    // Debounce: ignore clicks within 500ms of the last one
    if (now - lastClickRef.current < 500) return;
    lastClickRef.current = now;
    onFix();
  }

  if (status === 'applied') {
    return (
      <button class="fix-button fix-button--applied" disabled>
        <span class="fix-button-icon">{'\u2713'}</span> Fixed
      </button>
    );
  }

  if (status === 'applying') {
    return (
      <button class="fix-button fix-button--applying" disabled>
        <span class="fix-button-spinner" /> Applying...
      </button>
    );
  }

  if (status === 'failed') {
    return (
      <span class="fix-button-group">
        <button class="fix-button fix-button--failed" onClick={handleClick}>
          <span class="fix-button-icon">{'\u2717'}</span> Retry
        </button>
        {errorMessage && <span class="fix-button-error">{errorMessage}</span>}
      </span>
    );
  }

  return (
    <button class="fix-button fix-button--idle" onClick={handleClick}>
      <span class="fix-button-icon">{'\u2192'}</span> Fix this
    </button>
  );
}
