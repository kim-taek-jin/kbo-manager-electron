import React, { useEffect, useMemo } from 'react';
import { useGameContext } from '../../context/GameContext';

const defensivePositions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
const pitcherRoleOptions = ['SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'MR1', 'MR2', 'MR3', 'MR4', 'MR5', 'CL'];

const TacticsView = () => {
  const { state, dispatch } = useGameContext();
  const myTeam = useMemo(() => state.myTeam || [], [state.myTeam]);
  const starterBatters = useMemo(
    () => myTeam.filter((player) => !player.isPitcher && player.status === 'STARTER'),
    [myTeam]
  );
  const allBatters = useMemo(
    () => myTeam.filter((player) => !player.isPitcher),
    [myTeam]
  );
  const batters = starterBatters.length >= 9 ? starterBatters : allBatters.slice(0, 9);
  const benchBatters = useMemo(
    () => allBatters.filter((player) => player.status !== 'STARTER'),
    [allBatters]
  );
  const pitchers = useMemo(() => myTeam.filter((player) => player.isPitcher), [myTeam]);
  const benchPitchers = useMemo(
    () => pitchers.filter((player) => player.status !== 'STARTER'),
    [pitchers]
  );
  const tactics = state.tactics || { battingOrder: [], pitcherRoles: {} };

  const defaultBattingOrder = useMemo(
    () => batters.slice(0, 9).map((player) => player.id),
    [batters]
  );

  const validBattingOrder = tactics.battingOrder && tactics.battingOrder.length === 9
    ? tactics.battingOrder.filter((id) => batters.some((player) => player.id === id))
    : defaultBattingOrder;

  const battingOrder = validBattingOrder.length === 9 ? validBattingOrder : defaultBattingOrder;
  const orderedBatters = battingOrder
    .map((id) => batters.find((player) => player.id === id))
    .filter(Boolean);

  useEffect(() => {
    if (!state.tactics || !state.tactics.battingOrder || state.tactics.battingOrder.length !== 9) {
      dispatch({
        type: 'SET_TACTICS',
        payload: {
          battingOrder,
          pitcherRoles: tactics.pitcherRoles || {},
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batters.length]);

  const updateTactics = (newData) => {
    dispatch({
      type: 'SET_TACTICS',
      payload: {
        ...tactics,
        ...newData,
      },
    });
  };

  const updatePlayerStatus = (playerId, status) => {
    dispatch({
      type: 'SET_MY_TEAM',
      payload: myTeam.map((player) =>
        player.id === playerId ? { ...player, status } : player
      ),
    });
  };

  const promoteNewStarter = (playerId) => {
    const player = myTeam.find((item) => item.id === playerId);
    if (!player) return;

    const sameTypeStarters = myTeam.filter(
      (item) => item.isPitcher === player.isPitcher && item.status === 'STARTER'
    );
    const limit = player.isPitcher ? 11 : 9;

    let updatedTeam = [...myTeam];
    if (sameTypeStarters.length >= limit) {
      const demote = sameTypeStarters.reduce((worst, item) => {
        if (!worst) return item;
        return item.overall < worst.overall ? item : worst;
      }, null);
      if (demote) {
        updatedTeam = updatedTeam.map((item) =>
          item.id === demote.id ? { ...item, status: 'BENCH' } : item
        );
      }
    }

    updatedTeam = updatedTeam.map((item) =>
      item.id === playerId ? { ...item, status: 'STARTER' } : item
    );

    dispatch({ type: 'SET_MY_TEAM', payload: updatedTeam });
  };

  const demoteStarter = (playerId) => {
    updatePlayerStatus(playerId, 'BENCH');
  };

  const handlePositionChange = (playerId, newPos) => {
    const player = myTeam.find((item) => item.id === playerId);
    if (!player) return;
    if (!player.caps.includes(newPos) && newPos !== 'DH') return;

    dispatch({
      type: 'SET_MY_TEAM',
      payload: myTeam.map((item) =>
        item.id === playerId ? { ...item, assignedPos: newPos } : item
      ),
    });
  };

  const handleOrderMove = (playerId, direction) => {
    let nextOrder = [...battingOrder];
    while (nextOrder.length < 9) {
      const missing = allBatters.find((player) => !nextOrder.includes(player.id));
      if (missing) nextOrder.push(missing.id);
      else break;
    }
    const index = nextOrder.indexOf(playerId);
    if (index < 0) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= nextOrder.length) return;
    [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]];
    updateTactics({ battingOrder: nextOrder });
  };

  const handleRoleChange = (playerId, newRole) => {
    const nextRoles = { ...tactics.pitcherRoles, [playerId]: newRole };
    if (newRole === 'CL') {
      Object.keys(nextRoles).forEach((key) => {
        if (key !== String(playerId) && nextRoles[key] === 'CL') {
          nextRoles[key] = 'MR1';
        }
      });
    }
    updateTactics({ pitcherRoles: nextRoles });
  };

  return (
    <div>
      <h2>
        전술 및 라인업 설정
        <span style={{ fontSize: '14px', color: '#aaa', fontWeight: 'normal' }}>
          (타순/수비 위치 및 투수 보직을 직접 설정)
        </span>
      </h2>

      {batters.length < 9 && (
        <div className="missing-pos-bar" style={{ marginBottom: '16px' }}>
          9명 이상의 타자가 필요합니다. 1군 로스터를 먼저 구성해주세요.
        </div>
      )}

      <section style={{ marginTop: '20px' }}>
        <h3>타자 라인업 & 수비 위치</h3>
        <table>
          <thead>
            <tr>
              <th>순번</th>
              <th style={{ textAlign: 'left' }}>선수명</th>
              <th>팀</th>
              <th>포지션</th>
              <th>가능 포지션</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {orderedBatters.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ color: '#888' }}>
                  자동 추천 또는 로스터에서 9명 이상의 타자를 구성하면 타순을 조정할 수 있습니다.
                </td>
              </tr>
            ) : (
              orderedBatters.map((player, index) => {
                const options = player.caps.length > 0 ? player.caps : defensivePositions;
                return (
                  <tr key={player.id}>
                    <td>{index + 1}</td>
                    <td style={{ textAlign: 'left' }}>{player.name}</td>
                    <td>{player.team}</td>
                    <td>
                      <select
                        value={player.assignedPos || 'DH'}
                        onChange={(e) => handlePositionChange(player.id, e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}
                      >
                        {options.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                        {!options.includes('DH') && <option value="DH">DH</option>}
                      </select>
                    </td>
                    <td>{options.join(', ')}</td>
                    <td>
                      <button
                        type="button"
                        className="action-btn"
                        disabled={index === 0}
                        onClick={() => handleOrderMove(player.id, -1)}
                        style={{ marginRight: '6px' }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        disabled={index === orderedBatters.length - 1}
                        onClick={() => handleOrderMove(player.id, 1)}
                        style={{ marginRight: '6px' }}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => demoteStarter(player.id)}
                        style={{ background: '#913838', color: '#fff' }}
                      >
                        벤치
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h3>벤치 선수</h3>
        <table>
          <thead>
            <tr>
              <th>구분</th>
              <th style={{ textAlign: 'left' }}>선수명</th>
              <th>팀</th>
              <th>포지션</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {benchBatters.length === 0 && benchPitchers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ color: '#888' }}>
                  벤치에 등록된 선수가 없습니다. 로스터나 자동 추천을 사용해 선수를 구성하세요.
                </td>
              </tr>
            ) : (
              [...benchBatters, ...benchPitchers].map((player) => (
                <tr key={player.id}>
                  <td>{player.isPitcher ? '투수' : '타자'}</td>
                  <td style={{ textAlign: 'left' }}>{player.name}</td>
                  <td>{player.team}</td>
                  <td>{player.assignedPos || player.displayPos}</td>
                  <td>
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => promoteNewStarter(player.id)}
                    >
                      선발로
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h3>투수 보직 설정</h3>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>선수명</th>
              <th>팀</th>
              <th>역할</th>
              <th>가능 보직</th>
            </tr>
          </thead>
          <tbody>
            {pitchers.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ color: '#888' }}>
                  11명 이상의 투수가 필요합니다. 1군 로스터를 먼저 구성해주세요.
                </td>
              </tr>
            ) : (
              pitchers.map((player) => {
                const currentRole = tactics.pitcherRoles?.[player.id] || 'MR1';
                return (
                  <tr key={player.id}>
                    <td style={{ textAlign: 'left' }}>{player.name}</td>
                    <td>{player.team}</td>
                    <td>
                      <select
                        value={currentRole}
                        onChange={(e) => handleRoleChange(player.id, e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}
                      >
                        {pitcherRoleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{player.caps.join(', ') || 'SP/RP/CP'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <div style={{ marginTop: '20px', color: '#aaa' }}>
        * 설정한 타순과 투수 보직은 정규시즌 시뮬레이션과 직접 감독 모드에 자동으로 반영됩니다.
      </div>
    </div>
  );
};

export default TacticsView;
