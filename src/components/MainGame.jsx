import React, { useState, useEffect, useCallback } from 'react';
import { useGameContext } from '../context/GameContext';
import Sidebar from './Sidebar';
import RosterView from './views/RosterView';
import TacticsView from './views/TacticsView';
import TycoonView from './views/TycoonView';
import LeagueView from './views/LeagueView';
import StatsView from './views/StatsView';
import TradeView from './views/TradeView';
import MarketView from './views/MarketView';
import MatchView from './views/MatchView';

const parsePositions = (rawPos, isPitcher) => {
  if (isPitcher) {
    const normalized = rawPos.toUpperCase();
    if (/SP|선발/.test(normalized)) return ['SP', 'RP'];
    if (/CP|클로저|마무리/.test(normalized)) return ['CP', 'RP'];
    if (/RP|중간/.test(normalized)) return ['RP', 'CP'];
    return ['SP', 'RP', 'CP'];
  }

  const caps = [];
  const normalized = (rawPos || '').toUpperCase();

  // 개별 포지션
  if (/포수|^C$/i.test(normalized)) caps.push('C');
  if (/1루|1B/i.test(normalized)) caps.push('1B');
  if (/2루|2B/i.test(normalized)) caps.push('2B');
  if (/3루|3B/i.test(normalized)) caps.push('3B');
  if (/유격|SS/i.test(normalized)) caps.push('SS');
  if (/좌익|LF/i.test(normalized)) caps.push('LF');
  if (/중견|CF/i.test(normalized)) caps.push('CF');
  if (/우익|RF/i.test(normalized)) caps.push('RF');
  if (/DH|지명/i.test(normalized)) caps.push('DH');

  // 내야수 (IF) → 1B, 2B, 3B, SS만 가능
  if (/내야수|내야|^IF$|^INF$/i.test(normalized)) {
    const infield = ['1B', '2B', '3B', 'SS'];
    infield.forEach((pos) => {
      if (!caps.includes(pos)) caps.push(pos);
    });
  }

  // 외야수 (OF) → LF, CF, RF만 가능
  if (/외야수|외야|^OF$/i.test(normalized)) {
    const outfield = ['LF', 'CF', 'RF'];
    outfield.forEach((pos) => {
      if (!caps.includes(pos)) caps.push(pos);
    });
  }

  // 유틸 (UT) → 모든 포지션
  if (/유틸|^UT$/.test(lower) && caps.length === 0) {
    return ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
  }

  return caps.length > 0 ? [...new Set(caps)] : ['DH'];
};

const splitCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
};

const isHeaderLine = (line) => {
  const columns = splitCSVLine(line).map((cell) => cell.trim().toLowerCase());
  const headerIndicators = [
    'position',
    'pos',
    '포지션',
    '선수명',
    'name',
    'team',
    'club',
    '소속',
    'avg',
    'era',
    'ip',
    'g',
    'games',
  ];
  return columns.some((value) => headerIndicators.some((indicator) => value.includes(indicator)));
};

const buildHeaderMap = (headerLine) => {
  const headers = splitCSVLine(headerLine).map((h) => h.trim().toLowerCase());
  return {
    headerNames: headers,
    index: (names) => {
      const lowerNames = names.map((name) => name.toLowerCase());
      let idx = headers.findIndex((header) => lowerNames.includes(header));
      if (idx >= 0) return idx;
      idx = headers.findIndex((header) => lowerNames.some((name) => header.includes(name)));
      return idx;
    },
  };
};

const getHeaderValue = (cols, header, names) => {
  const idx = header.index(names);
  return idx >= 0 && idx < cols.length ? cols[idx] : '';
};

const parseInnings = (ipValue) => {
  if (!ipValue || ipValue.trim().length === 0) return 0;
  if (typeof ipValue === 'number') return ipValue;
  const trimmed = ipValue.trim();
  if (trimmed.includes('/')) {
    const [whole, fraction] = trimmed.split('/').map((part) => part.trim());
    const wholeNum = parseInt(whole, 10) || 0;
    const fracNum = parseInt(fraction, 10) || 0;
    return wholeNum + fracNum / 3;
  }
  return parseFloat(trimmed) || 0;
};

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

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const estimateBatterWAR = ({ avg, games, hr, rbi }) => {
  const base = avg * 12 + hr * 0.2 + rbi * 0.08;
  const gameWeight = Math.min(1, games / 140);
  return Math.max(0, Math.round(base * gameWeight * 10) / 10);
};

