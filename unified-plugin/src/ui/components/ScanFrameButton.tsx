import { useState } from 'preact/hooks';
import { postToMain } from '../../types/messages';
import './ScanFrameButton.css';

interface ScanFrameButtonProps {
  onAnalysisStart?: () => void;
}

export function ScanFrameButton({ onAnalysisStart }: ScanFrameButtonProps) {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    if (onAnalysisStart) onAnalysisStart();
    postToMain({ type: 'analyze-frame' });

    // Reset scanning state after 30 seconds (timeout)
    setTimeout(() => {
      setIsScanning(false);
    }, 30000);
  };

  return (
    <button
      className="scan-frame-button"
      onClick={handleScan}
      disabled={isScanning}
      title="Scan selected frame for design system compliance"
    >
      {isScanning ? (
        <>
          <span className="scan-spinner" />
          Scanning...
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path
              d="M8 2V6L11 4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Scan Frame
        </>
      )}
    </button>
  );
}
