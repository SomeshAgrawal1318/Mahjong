import React from 'react';
import { useGameStore } from './store/gameStore';
import { Lobby } from './pages/Lobby';
import { Room } from './pages/Room';
import { Game } from './pages/Game';
import { ToastContainer } from './components/Toast';
import { GAME_PHASE } from '../../shared/constants.js';

function App() {
  const { roomState, notifications, removeNotification } = useGameStore();
  
  const renderContent = () => {
    if (!roomState) {
      return <Lobby />;
    }
    
    if (roomState.phase === GAME_PHASE.LOBBY) {
      return <Room />;
    }
    
    return <Game />;
  };
  
  return (
    <div className="app">
      {renderContent()}
      <ToastContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
}

export default App;

