import React, { useState } from 'react';
import { useGameContext } from '../../context/GameContext';

const opponentNameForRound = (round) => `상대팀 ${round % 10 === 0 ? 10 : round % 10}`;
const clampScore = (value) => Math.max(0, Math.min(15, Math.round(value)));

const MatchView = () => {
  const { state, dispatch } = useGameContext();
  const [logLines, setLogLines] = useState([]);
  const [score, setScore] = useState({ my: 0, opp: 0 });
  const [matchMessage, setMatchMessage] = useState('플레이볼 대기 중');

  const myTeam = state.myTeam || [];
  const batters = myTeam.filter((player) => !player.isPitcher);
  const pitchers = myTeam.filter((player) => player.isPitcher);

  const teamOffense = batters.slice(0, 9).reduce((sum, player) => sum + player.overall, 0);
  const teamPitching = pitchers.slice(0, 11).reduce((sum, player) => sum + player.overall, 0);

  const simulateOneGame = () => {
    if (myTeam.length < 9) {
      setMatchMessage('로스터가 부족합니다. 9명 이상의 선수단을 구성하세요.');
      return;
    }

    const round = state.currentRound;
    const opponentName = opponentNameForRound(round);
    const offenseScore = teamOffense / Math.max(1, Math.min(9, batters.length));
    const pitchingScore = teamPitching / Math.max(1, Math.min(11, pitchers.length));
    const myPower = offenseScore * 0.55 + pitchingScore * 0.45 + (Math.random() * 8 - 4);
    const oppPower = 63 + Math.random() * 18;
    const myScore = clampScore(myPower / 10 + Math.random() * 3);
    const oppScore = clampScore(oppPower / 10 + Math.random() * 3);
    const result = myScore > oppScore ? '승리' : myScore === oppScore ? '무승부' : '패배';
    const resultLine = `${round}라운드 vs ${opponentName} — ${myScore}:${oppScore} (${result})`;

    setLogLines((prev) => [resultLine, ...prev].slice(0, 8));
    setScore({ my: myScore, opp: oppScore });
    setMatchMessage(`${result} ${myScore}:${oppScore} — ${opponentName}`);
    dispatch({ type: 'SET_CURRENT_ROUND', payload: Math.min(144, round + 1) });
    dispatch({ type: 'UPDATE_BUDGET', payload: result === '승리' ? 4 : result === '무승부' ? 1 : -2 });
  };

  const simulateMultipleGames = (count) => {
    if (myTeam.length < 9) {
      setMatchMessage('로스터가 부족합니다. 9명 이상의 선수단을 구성하세요.');
      return;
    }

    let round = state.currentRound;
    let accumulatedBudget = 0;
    const newLines = [];
    let lastScore = { my: 0, opp: 0 };

    for (let i = 0; i < count && round <= 144; i += 1) {
      const opponentName = opponentNameForRound(round);
      const offenseScore = teamOffense / Math.max(1, Math.min(9, batters.length));
      const pitchingScore = teamPitching / Math.max(1, Math.min(11, pitchers.length));
      const myPower = offenseScore * 0.55 + pitchingScore * 0.45 + (Math.random() * 8 - 4);
      const oppPower = 63 + Math.random() * 18;
      const myScore = clampScore(myPower / 10 + Math.random() * 3);
      const oppScore = clampScore(oppPower / 10 + Math.random() * 3);
      const result = myScore > oppScore ? '승리' : myScore === oppScore ? '무승부' : '패배';
      const resultLine = `${round}라운드 vs ${opponentName} — ${myScore}:${oppScore} (${result})`;
      newLines.unshift(resultLine);
      lastScore = { my: myScore, opp: oppScore };
      accumulatedBudget += result === '승리' ? 4 : result === '무승부' ? 1 : -2;
      round += 1;
    }

    if (newLines.length === 0) return;
    setLogLines((prev) => [...newLines, ...prev].slice(0, 8));
    setScore(lastScore);
    setMatchMessage(newLines[newLines.length - 1]);
    dispatch({ type: 'SET_CURRENT_ROUND', payload: Math.min(144, round) });
    dispatch({ type: 'UPDATE_BUDGET', payload: accumulatedBudget });
  };

  return (
    <div>
      <h2>
        정규시즌 매치데이
        <span style={{ fontSize: '14px', color: '#aaa', fontWeight: 'normal' }}>
          Game {state.currentRound} / 144
        </span>
      </h2>

      {state.currentRound > 132 ? (
        <div id="playoff-banner" className="playoff-banner">
          🏆 포스트시즌 진출 경쟁 중! 남은 경기 승리가 중요합니다.
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div
          style={{
            background: 'var(--panel)',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ color: '#aaa', fontWeight: 'bold', fontSize: '14px' }}>오늘의 매치업</div>
          <div style={{ fontSize: '40px', fontWeight: '900', margin: '15px 0', letterSpacing: '2px' }}>
            <span style={{ color: 'var(--accent)', fontSize: '24px' }}>내 구단</span> {score.my} : <span style={{ color: 'var(--danger)' }}>{score.opp}</span>{' '}
            <span style={{ fontSize: '24px' }}>상대팀</span>
          </div>
          <div id="match-status" style={{ fontSize: '16px', color: '#888' }}>{matchMessage}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
          <button className="action-btn" disabled>
            🎮 개입 모드 (직접 감독)
          </button>
          <button className="action-btn fast" onClick={simulateOneGame}>
            ▶ 1경기 결과 보기 (빠른 시뮬)
          </button>
          <button className="action-btn fast" onClick={() => simulateMultipleGames(10)}>
            ⏩ 10경기 쾌속 자동 진행
          </button>
        </div>
      </div>

      <div className="relay-log" id="relay-log" style={{ marginTop: '20px' }}>
        {logLines.length === 0 ? (
          <div style={{ color: '#888' }}>경기 로그가 여기에 표시됩니다.</div>
        ) : (
          logLines.map((line, index) => (
            <div key={`${line}-${index}`} style={{ marginBottom: '6px' }}>
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MatchView;