const estimatePitcherWAR = ({ era, whip, so, wpct, sv, hld, games }) => {
  const rawScore = (3.8 - era) * 1.8 + (1.5 - whip) * 3 + so * 0.08 + wpct * 8 + (sv + hld) * 0.25;
  const gameWeight = Math.min(1, games / 50);
  return Math.max(0, Math.round(rawScore * gameWeight * 10) / 10);
};

const sortByOverall = (players) => players.slice().sort((a, b) => b.overall - a.overall);

const getTeamShortName = (teamName) => TEAM_SHORT_MAP[teamName] || teamName;

const assignPlayerIds = (players) =>
  players.map((player, index) => ({ ...player, id: index + 1 }));

const mergePlayers = (existing, incoming) => {
  const merged = [...incoming];
  existing.forEach((player) => {
    const duplicate = incoming.some(
      (incomingPlayer) =>
        incomingPlayer.name === player.name &&
        incomingPlayer.team === player.team &&
        incomingPlayer.isPitcher === player.isPitcher
    );
    if (!duplicate) merged.push(player);
  });
  return assignPlayerIds(merged);
};

const buildTeamRoster = (players, teamName) => {
  const teamKey = getTeamShortName(teamName);
  const teamPlayers = players.filter(
    (player) => player.team === teamKey || player.team === teamName
  );
  if (teamPlayers.length === 0) {
    return buildAutoTeam(players);
  }

  const batters = teamPlayers.filter((player) => !player.isPitcher).sort((a, b) => b.overall - a.overall);
  const pitchers = teamPlayers.filter((player) => player.isPitcher).sort((a, b) => b.overall - a.overall);
  const selectedBatters = [];
  const selectedIds = new Set();
  const batterPositions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

  batterPositions.forEach((pos) => {
    const best = batters.find((player) => !selectedIds.has(player.id) && player.caps.includes(pos));
    if (best) {
      selectedBatters.push({ ...best, assignedPos: pos });
      selectedIds.add(best.id);
    }
  });

  batters
    .filter((player) => !selectedIds.has(player.id))
    .slice(0, Math.max(0, 9 - selectedBatters.length))
    .forEach((player) => {
      const defaultPos = player.caps.length > 0 ? player.caps[0] : 'DH';
      selectedBatters.push({ ...player, assignedPos: defaultPos, status: 'STARTER' });
      selectedIds.add(player.id);
    });

  const selectedPitchers = [];
  const choosePitchers = (desired, fallback, count) => {
    const candidates = pitchers.filter(
      (player) =>
        !selectedIds.has(player.id) &&
        player.caps.some((cap) => [desired, ...fallback].includes(cap))
    );
    candidates.slice(0, count).forEach((player) => {
      const assigned = player.caps.includes(desired)
        ? desired
        : player.caps.find((cap) => fallback.includes(cap)) || desired;
      selectedPitchers.push({ ...player, assignedPos: assigned });
      selectedIds.add(player.id);
    });
  };

  choosePitchers('SP', ['RP', 'CP'], 5);
  choosePitchers('CP', ['RP'], 1);
  choosePitchers('RP', ['CP'], 5);

  pitchers
    .filter((player) => !selectedIds.has(player.id))
    .slice(0, Math.max(0, 11 - selectedPitchers.length))
    .forEach((player) => {
      selectedPitchers.push({
        ...player,
        assignedPos: player.caps.includes('RP') ? 'RP' : player.caps[0] || 'SP',
        status: 'STARTER',
      });
      selectedIds.add(player.id);
    });

  const roster = [...selectedBatters.slice(0, 9), ...selectedPitchers.slice(0, 11)];
  const remainder = teamPlayers.filter((player) => !selectedIds.has(player.id));
  return roster
    .concat(
      remainder
        .slice(0, Math.max(0, 20 - roster.length))
        .map((player) => {
          const defaultPos = player.isPitcher
            ? (player.caps.length > 0 ? player.caps[0] : 'RP')
            : (player.caps.length > 0 ? player.caps[0] : 'DH');
          return {
            ...player,
            assignedPos: defaultPos,
            status: 'BENCH',
          };
        })
    )
    .slice(0, 20);
};

