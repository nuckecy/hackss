import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { ComponentAction } from '../../types';

interface PlacementButtonProps {
  action: ComponentAction;
}

export function PlacementButton({ action }: PlacementButtonProps) {
  const [isPlacing, setIsPlacing] = useState(false);

  // Listen for placement results
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (msg.type === 'placement-result') {
        setIsPlacing(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleClick = () => {
    setIsPlacing(true);
    parent.postMessage(
      {
        pluginMessage: {
          type: 'place-component',
          componentKey: action.componentKey,
          componentName: action.componentName,
          variant: action.variant,
        },
      },
      '*'
    );
  };

  return (
    <button
      className="placement-button"
      onClick={handleClick}
      disabled={isPlacing}
      aria-label={isPlacing ? `Placing ${action.componentName} component` : `Add ${action.componentName} to canvas`}
      aria-busy={isPlacing}
    >
      {isPlacing ? (
        <>
          <span className="spinner" aria-hidden="true" /> Placing...
        </>
      ) : (
        <>
          <span className="material-symbols-outlined placement-button-icon" aria-hidden="true">add_box</span>
          Add to canvas
        </>
      )}
    </button>
  );
}
