import React, { useState } from 'react';
import { useGameContext } from '../context/GameContext';

const IntroScreen = ({ onGameStart }) => {
  // eslint-disable-next-line no-unused-vars
  const { state, dispatch } = useGameContext();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedSponsor, setSelectedSponsor] = useState('safe');

  const ALL_KBO_TEAMS = [
    'KIA 타이거즈',
    '삼성 라이온즈',
    'LG 트윈스',
    '두산 베어스',
    'KT 위즈',
    'SSG 랜더스',
    '롯데 자이언츠',
    'NC 다이노스',
    '한화 이글스',
    '키움 히어로즈',
  ];

  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
  };

  const handleGameStart = () => {
    if (!selectedTeam) {
      alert('구단을 선택해주세요!');
      return;
    }

    dispatch({ type: 'SET_TEAM_NAME', payload: selectedTeam });
    dispatch({ type: 'SET_SPONSOR_TYPE', payload: selectedSponsor });
    dispatch({ type: 'SET_GAME_STARTED', payload: true });
    onGameStart();
  };

  return (
    <div id="intro-screen">
      <h1>KBO 매니저 2026</h1>
      <p style={{ color: '#ccc', fontSize: '18px' }}>
        스토브리그를 이끌어갈 구단과 스폰서를 선택해 주세요.
      </p>

      <div className="sponsor-grid">
        <div
          className={`sponsor-card ${selectedSponsor === 'safe' ? 'selected' : ''}`}
          onClick={() => setSelectedSponsor('safe')}
        >
          <h3>안전형 스폰서</h3>
          <p>
            매 경기 종료 시 승패 무관
            <br />
            고정 수익금 <strong>+1억 원</strong> 지급
          </p>
        </div>
        <div
          className={`sponsor-card ${selectedSponsor === 'challenge' ? 'selected' : ''}`}
          onClick={() => setSelectedSponsor('challenge')}
        >
          <h3>도전형 스폰서</h3>
          <p>
            경기 승리 시 막대한 보너스
            <br />
            <strong>+3억 원</strong> 지급 (패배시 0원)
          </p>
        </div>
      </div>

      <div className="team-grid">
        {ALL_KBO_TEAMS.map((team, idx) => (
          <button
            key={idx}
            className={`team-btn ${selectedTeam === team ? 'selected' : ''}`}
            onClick={() => handleTeamSelect(team)}
            style={
              selectedTeam === team
                ? { borderColor: '#00b894', color: '#00b894' }
                : {}
            }
          >
            {team}
          </button>
        ))}
      </div>

      <button className="start-btn" onClick={handleGameStart}>
        게임 시작
      </button>
    </div>
  );
};

export default IntroScreen;
