import React from 'react';
import { useGameContext } from '../../context/GameContext';

const RosterView = ({ onAutoLineup }) => {
  const { state, dispatch } = useGameContext();
  const allPlayers = state.allPlayersRegistry || [];
  const myTeam = state.myTeam || [];
  const activeCount = allPlayers.length;
  const batters = allPlayers.filter((player) => !player.isPitcher);
  const pitchers = allPlayers.filter((player) => player.isPitcher);
  const rosterPlayers = myTeam.length > 0 ? myTeam : allPlayers.slice(0, 20);

  const handleRemovePlayer = (playerId) => {
    dispatch({
      type: 'SET_MY_TEAM',
      payload: myTeam.filter((player) => player.id !== playerId),
    });
  };

  return (
    <div>
      <h2>
        1군 로스터
        <span style={{ fontSize: '14px', color: '#aaa', fontWeight: 'normal' }}>
          (풀 {activeCount}명 — 타자 {batters.length}명, 투수 {pitchers.length}명)
        </span>
      </h2>

      <button
        className="action-btn"
        style={{ padding: '10px', float: 'right', marginTop: '-40px', width: 'auto' }}
        onClick={onAutoLineup}
      >
        자동 추천 라인업
      </button>

      {activeCount === 0 ? (
        <div id="missing-pos-alert" className="missing-pos-bar">
          기본 선수 데이터를 로드 중이거나, CSV를 업로드해야 합니다.
        </div>
      ) : null}

      <table>
        <thead>
          <tr>
            <th>구분</th>
            <th>포지션</th>
            <th style={{ textAlign: 'left' }}>선수명</th>
            <th>팀</th>
            <th>OVR</th>
            <th>WAR</th>
            <th>G</th>
            <th>연봉</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody id="roster-tbody">
          {rosterPlayers.length === 0 ? (
            <tr>
              <td colSpan="9" style={{ color: '#888' }}>
                데이터를 업로드해주세요.
              </td>
            </tr>
          ) : (
            rosterPlayers.map((player) => (
              <tr key={player.id}>
                <td>{player.isPitcher ? '투수' : '타자'}</td>
                <td>{player.assignedPos || player.displayPos}</td>
                <td style={{ textAlign: 'left' }}>{player.name}</td>
                <td>{player.team}</td>
                <td>
                  {player.overall} ({player.contact}/{player.power}/{player.eye})
                </td>
                <td>{player.estimatedWAR ?? '-'}</td>
                <td>{player.games ?? '-'}</td>
                <td>{player.salary}억</td>
                <td>
                  <button
                    className="action-btn"
                    disabled={myTeam.length <= 1}
                    onClick={() => handleRemovePlayer(player.id)}
                  >
                    제거
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={{ fontSize: '11px', color: '#888', marginTop: '5px', textAlign: 'right' }}>
        * 피로도가 50 이하로 떨어지면 경기 중 스탯 하락 페널티가 부여됩니다.
      </div>
    </div>
  );
};

export default RosterView;
