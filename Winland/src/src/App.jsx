import React, { useState } from 'react';
import DynamicIsland from './components/DynamicIsland/DynamicIsland';

export default function App() {
  const [activeState, setActiveState] = useState('idle');
  const [notification, setNotification] = useState(null);

  const handleStageClick = (e) => {
    if (activeState.startsWith('expanded-')) {
      setActiveState('idle');
    }
  };

  const handleMouseLeave = () => {
    if (activeState.startsWith('expanded-')) {
      setActiveState('idle');
    }
  };

  return (
    <div
      className="island-overlay-stage"
      onClick={handleStageClick}
      onMouseLeave={handleMouseLeave}
    >
      <DynamicIsland
        activeState={activeState}
        setActiveState={setActiveState}
        notification={notification}
        onClearNotification={() => {
          setNotification(null);
          setActiveState('idle');
        }}
      />
    </div>
  );
}
