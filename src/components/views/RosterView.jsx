import React from 'react';
import { useGameContext } from '../../context/GameContext';

const positionOrder = {
  C: 1,
  '1B': 2,
  '2B': 3,
  '3B': 4,
  SS: 5,
  LF: 6,
  CF: 7,
  RF: 8,
  DH: 9,
  SP: 10,
  CP: 11,
  RP: 12,
};

const sortByPosition = (a, b) => {
  const posA = positionOrder[a.assignedPos] || positionOrder[a.caps[0]] || 99;
  const posB = positionOrder[b.assignedPos] || positionOrder[b.caps[0]] || 99;
  if (posA !== posB) return posA - posB;
  return b.overall - a.overall;
};

const RosterView = ({ onAutoLineup }) => {
  const { state, dispatch } = useGameContext();
  const allPlayers = state.allPlayersRegistry || [];
  const myTeam = state.myTeam || [];
  const activeCount = allPlayers.length;
  const batters = allPlayers.filter((player) => !player.isPitcher);
  const pitchers = allPlayers.filter((player) => player.isPitcher);
  const rosterPlayers = myTeam.length > 0 ? myTeam : allPlayers.slice(0, 20);

  const startingBatters = rosterPlayers
    .filter((player) => !player.isPitcher && player.status === 'STARTER')
    .sort(sortByPosition);
  const lineupPitchers = rosterPlayers
    .filter((player) => player.isPitcher && player.status === 'STARTER')
    .sort(sortByPosition);
  const benchPlayers = rosterPlayers.filter((player) => player.status !== 'STARTER');

  const handleUpdateStatus = (playerId, status) => {
    dispatch({
      type: 'SET_MY_TEAM',
      payload: myTeam.map((player) =>
        player.id === playerId ? { ...player, status } : player
      ),
    });
  };

  const promoteToStarter = (playerId) => {
    const player = rosterPlayers.find((item) => item.id === playerId);
    if (!player) return;
    const sameTypeStarters = rosterPlayers.filter(
      (item) => item.isPitcher === player.isPitcher && item.status === 'STARTER'
    );
    const limit = player.isPitcher ? 11 : 9;

    let updated = [...myTeam];
    if (sameTypeStarters.length >= limit) {
      const demote = sameTypeStarters.reduce((worst, item) => {
        if (!worst) return item;
        return item.overall < worst.overall ? item : worst;
      }, null);
      if (demote) {
        updated = updated.map((item) =>
          item.id === demote.id ? { ...item, status: 'BENCH' } : item
        );
      }
    }

    updated = updated.map((item) =>
      item.id === playerId ? { ...item, status: 'STARTER' } : item
    );

    dispatch({ type: 'SET_MY_TEAM', payload: updated });
  };

  const demoteFromStarter = (playerId) => {
    handleUpdateStatus(playerId, 'BENCH');
  };

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

      <section style={{ marginTop: '20px' }}>
        <h3>선발 라인업</h3>
        <table>
          <thead>
            <tr>
              <th>포지션</th>
              <th style={{ textAlign: 'left' }}>선수명</th>
              <th>팀</th>
              <th>AVG</th>
              <th>AB</th>
              <th>H</th>
              <th>HR</th>
              <th>RBI</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {startingBatters.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ color: '#888' }}>
                  자동 추천 라인업을 눌러 1군 선발 명단을 구성하세요.
                </td>
              </tr>
            ) : (
              startingBatters.map((player) => (
                <tr key={player.id}>
                  <td>{player.assignedPos || player.displayPos}</td>
                  <td style={{ textAlign: 'left' }}>{player.name}</td>
                  <td>{player.team}</td>
                  <td>{player.stats?.avg != null ? player.stats.avg.toFixed(3) : '-'}</td>
                  <td>{player.stats?.ab ?? '-'}</td>
                  <td>{player.stats?.h ?? '-'}</td>
                  <td>{player.stats?.hr ?? '-'}</td>
                  <td>{player.stats?.rbi ?? '-'}</td>
                  <td>
                    <button
                      className="action-btn"
                      style={{ marginRight: '6px' }}
                      onClick={() => demoteFromStarter(player.id)}
                    >
                      벤치로
                    </button>
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
      </section>

      <section style={{ marginTop: '20px' }}>
        <h3>투수진</h3>
        <table>
          <thead>
            <tr>
              <th>역할</th>
              <th style={{ textAlign: 'left' }}>선수명</th>
              <th>팀</th>
              <th>OVR</th>
              <th>연봉</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {lineupPitchers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ color: '#888' }}>
                  선발/불펜 투수를 구성하려면 자동 추천 라인업을 눌러주세요.
                </td>
              </tr>
            ) : (
              lineupPitchers.map((player) => (
                <tr key={player.id}>
                  <td>{player.assignedPos || player.displayPos}</td>
                  <td style={{ textAlign: 'left' }}>{player.name}</td>
                  <td>{player.team}</td>
                  <td>
                    {player.overall} ({player.contact}/{player.power}/{player.eye})
                  </td>
                  <td>{player.salary}억</td>
                  <td>
                    <button
                      className="action-btn"
                      style={{ marginRight: '6px' }}
                      onClick={() => demoteFromStarter(player.id)}
                    >
                      벤치로
                    </button>
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
      </section>

      <section style={{ marginTop: '20px' }}>
        <h3>벤치</h3>
        <table>
          <thead>
            <tr>
              <th>구분</th>
              <th style={{ textAlign: 'left' }}>선수명</th>
              <th>팀</th>
              <th>OVR</th>
              <th>연봉</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {benchPlayers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ color: '#888' }}>
                  벤치에 등록된 선수들이 없습니다.
                </td>
              </tr>
            ) : (
              benchPlayers.map((player) => (
                <tr key={player.id}>
                  <td>{player.isPitcher ? '투수' : '타자'}</td>
                  <td style={{ textAlign: 'left' }}>{player.name}</td>
                  <td>{player.team}</td>
                  <td>
                    {player.overall} ({player.contact}/{player.power}/{player.eye})
                  </td>
                  <td>{player.salary}억</td>
                  <td>
                    <button
                      className="action-btn"
                      style={{ marginRight: '6px' }}
                      onClick={() => promoteToStarter(player.id)}
                    >
                      선발로
                    </button>
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
      </section>

      <div style={{ fontSize: '11px', color: '#888', marginTop: '5px', textAlign: 'right' }}>
        * 피로도가 50 이하로 떨어지면 경기 중 스탯 하락 페널티가 부여됩니다.
      </div>
    </div>
  );
};

export default RosterView;