const buildAutoTeam = (players) => {
  const batters = players.filter((player) => !player.isPitcher);
  const pitchers = players.filter((player) => player.isPitcher);

  const selectBestByPosition = (list, position) =>
    list
      .filter((player) => player.caps.includes(position))
      .sort((a, b) => b.overall - a.overall)[0];

  const selectedBatters = [];
  const selectedIds = new Set();
  const batterPositions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

  batterPositions.forEach((pos) => {
    const best = selectBestByPosition(batters, pos);
    if (best && !selectedIds.has(best.id)) {
      selectedBatters.push({ ...best, assignedPos: pos });
      selectedIds.add(best.id);
    }
  });

  const remainingBatters = sortByOverall(batters).filter((player) => !selectedIds.has(player.id));
  remainingBatters.slice(0, Math.max(0, 9 - selectedBatters.length)).forEach((player) => {
    const defaultPos = player.caps.length > 0 ? player.caps[0] : 'DH';
    selectedBatters.push({ ...player, assignedPos: defaultPos, status: 'STARTER' });
    selectedIds.add(player.id);
  });

  const selectedPitchers = [];
  const choosePitchers = (desired, fallbackSlots, count) => {
    const candidates = sortByOverall(pitchers).filter(
      (player) => !selectedIds.has(player.id) && player.caps.some((cap) => [desired, ...fallbackSlots].includes(cap))
    );
    candidates.slice(0, count).forEach((player) => {
      const assigned = player.caps.includes(desired) ? desired : player.caps.find((cap) => [desired, ...fallbackSlots].includes(cap));
      selectedPitchers.push({ ...player, assignedPos: assigned || desired });
      selectedIds.add(player.id);
    });
  };

  choosePitchers('SP', ['SP'], 5);
  choosePitchers('CP', ['RP'], 1);
  choosePitchers('RP', ['CP'], 5);

  const remainingPitchers = sortByOverall(pitchers).filter((player) => !selectedIds.has(player.id));
  remainingPitchers.slice(0, Math.max(0, 11 - selectedPitchers.length)).forEach((player) => {
    const defaultPos = player.caps.length > 0 ? player.caps[0] : 'RP';
    selectedPitchers.push({
      ...player,
      assignedPos: defaultPos,
      status: 'STARTER',
    });
    selectedIds.add(player.id);
  });

  const roster = [...selectedBatters.slice(0, 9), ...selectedPitchers.slice(0, 11)];
  const leftovers = [...players].filter((player) => !selectedIds.has(player.id));
  return roster.concat(
    leftovers
      .slice(0, Math.max(0, 20 - roster.length))
      .map((player) => {
        const defaultPos = player.isPitcher
          ? (player.caps.length > 0 ? player.caps[0] : 'RP')
          : (player.caps.length > 0 ? player.caps[0] : 'DH');
        return {
          ...player,
          assignedPos: defaultPos,
          status: 'BENCH',
        };
      })
  );
};

