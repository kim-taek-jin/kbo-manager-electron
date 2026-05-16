import React from 'react';
import { useGameContext } from '../../context/GameContext';

const MarketView = () => {
  const { state, dispatch } = useGameContext();
  const allPlayers = state.allPlayersRegistry || [];
  const myTeam = state.myTeam || [];
  const existingIds = new Set(myTeam.map((player) => player.id));
  const marketPlayers = allPlayers
    .filter((player) => !existingIds.has(player.id))
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 10);

  const handleSignPlayer = (player) => {
    if (myTeam.length >= 20 || state.budget < player.salary) return;
    dispatch({ type: 'SET_MY_TEAM', payload: [...myTeam, player] });
    dispatch({ type: 'UPDATE_BUDGET', payload: -player.salary });
  };

  return (
    <div>
      <h2>FA 시장 (경쟁 입찰)</h2>
      <table>
        <thead>
          <tr>
            <th>등급</th>
            <th>원소속</th>
            <th>가능 포지션</th>
            <th style={{ textAlign: 'left' }}>선수명</th>
            <th>컨택(구위)</th>
            <th>파워(제구)</th>
            <th>선구(체력)</th>
            <th>기본가</th>
            <th>협상</th>
          </tr>
        </thead>
        <tbody>
          {marketPlayers.length === 0 ? (
            <tr>
              <td colSpan="9">데이터를 업로드하거나 선수 데이터를 로드해주세요.</td>
            </tr>
          ) : (
            marketPlayers.map((player) => (
              <tr key={player.id}>
                <td>{player.tier}</td>
                <td>{player.team}</td>
                <td>{player.caps.join('/')}</td>
                <td style={{ textAlign: 'left' }}>{player.name}</td>
                <td>{player.contact}</td>
                <td>{player.power}</td>
                <td>{player.eye}</td>
                <td>{player.salary}억</td>
                <td>
                  <button
                    className="action-btn"
                    disabled={myTeam.length >= 20 || state.budget < player.salary}
                    onClick={() => handleSignPlayer(player)}
                  >
                    영입
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

export default MarketView;
