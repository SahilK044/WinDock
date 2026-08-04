import React, { useState, Component } from 'react';
import DynamicIsland from './components/DynamicIsland/DynamicIsland';
import SettingsWindow from './components/SettingsWindow/SettingsWindow';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('REACT ERROR BOUNDARY:', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
          background: '#1a0000', border: '2px solid #ff453a', borderRadius: 16,
          padding: '12px 20px', color: '#ff6b6b', fontFamily: 'monospace', fontSize: 11,
          maxWidth: 400, zIndex: 99999,
        }}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>WinLand Error</div>
          <div>{this.state.error?.message || 'Unknown error'}</div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 8, background: '#ff453a', border: 'none', borderRadius: 6, padding: '4px 12px', color: '#fff', cursor: 'pointer', fontSize: 11 }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const isSettingsRoute = window.location.search.includes('settings') ||
                          window.location.hash.includes('settings') ||
                          window.location.href.includes('settings');
  const [activeState, setActiveState] = useState('idle');
  const [notification, setNotification] = useState(null);

  if (isSettingsRoute) {
    return (
      <ErrorBoundary>
        <SettingsWindow />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="island-overlay-stage">
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
    </ErrorBoundary>
  );
}
