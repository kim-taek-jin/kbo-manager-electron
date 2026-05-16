import React, { useEffect, useMemo, useState } from 'react';
import { useGameContext } from '../../context/GameContext';

const OPPONENT_ORDER = [
  '삼성 라이온즈',
  'LG 트윈스',
  '두산 베어스',
  'KT 위즈',
  'SSG 랜더스',
  '롯데 자이언츠',
  'NC 다이노스',
  '한화 이글스',
  '키움 히어로즈',
  'KIA 타이거즈',
];

const getOpponentForRound = (round) => OPPONENT_ORDER[(round - 1) % OPPONENT_ORDER.length];
const clamp = (value, min = 0, max = 99) => Math.max(min, Math.min(max, value));
const clampScore = (value) => Math.max(0, Math.min(15, Math.round(value)));
const battingOrder = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

const sortLineup = (a, b) => {
  const orderA = battingOrder.indexOf(a.assignedPos || a.caps[0]);
  const orderB = battingOrder.indexOf(b.assignedPos || b.caps[0]);
  if (orderA !== orderB) return orderA - orderB;
  return b.overall - a.overall;
};

const applyPlayerGameUpdates = (players, batters, pitchers, myScore, oppScore) =>
  players.map((player) => {
    const isStarter = batters.some((p) => p.id === player.id) || pitchers.some((p) => p.id === player.id);
    if (!isStarter) return player;

    const updated = { ...player };

    if (!player.isPitcher) {
      const hitCount = Math.round(Math.random() * 2);
      const hrCount = Math.random() > 0.88 ? 1 : 0;
      updated.stats = {
        ...updated.stats,
        pa: (updated.stats.pa || 0) + 4,
        ab: (updated.stats.ab || 0) + 4,
        h: (updated.stats.h || 0) + hitCount,
        hr: (updated.stats.hr || 0) + hrCount,
        rbi: (updated.stats.rbi || 0) + Math.round(Math.random() * 2),
      };
      updated.stats.avg = updated.stats.ab
        ? Number((updated.stats.h / updated.stats.ab).toFixed(3))
        : updated.stats.avg;
      updated.estimatedWAR = Math.max(
        0,
        Math.round((updated.estimatedWAR + hitCount * 0.04 + hrCount * 0.15) * 10) / 10
      );
      updated.overall = clamp(Math.round(updated.overall + hitCount * 0.2 + hrCount * 0.7), 40, 99);
    } else {
      const ipInc = parseFloat((Math.random() * 2 + 1).toFixed(1));
      const soInc = Math.round(Math.random() * 2 + 1);
      const bbInc = Math.round(Math.random() * 1);
      updated.stats = {
        ...updated.stats,
        ip: (updated.stats.ip || 0) + ipInc,
        so: (updated.stats.so || 0) + soInc,
        bb: (updated.stats.bb || 0) + bbInc,
      };
      const eraShift = (oppScore - myScore) * 0.03;
      updated.stats.era = Number(Math.max(1.8, Math.min(6.5, (updated.stats.era || 4.5) + eraShift)).toFixed(2));
      updated.stats.whip = Number(Math.max(1.0, Math.min(2.2, (updated.stats.whip || 1.3) + (bbInc - soInc) * 0.03)).toFixed(2));
      updated.stats.wpct = Number(
        Math.max(0, Math.min(1, (updated.stats.wpct || 0) + (myScore > oppScore ? 0.02 : 0))).toFixed(3)
      );
      updated.estimatedWAR = Math.max(
        0,
        Math.round((updated.estimatedWAR + soInc * 0.05 - eraShift * 0.15) * 10) / 10
      );
      updated.overall = clamp(Math.round(updated.overall + soInc * 0.3 - eraShift * 1.0), 40, 99);
    }

    return updated;
  });

const updateStandings = (standings, club, opponent, result) =>
  standings.map((team) => {
    if (team.team !== club && team.team !== opponent) return team;
    const updated = { ...team };
    if (team.team === club) {
      if (result === '승리') updated.wins += 1;
      if (result === '패배') updated.losses += 1;
      if (result === '무승부') updated.ties += 1;
    }
    if (team.team === opponent) {
      if (result === '승리') updated.losses += 1;
      if (result === '패배') updated.wins += 1;
      if (result === '무승부') updated.ties += 1;
    }
    return updated;
  });

