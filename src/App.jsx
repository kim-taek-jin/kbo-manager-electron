import React, { useState } from 'react';
import './App.css';
import { GameProvider } from './context/GameContext';
import IntroScreen from './components/IntroScreen';
import MainGame from './components/MainGame';

function App() {
  const [gameStarted, setGameStarted] = useState(false);

  const handleGameStart = () => {
    setGameStarted(true);
  };

  return (
    <GameProvider>
      <div className="app-container">
        {!gameStarted ? (
          <IntroScreen onGameStart={handleGameStart} />
        ) : (
          <MainGame />
        )}
      </div>
    </GameProvider>
  );
}

export default App;