const buildPlayerFromRow = (cols, header) => {
  const rawPos = (getHeaderValue(cols, header, ['position', 'pos', '포지션']) || cols[0] || '').trim();
  const name = (getHeaderValue(cols, header, ['name', 'player', '선수명']) || cols[1] || '').trim();
  const team = (getHeaderValue(cols, header, ['team', 'club', '팀명', '소속팀', '소속']) || cols[2] || '무소속').trim();
  if (!name) return null;

  const isPitcher = rawPos.includes('투수') || rawPos.toUpperCase().includes('SP') || rawPos.toUpperCase().includes('RP') || rawPos.toUpperCase().includes('CP');
  const gamesPlayed =
    parseInt(getHeaderValue(cols, header, ['g', 'games', 'G']), 10) ||
    parseInt(getHeaderValue(cols, header, ['gs', 'games started']), 10) ||
    0;
  const salaryBase = Math.max(3, Math.floor(4 + gamesPlayed * 0.05));

  const player = {
    team,
    displayPos: rawPos || (isPitcher ? '투수' : '지명타자'),
    caps: parsePositions(rawPos, isPitcher),
    assignedPos: null,
    name,
    status: 'BENCH',
    isPitcher,
    fatigue: 100,
    recentForm: [],
    estimatedWAR: 0,
    overall: 0,
    stats: {},
  };

  if (isPitcher) {
    const era = parseFloat(getHeaderValue(cols, header, ['era'])) || 5.0;
    const ip = parseInnings(getHeaderValue(cols, header, ['ip', 'innings'])) || 0;
    const so = parseInt(getHeaderValue(cols, header, ['so', 'strikeouts']), 10) || 0;
    const bb = parseInt(getHeaderValue(cols, header, ['bb', 'walks']), 10) || 0;
    const whip = parseFloat(getHeaderValue(cols, header, ['whip'])) || Math.max(1.0, bb / (ip || 1));
    const wpct = parseFloat(getHeaderValue(cols, header, ['wpct', 'winningpercentage'])) || 0;
    const sv = parseInt(getHeaderValue(cols, header, ['sv', 'saves']), 10) || 0;
    const hld = parseInt(getHeaderValue(cols, header, ['hld', 'holds']), 10) || 0;
    const warScore = estimatePitcherWAR({ era, whip, so, wpct, sv, hld, games: gamesPlayed });

    player.stats = { games: 0, ip: 0, so: 0, bb: 0 };
    player.estimatedWAR = warScore;
    player.salary = Math.max(salaryBase, Math.floor(5 + ip / 30 + warScore * 0.8));
    player.contact = clamp(Math.floor(78 - (era - 3.6) * 4 + wpct * 8 + warScore * 1.1), 55, 99);
    player.power = clamp(Math.floor(72 - (era - 3.6) * 3 + (2 - whip) * 9 + warScore * 0.9), 55, 99);
    player.eye = clamp(Math.floor(70 - whip * 4 + wpct * 11 + (sv + hld) * 1.5 + warScore * 0.8), 55, 99);
    player.overall = clamp(Math.round((player.contact * 0.35 + player.power * 0.3 + player.eye * 0.35)), 40, 99);
    player.tier = player.overall >= 90 ? 'S' : player.overall >= 80 ? 'A' : player.overall >= 70 ? 'B' : 'C';
  } else {
    const avg = parseFloat(getHeaderValue(cols, header, ['avg', 'battingaverage', 'average'])) || 0;
    const pa = parseInt(getHeaderValue(cols, header, ['pa', 'plateappearances', 'plate appearances']), 10) || 0;
    const ab = parseInt(getHeaderValue(cols, header, ['ab', 'atbats', 'at bats']), 10) || 0;
    const h = parseInt(getHeaderValue(cols, header, ['h', 'hits']), 10) || 0;
    const hr = parseInt(getHeaderValue(cols, header, ['hr', 'home runs', 'home run', '홈런']), 10) || 0;
    const tb = parseInt(getHeaderValue(cols, header, ['tb', 'totalbases', 'total bases']), 10) || 0;
    const rbi = parseInt(getHeaderValue(cols, header, ['rbi', 'runsbattedin', 'runs batted in']), 10) || 0;
    const warScore = estimateBatterWAR({ avg, games: gamesPlayed, hr, rbi });

    player.stats = { games: 0, pa: 0, ab: 0, h: 0, hr: 0, rbi: 0, tb: 0, bb: 0 };
    player.estimatedWAR = warScore;
    player.salary = Math.max(salaryBase, Math.floor(4 + avg * 18 + gamesPlayed * 0.03 + warScore * 1.2));
    player.contact = clamp(Math.floor(45 + avg * 130 + warScore * 1.5), 40, 99);
    player.power = clamp(Math.floor(38 + ((tb - h) / (ab || 1)) * 155 + hr * 1.8 + warScore * 0.8), 40, 99);
    player.eye = clamp(Math.floor(35 + ((pa - ab) / (pa || 1)) * 180 + gamesPlayed * 0.1 + warScore * 0.9), 40, 99);
    player.overall = clamp(Math.round((player.contact * 0.35 + player.power * 0.35 + player.eye * 0.3)), 40, 99);
    player.tier = player.overall >= 90 ? 'S' : player.overall >= 80 ? 'A' : player.overall >= 70 ? 'B' : 'C';
  }

  return player;
};

