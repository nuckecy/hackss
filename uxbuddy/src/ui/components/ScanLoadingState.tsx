import { LoadingDots } from './LoadingDots';
import './ScanLoadingState.css';

interface ScanLoadingStateProps {
  nodeName: string;
}

export function ScanLoadingState({ nodeName }: ScanLoadingStateProps) {
  return (
    <div class="message message-assistant">
      <div class="scan-loading">
        <div class="scan-loading-title">
          {'Scanning "' + nodeName + '"...'}
        </div>
        <div class="scan-loading-subtitle">
          Checking design tokens · spacing · accessibility
        </div>
        <LoadingDots />
      </div>
    </div>
  );
}
