import React from 'react';
import { useGameContext } from '../../context/GameContext';

const TEAM_SHORT_MAP = {
  'KIA 타이거즈': 'KIA',
  '삼성 라이온즈': '삼성',
  'LG 트윈스': 'LG',
  '두산 베어스': '두산',
  'KT 위즈': 'KT',
  'SSG 랜더스': 'SSG',
  '롯데 자이언츠': '롯데',
  'NC 다이노스': 'NC',
  '한화 이글스': '한화',
  '키움 히어로즈': '키움',
};

const TradeView = () => {
  const { state, dispatch } = useGameContext();
  const allPlayers = state.allPlayersRegistry || [];
  const myTeam = state.myTeam || [];
  const existingIds = new Set(myTeam.map((player) => player.id));
  const selectedTeam = state.userTeamName;
  const teamShort = TEAM_SHORT_MAP[selectedTeam] || selectedTeam;
  const tradeCandidates = allPlayers
    .filter((player) => !existingIds.has(player.id) && (!teamShort || player.team !== teamShort))
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 14);

  const handleTradeOffer = (player) => {
    if (myTeam.length >= 20) return;
    dispatch({ type: 'SET_MY_TEAM', payload: [...myTeam, player] });
  };

  return (
    <div>
      <h2>타 구단 트레이드 블록</h2>
      <table>
        <thead>
          <tr>
            <th>소속팀</th>
            <th>가능 포지션</th>
            <th style={{ textAlign: 'left' }}>선수명</th>
            <th>컨택(구위)</th>
            <th>파워(제구)</th>
            <th>연봉</th>
            <th>우리 팀 제시 카드</th>
            <th>제안</th>
          </tr>
        </thead>
        <tbody>
          {tradeCandidates.length === 0 ? (
            <tr>
              <td colSpan="8">데이터를 업로드하거나 선수 데이터를 로드해주세요.</td>
            </tr>
          ) : (
            tradeCandidates.map((player) => (
              <tr key={player.id}>
                <td>{player.team}</td>
                <td>{player.caps.join('/')}</td>
                <td style={{ textAlign: 'left' }}>{player.name}</td>
                <td>{player.contact}</td>
                <td>{player.power}</td>
                <td>{player.salary}억</td>
                <td>{Math.max(1, player.salary - 1)}억 + 선수 교환</td>
                <td>
                  <button
                    className="action-btn"
                    disabled={myTeam.length >= 20}
                    onClick={() => handleTradeOffer(player)}
                  >
                    제안
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TradeView;
