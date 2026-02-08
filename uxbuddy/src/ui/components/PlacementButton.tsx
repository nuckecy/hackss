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
    >
      {isPlacing ? (
        <>
          <span className="spinner" /> Placing...
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1V13M1 7H13"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          Place in Figma
        </>
      )}
    </button>
  );
}