const getTeamStrengthFromPlayers = (players) => {
  const batters = players.filter((player) => !player.isPitcher).sort((a, b) => b.overall - a.overall).slice(0, 9);
  const pitchers = players.filter((player) => player.isPitcher).sort((a, b) => b.overall - a.overall).slice(0, 7);
  const offense = batters.reduce((sum, player) => sum + player.overall, 0) / Math.max(1, batters.length);
  const pitching = pitchers.reduce((sum, player) => sum + player.overall, 0) / Math.max(1, pitchers.length);
  return { offense, pitching };
};

const buildOtherGamePairs = (teams) => {
  const pairs = [];
  for (let i = 0; i < teams.length; i += 2) {
    if (teams[i + 1]) pairs.push([teams[i], teams[i + 1]]);
  }
  return pairs;
};

const MatchView = () => {
  const { state, dispatch } = useGameContext();
  const [logLines, setLogLines] = useState([]);
  const [score, setScore] = useState({ my: 0, opp: 0 });
  const [matchMessage, setMatchMessage] = useState('플레이볼 대기 중');
  const [isDirectMode, setIsDirectMode] = useState(false);
  const [startingPitcherId, setStartingPitcherId] = useState(null);

  const tactics = state.tactics || { battingOrder: [], pitcherRoles: {} };
  const myTeam = useMemo(() => state.myTeam || [], [state.myTeam]);
  const startingBatters = useMemo(() => {
    const starters = myTeam.filter((player) => !player.isPitcher && player.status === 'STARTER').sort(sortLineup);
    const bench = myTeam.filter((player) => !player.isPitcher && player.status !== 'STARTER').sort(sortLineup);
    return [...starters, ...bench].slice(0, 9);
  }, [myTeam]);
  const bullpen = useMemo(() => {
    const starters = myTeam.filter((player) => player.isPitcher && player.status === 'STARTER');
    const bench = myTeam.filter((player) => player.isPitcher && player.status !== 'STARTER');
    return [...starters, ...bench].sort((a, b) => (a.assignedPos === 'SP' ? -1 : 1) - (b.assignedPos === 'SP' ? -1 : 1));
  }, [myTeam]);

  const tacticsBattingOrder = tactics.battingOrder.filter((id) => startingBatters.some((player) => player.id === id));
  const validBattingOrder = tacticsBattingOrder.length === 9 ? tacticsBattingOrder : startingBatters.map((player) => player.id);
  const selectedLineup = validBattingOrder
    .map((id) => startingBatters.find((player) => player.id === id))
    .filter(Boolean);

  const handleDirectOrderMove = (index, direction) => {
    let next = [...validBattingOrder];
    while (next.length < 9) {
      const missing = startingBatters.find((player) => !next.includes(player.id));
      if (missing) next.push(missing.id);
      else break;
    }
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    dispatch({ type: 'SET_TACTICS', payload: { battingOrder: next } });
  };

  const selectedPitcher = bullpen.find((player) => player.id === startingPitcherId) || bullpen[0];
  const selectedPitchingStaff = useMemo(() => {
    const roles = tactics.pitcherRoles || {};
    const starters = bullpen.filter((player) => {
      const role = roles[player.id];
      return role && role.startsWith('SP');
    });
    const closer = bullpen.find((player) => roles[player.id] === 'CL');
    const relievers = bullpen.filter((player) => !starters.includes(player) && player !== closer);
    const ordered = [...starters.slice(0, 5), ...relievers.slice(0, 6)];
    if (ordered.length >= 7) return ordered.slice(0, 7);
    const fallback = bullpen.filter((player) => !ordered.includes(player)).slice(0, 7 - ordered.length);
    return [...ordered, ...fallback];
  }, [bullpen, tactics.pitcherRoles]);

  useEffect(() => {
    if (bullpen.length > 0 && !bullpen.some((player) => player.id === startingPitcherId)) {
      setStartingPitcherId(bullpen[0].id);
    }
  }, [bullpen, startingPitcherId]);

  const seasonComplete = state.currentRound > 144;

  const getTeamStrength = (batters, pitchers) => {
    const offense = batters.reduce((sum, player) => sum + player.overall, 0) / Math.max(1, batters.length);
    const pitching = pitchers.reduce((sum, player) => sum + player.overall, 0) / Math.max(1, pitchers.length);
    return { offense, pitching };
  };

  const simulate = (roundCount) => {
    if (seasonComplete) {
      setMatchMessage('정규시즌이 종료되었습니다. 가을야구 준비 중입니다.');
      return;
    }
    if (myTeam.length < 9) {
      setMatchMessage('로스터가 부족합니다. 9명 이상의 선수단을 구성하세요.');
      return;
    }

    const lineup = selectedLineup.length === startingBatters.length ? selectedLineup : startingBatters;
    const pitcherStaff = selectedPitchingStaff.length > 0 ? selectedPitchingStaff : bullpen.slice(0, 7);

    let currentRound = state.currentRound;
    let standings = [...state.standings];
    let players = [...state.allPlayersRegistry];
    let latest = { my: 0, opp: 0 };
    let latestMessage = matchMessage;
    const logs = [];

    const getLeagueTeamStrength = (teamName) => {
      const normalizedTeam = teamName.split(' ')[0];
      const teamPlayers = state.allPlayersRegistry.filter(
        (player) => player.team === teamName || player.team === normalizedTeam || player.team.includes(normalizedTeam)
      );
      if (teamPlayers.length === 0) return { offense: 55, pitching: 55 };
      return getTeamStrengthFromPlayers(teamPlayers);
    };

    for (let i = 0; i < roundCount && currentRound <= 144; i += 1) {
      const opponent = getOpponentForRound(currentRound);
      const userStrength = getTeamStrength(lineup, pitcherStaff);
      const opponentStrength = getLeagueTeamStrength(opponent);
      const myPower = userStrength.offense * 0.42 + userStrength.pitching * 0.38 + Math.random() * 7;
      const oppPower = opponentStrength.offense * 0.42 + opponentStrength.pitching * 0.38 + Math.random() * 7;
      const myScore = clampScore(myPower / 10 + Math.random() * 1.8);
      const oppScore = clampScore(oppPower / 10 + Math.random() * 1.8);
      const result = myScore > oppScore ? '승리' : myScore === oppScore ? '무승부' : '패배';
      const log = `${currentRound}라운드 vs ${opponent} — ${myScore}:${oppScore} (${result})`;

      standings = updateStandings(standings, state.userTeamName, opponent, result);
      players = applyPlayerGameUpdates(players, lineup, pitcherStaff, myScore, oppScore);
      latest = { my: myScore, opp: oppScore };
      latestMessage = `${result} ${myScore}:${oppScore} vs ${opponent}`;
      logs.unshift(log);

      const otherTeams = OPPONENT_ORDER.filter((team) => team !== state.userTeamName && team !== opponent);
      const pairs = buildOtherGamePairs(otherTeams);
      for (const [teamA, teamB] of pairs) {
        const teamAStrength = getLeagueTeamStrength(teamA);
        const teamBStrength = getLeagueTeamStrength(teamB);
        const scoreA = clampScore((teamAStrength.offense * 0.38 + teamAStrength.pitching * 0.35) / 10 + Math.random() * 3);
        const scoreB = clampScore((teamBStrength.offense * 0.38 + teamBStrength.pitching * 0.35) / 10 + Math.random() * 3);
        const pairResult = scoreA > scoreB ? '승리' : scoreA === scoreB ? '무승부' : '패배';
        standings = updateStandings(standings, teamA, teamB, pairResult);
        logs.unshift(`${currentRound}라운드 ${teamA} vs ${teamB} — ${scoreA}:${scoreB} (${pairResult})`);
      }

      currentRound += 1;
    }

    dispatch({ type: 'SET_STANDINGS', payload: standings });
    dispatch({ type: 'SET_ALL_PLAYERS', payload: players });
    dispatch({ type: 'SET_CURRENT_ROUND', payload: currentRound });
    setScore(latest);
    setMatchMessage(latestMessage);
    setLogLines((prev) => [...logs, ...prev].slice(0, 12));
  };

  return (
    <div>
      <h2>
        정규시즌 매치데이
        <span style={{ fontSize: '14px', color: '#aaa', fontWeight: 'normal' }}>
          Game {Math.min(state.currentRound, 145)} / 144
        </span>
      </h2>

      {seasonComplete ? (
        <div id="playoff-banner" className="playoff-banner">
          🍂 정규시즌 종료. 가을야구를 준비하세요.
        </div>
      ) : state.currentRound > 132 ? (
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
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ color: '#aaa', fontWeight: 'bold', fontSize: '14px' }}>오늘의 매치업</div>
          <div style={{ fontSize: '40px', fontWeight: '900', margin: '15px 0', letterSpacing: '2px', textAlign: 'center' }}>
            <span style={{ color: 'var(--accent)', fontSize: '24px' }}>내 구단</span> {score.my} : <span style={{ color: 'var(--danger)' }}>{score.opp}</span>{' '}
            <span style={{ fontSize: '24px' }}>상대팀</span>
          </div>
          <div id="match-status" style={{ fontSize: '16px', color: '#888', textAlign: 'center' }}>{matchMessage}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
          <button
            className="action-btn"
            type="button"
            onClick={() => setIsDirectMode((prev) => !prev)}
          >
            {isDirectMode ? '🔧 직접 감독 OFF' : '🎮 직접 감독 ON'}
          </button>
          <button className="action-btn fast" disabled={seasonComplete} onClick={() => simulate(1)}>
            ▶ 1경기 결과 보기 (빠른 시뮬)
          </button>
          <button className="action-btn fast" disabled={seasonComplete} onClick={() => simulate(10)}>
            ⏩ 10경기 쾌속 자동 진행
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px' }}>내 라인업</h3>
        {isDirectMode && (
          <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ marginBottom: '10px', color: '#eee' }}>직접 감독 모드에서는 타순과 선발투수를 직접 선택할 수 있습니다.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <h4>타순 조정</h4>
                <ol style={{ paddingLeft: '18px' }}>
                  {selectedLineup.length === 0 ? (
                    <li style={{ color: '#888' }}>선발 타자를 구성해주세요.</li>
                  ) : (
                    selectedLineup.map((player, index) => (
                      <li key={player.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <span>{index + 1}. {player.assignedPos || player.displayPos} - {player.name}</span>
                        <span>
                          <button
                            type="button"
                            disabled={index === 0}
                            style={{ marginRight: '6px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--panel)' }}
                            onClick={() => handleDirectOrderMove(index, -1)}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={index === selectedLineup.length - 1}
                            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--panel)' }}
                            onClick={() => handleDirectOrderMove(index, 1)}
                          >
                            ↓
                          </button>
                        </span>
                      </li>
                    ))
                  )}
                </ol>
              </div>
              <div>
                <h4>선발 투수 선택</h4>
                {bullpen.length === 0 ? (
                  <div style={{ color: '#888' }}>투수진을 구성해주세요.</div>
                ) : (
                  <select
                    value={startingPitcherId || ''}
                    onChange={(e) => setStartingPitcherId(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  >
                    {bullpen.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.assignedPos || player.displayPos} - {player.name}
                      </option>
                    ))}
                  </select>
                )}
                <div style={{ marginTop: '12px', color: '#aaa' }}>
                  현재 선발: {selectedPitcher ? `${selectedPitcher.assignedPos || selectedPitcher.displayPos} - ${selectedPitcher.name}` : '미정'}
                </div>
              </div>
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: 'var(--panel)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h4>선발 타순</h4>
            <ol style={{ paddingLeft: '18px' }}>
              {(isDirectMode ? selectedLineup : startingBatters).length === 0 ? (
                <li style={{ color: '#888' }}>선발 타자를 구성해주세요.</li>
              ) : (
                (isDirectMode ? selectedLineup : startingBatters).map((player, index) => (
                  <li key={player.id}>{index + 1}. {player.assignedPos || player.displayPos} - {player.name}</li>
                ))
              )}
            </ol>
          </div>
          <div style={{ background: 'var(--panel)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h4>투수진</h4>
            <ul style={{ paddingLeft: '18px' }}>
              {bullpen.length === 0 ? (
                <li style={{ color: '#888' }}>투수진을 구성해주세요.</li>
              ) : (
                bullpen.map((player) => (
                  <li key={player.id}>{player.assignedPos || player.displayPos} - {player.name}</li>
                ))
              )}
            </ul>
          </div>
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