const MainGame = () => {
  // eslint-disable-next-line no-unused-vars
  const { state, dispatch } = useGameContext();
  const [activeTab, setActiveTab] = useState('roster');
  const [csvStatus, setCsvStatus] = useState('CSV 데이터 로드 중...');

  const parseCSVData = useCallback((csvText, source = '기본') => {
    const rawLines = csvText.split(/\r?\n/);
    let headerIndex = -1;
    for (let i = 0; i < rawLines.length; i += 1) {
      if (rawLines[i] && rawLines[i].trim().length > 0 && isHeaderLine(rawLines[i])) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      setCsvStatus('CSV 형식 오류: 헤더를 찾을 수 없습니다.');
      return [];
    }

    const header = buildHeaderMap(rawLines[headerIndex]);
    const players = [];
    let idCount = 1;

    for (let i = headerIndex + 1; i < rawLines.length; i += 1) {
      const line = rawLines[i];
      if (!line || line.trim().length === 0 || isHeaderLine(line)) continue;
      const cols = splitCSVLine(line).map((c) => c.trim());
      const player = buildPlayerFromRow(cols, header);
      if (!player) continue;
      player.id = idCount;
      players.push(player);
      idCount += 1;
    }

    if (players.length === 0) {
      setCsvStatus(`${source} CSV에서 유효한 선수 데이터를 찾을 수 없습니다.`);
      return [];
    }

    setCsvStatus(`${source} CSV 데이터 파싱 완료 · ${players.length}명`);
    return players;
  }, []);

  useEffect(() => {
    const loadKBOData = async () => {
      try {
        const [battersResponse, pitchersResponse] = await Promise.all([
          fetch('/kbo_2025_players.csv'),
          fetch('/kbo_2025_pitchers.csv'),
        ]);
        const [battersText, pitchersText] = await Promise.all([
          battersResponse.text(),
          pitchersResponse.text(),
        ]);

        const batterPlayers = parseCSVData(battersText, '기본 타자');
        const pitcherPlayers = parseCSVData(pitchersText, '기본 투수');
        const players = assignPlayerIds([...batterPlayers, ...pitcherPlayers]);

        dispatch({ type: 'SET_ALL_PLAYERS', payload: players });
        setCsvStatus(`기본 CSV 데이터 로드 완료 · 총 ${players.length}명 (${batterPlayers.length} 타자, ${pitcherPlayers.length} 투수)`);
      } catch (error) {
        console.error('CSV 로드 실패:', error);
        setCsvStatus('CSV 로드에 실패했습니다. 파일을 업로드해주세요.');
      }
    };

    loadKBOData();
  }, [dispatch, parseCSVData]);

  useEffect(() => {
    if (state.allPlayersRegistry.length > 0 && state.myTeam.length === 0) {
      if (state.userTeamName) {
        dispatch({ type: 'SET_MY_TEAM', payload: buildTeamRoster(state.allPlayersRegistry, state.userTeamName) });
      } else {
        dispatch({ type: 'SET_MY_TEAM', payload: buildAutoTeam(state.allPlayersRegistry) });
      }
    }
  }, [dispatch, state.allPlayersRegistry, state.myTeam.length, state.userTeamName]);

  const handleCSVUpload = (csvText) => {
    const players = parseCSVData(csvText, '업로드된');
    if (players.length > 0) {
      const mergedPlayers = state.allPlayersRegistry.length > 0 ? mergePlayers(state.allPlayersRegistry, players) : assignPlayerIds(players);
      dispatch({ type: 'SET_ALL_PLAYERS', payload: mergedPlayers });
      if (state.userTeamName) {
        dispatch({ type: 'SET_MY_TEAM', payload: buildTeamRoster(mergedPlayers, state.userTeamName) });
      } else {
        dispatch({ type: 'SET_MY_TEAM', payload: buildAutoTeam(mergedPlayers) });
      }
      setCsvStatus(`업로드된 CSV 데이터 반영 완료 · 총 ${mergedPlayers.length}명`);
    }
  };

  const handleAutoLineup = () => {
    if (state.userTeamName) {
      dispatch({ type: 'SET_MY_TEAM', payload: buildTeamRoster(state.allPlayersRegistry, state.userTeamName) });
    } else {
      dispatch({ type: 'SET_MY_TEAM', payload: buildAutoTeam(state.allPlayersRegistry) });
    }
  };

  const renderView = () => {
    switch (activeTab) {
      case 'tycoon':
        return <TycoonView />;
      case 'league':
        return <LeagueView />;
      case 'stats':
        return <StatsView />;
      case 'roster':
        return <RosterView onAutoLineup={handleAutoLineup} />;
      case 'tactics':
        return <TacticsView />;
      case 'trade':
        return <TradeView />;
      case 'market':
        return <MarketView />;
      case 'match':
        return <MatchView />;
      default:
        return <RosterView />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onUploadCSV={handleCSVUpload} />
      <div className="main-content">
        <div className="page-header">
          <h2>대시보드</h2>
          <div className="csv-status">{csvStatus}</div>
        </div>
        {renderView()}
      </div>
    </div>
  );
};

export default MainGame;
