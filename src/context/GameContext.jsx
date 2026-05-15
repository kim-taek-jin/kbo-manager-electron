import React, { createContext, useContext, useReducer } from 'react';

// 게임 상태 Context
export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const initialState = {
    userTeamName: '',
    budget: 300,
    myTeam: [],
    tradeBlock: [],
    faMarket: [],
    allPlayersRegistry: [],
    popScore: 50,
    facStadiumLvl: 1,
    facMarketLvl: 1,
    facTrainLvl: 1,
    lastIncome: 0,
    sponsorType: 'safe',
    fundSafe: 0,
    fundRisky: 0,
    standings: [],
    currentRound: 1,
    mySchedule: [],
    gameStarted: false,
  };

  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within GameProvider');
  }
  return context;
};

// 게임 상태 리듀서
function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_TEAM_NAME':
      return { ...state, userTeamName: action.payload };
    case 'SET_BUDGET':
      return { ...state, budget: action.payload };
    case 'SET_MY_TEAM':
      return { ...state, myTeam: action.payload };
    case 'SET_TRADE_BLOCK':
      return { ...state, tradeBlock: action.payload };
    case 'SET_FA_MARKET':
      return { ...state, faMarket: action.payload };
    case 'SET_STANDINGS':
      return { ...state, standings: action.payload };
    case 'SET_SPONSOR_TYPE':
      return { ...state, sponsorType: action.payload };
    case 'SET_GAME_STARTED':
      return { ...state, gameStarted: action.payload };
    case 'UPDATE_POP_SCORE':
      return { ...state, popScore: action.payload };
    case 'UPDATE_BUDGET':
      return { ...state, budget: state.budget + action.payload };
    case 'SET_ALL_PLAYERS':
      return { ...state, allPlayersRegistry: action.payload };
    default:
      return state;
  }
}
