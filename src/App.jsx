import { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import SystemCheckScreen from './components/SystemCheckScreen.jsx';
import MonitoringTestScreen from './components/MonitoringTestScreen.jsx';
import './App.css';

function App() {
  const [screen, setScreen] = useState('welcome');

  return (
    <>
      {screen === 'welcome' && (
        <WelcomeScreen onBeginSetup={() => setScreen('system-check')} />
      )}
      {screen === 'system-check' && (
        <SystemCheckScreen
          onBack={() => setScreen('welcome')}
          onContinue={() => setScreen('monitoring-test')}
        />
      )}
      {screen === 'monitoring-test' && (
        <MonitoringTestScreen onBack={() => setScreen('system-check')} />
      )}
    </>
  );
}

export default App;
