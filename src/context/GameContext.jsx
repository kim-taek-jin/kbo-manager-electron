import React, { createContext, useContext, useReducer } from 'react';

const INITIAL_STANDINGS = [
  { team: 'KIA 타이거즈', wins: 0, losses: 0, ties: 0 },
  { team: '삼성 라이온즈', wins: 0, losses: 0, ties: 0 },
  { team: 'LG 트윈스', wins: 0, losses: 0, ties: 0 },
  { team: '두산 베어스', wins: 0, losses: 0, ties: 0 },
  { team: 'KT 위즈', wins: 0, losses: 0, ties: 0 },
  { team: 'SSG 랜더스', wins: 0, losses: 0, ties: 0 },
  { team: '롯데 자이언츠', wins: 0, losses: 0, ties: 0 },
  { team: 'NC 다이노스', wins: 0, losses: 0, ties: 0 },
  { team: '한화 이글스', wins: 0, losses: 0, ties: 0 },
  { team: '키움 히어로즈', wins: 0, losses: 0, ties: 0 },
];

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
    tactics: {
      battingOrder: [],
      pitcherRoles: {},
    },
    popScore: 50,
    facStadiumLvl: 1,
    facMarketLvl: 1,
    facTrainLvl: 1,
    lastIncome: 0,
    sponsorType: 'safe',
    fundSafe: 0,
    fundRisky: 0,
    standings: INITIAL_STANDINGS,
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
    case 'SET_CURRENT_ROUND':
      return { ...state, currentRound: action.payload };
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
    case 'SET_TACTICS':
      return { ...state, tactics: { ...state.tactics, ...action.payload } };
    default:
      return state;
  }
}
