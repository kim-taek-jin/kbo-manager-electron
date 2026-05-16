import React, { useState, useEffect, useCallback } from 'react';
import { useGameContext } from '../context/GameContext';
import Sidebar from './Sidebar';
import RosterView from './views/RosterView';
import TycoonView from './views/TycoonView';
import LeagueView from './views/LeagueView';
import StatsView from './views/StatsView';
import TradeView from './views/TradeView';
import MarketView from './views/MarketView';
import MatchView from './views/MatchView';

const parsePositions = (rawPos, isPitcher) => {
  if (isPitcher) {
    const normalized = rawPos.toUpperCase();
    const isSP = normalized.includes('SP') || normalized.includes('선발');
    const isCP = normalized.includes('CP') || normalized.includes('클로저') || normalized.includes('마무리');
    const isRP = normalized.includes('RP') || normalized.includes('중간');

    if (isSP) return ['SP', 'RP'];
    if (isCP) return ['CP', 'RP'];
    if (isRP) return ['RP', 'CP'];
    return ['SP', 'RP', 'CP'];
  }

  const caps = [];
  if (rawPos.includes('포수') || rawPos.includes('C')) caps.push('C');
  if (rawPos.includes('1루수') || rawPos.includes('1B')) caps.push('1B');
  if (rawPos.includes('2루수') || rawPos.includes('2B')) caps.push('2B');
  if (rawPos.includes('3루수') || rawPos.includes('3B')) caps.push('3B');
  if (rawPos.includes('유격수') || rawPos.includes('SS')) caps.push('SS');
  if (rawPos.includes('좌익수') || rawPos.includes('LF')) caps.push('LF');
  if (rawPos.includes('중견수') || rawPos.includes('CF')) caps.push('CF');
  if (rawPos.includes('우익수') || rawPos.includes('RF')) caps.push('RF');
  if (rawPos.includes('DH') || rawPos.includes('지명')) caps.push('DH');

  return caps.length > 0 ? caps : ['DH'];
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
      selectedBatters.push({ ...player, assignedPos: player.caps[0] || 'DH' });
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
      });
      selectedIds.add(player.id);
    });

  const roster = [...selectedBatters.slice(0, 9), ...selectedPitchers.slice(0, 11)];
  const remainder = teamPlayers.filter((player) => !selectedIds.has(player.id));
  return roster
    .concat(
      remainder
        .slice(0, Math.max(0, 20 - roster.length))
        .map((player) => ({ ...player, assignedPos: player.caps[0] || (player.isPitcher ? 'RP' : 'DH') }))
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
    selectedBatters.push({ ...player, assignedPos: player.caps[0] || 'DH' });
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
    selectedPitchers.push({ ...player, assignedPos: player.caps.includes('RP') ? 'RP' : player.caps[0] || 'RP' });
    selectedIds.add(player.id);
  });

  return [...selectedBatters.slice(0, 9), ...selectedPitchers.slice(0, 11)];
};

const buildPlayerFromRow = (cols, header) => {
  const rawPos = (getHeaderValue(cols, header, ['position', 'pos', '포지션']) || cols[0] || '').trim();
  const name = (getHeaderValue(cols, header, ['name', 'player', '선수명']) || cols[1] || '').trim();
  const team = (getHeaderValue(cols, header, ['team', 'club', '소속팀', '소속']) || cols[2] || '무소속').trim();
  if (!name) return null;

  const isPitcher = rawPos.includes('투수') || rawPos.toUpperCase().includes('SP') || rawPos.toUpperCase().includes('RP') || rawPos.toUpperCase().includes('CP');
  const games =
    parseInt(getHeaderValue(cols, header, ['g', 'games']), 10) ||
    parseInt(getHeaderValue(cols, header, ['gs', 'games started']), 10) ||
    0;
  const salaryBase = Math.max(3, Math.floor(4 + games * 0.05));

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
    games,
    overall: 0,
    stats: {},
  };

  if (isPitcher) {
    const era = parseFloat(cols[header.index(['era'])]) || 5.0;
    const ip = parseFloat(cols[header.index(['ip'])]) || 0;
    const so = parseInt(cols[header.index(['so', 'strikeouts'])], 10) || 0;
    const bb = parseInt(cols[header.index(['bb', 'walks'])], 10) || 0;
    const whip = parseFloat(cols[header.index(['whip'])]) || Math.max(1.0, bb / (ip || 1));
    const wpct = parseFloat(cols[header.index(['wpct', 'winningpercentage'])]) || 0;
    const sv = parseInt(cols[header.index(['sv', 'saves'])], 10) || 0;
    const hld = parseInt(cols[header.index(['hld', 'holds'])], 10) || 0;

    player.stats = { era, ip, so, bb, whip, wpct, sv, hld, games };
    player.estimatedWAR = estimatePitcherWAR({ era, whip, so, wpct, sv, hld, games });
    player.salary = Math.max(salaryBase, Math.floor(5 + ip / 30 + player.estimatedWAR * 0.8));
    player.contact = clamp(Math.floor(78 - (era - 3.6) * 4 + wpct * 8 + player.estimatedWAR * 1.1), 55, 99);
    player.power = clamp(Math.floor(72 - (era - 3.6) * 3 + (2 - whip) * 9 + player.estimatedWAR * 0.9), 55, 99);
    player.eye = clamp(Math.floor(70 - whip * 4 + wpct * 11 + (sv + hld) * 1.5 + player.estimatedWAR * 0.8), 55, 99);
    player.overall = clamp(Math.round((player.contact * 0.35 + player.power * 0.3 + player.eye * 0.35)), 40, 99);
    player.tier = player.overall >= 90 ? 'S' : player.overall >= 80 ? 'A' : player.overall >= 70 ? 'B' : 'C';
  } else {
    const avg = parseFloat(cols[header.index(['avg', 'battingaverage'])]) || 0;
    const pa = parseInt(cols[header.index(['pa', 'plateappearances'])], 10) || 0;
    const ab = parseInt(cols[header.index(['ab', 'atbats'])], 10) || 0;
    const h = parseInt(cols[header.index(['h', 'hits'])], 10) || 0;
    const hr = parseInt(cols[header.index(['hr', 'home runs'])], 10) || 0;
    const tb = parseInt(cols[header.index(['tb', 'totalbases'])], 10) || 0;
    const rbi = parseInt(cols[header.index(['rbi', 'runsbattedin'])], 10) || 0;
    const war = parseFloat(cols[header.index(['war'])]) || estimateBatterWAR({ avg, games, hr, rbi });

    player.stats = { avg, pa, ab, h, hr, tb, rbi, games, war };
    player.estimatedWAR = war;
    player.salary = Math.max(salaryBase, Math.floor(4 + avg * 18 + games * 0.03 + war * 1.2));
    player.contact = clamp(Math.floor(45 + avg * 130 + war * 1.5), 40, 99);
    player.power = clamp(Math.floor(38 + ((tb - h) / (ab || 1)) * 155 + hr * 1.8 + war * 0.8), 40, 99);
    player.eye = clamp(Math.floor(35 + ((pa - ab) / (pa || 1)) * 180 + games * 0.1 + war * 0.9), 40, 99);
    player.overall = clamp(Math.round((player.contact * 0.35 + player.power * 0.35 + player.eye * 0.3)), 40, 99);
    player.tier = player.overall >= 90 ? 'S' : player.overall >= 80 ? 'A' : player.overall >= 70 ? 'B' : 'C';
    player.s_ab = ab;
    player.s_h = h;
    player.s_hr = hr;
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
        const players = [...batterPlayers, ...pitcherPlayers];

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
      dispatch({ type: 'SET_ALL_PLAYERS', payload: players });
      if (state.userTeamName) {
        dispatch({ type: 'SET_MY_TEAM', payload: buildTeamRoster(players, state.userTeamName) });
      } else {
        dispatch({ type: 'SET_MY_TEAM', payload: buildAutoTeam(players) });
      }
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
