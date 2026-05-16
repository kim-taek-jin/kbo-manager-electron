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

const MainGame = () => {
  // eslint-disable-next-line no-unused-vars
  const { state, dispatch } = useGameContext();
  const [activeTab, setActiveTab] = useState('roster');
  const [csvStatus, setCsvStatus] = useState('CSV 데이터 로드 중...');

  const parsePositions = (rawPos, isPitcher) => {
    if (isPitcher) return ['SP', 'RP', 'CP'];

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

  const parseCSVData = useCallback((csvText, source = '기본') => {
    const rawLines = csvText.split(/\r?\n/);
    // Find the first non-empty header line
    let headerIndex = -1;
    for (let i = 0; i < rawLines.length; i += 1) {
      if (rawLines[i] && rawLines[i].trim().length > 0) {
        const first = rawLines[i].split(',')[0].trim().toLowerCase();
        if (first === '포지션' || first === 'position' || first === '포지션') {
          headerIndex = i;
          break;
        }
      }
    }

    if (headerIndex === -1) {
      setCsvStatus('CSV 형식 오류: 헤더를 찾을 수 없습니다.');
      return;
    }

    const headerLine = rawLines[headerIndex];
    const headers = headerLine.split(',').map((h) => h.trim().toLowerCase());
    const idx = (name) => headers.findIndex((h) => h.includes(name));

    const avgIdx = idx('avg');
    const paIdx = idx('pa');
    const abIdx = idx('ab');
    const hIdx = idx('h');
    const hrIdx = idx('hr');
    const tbIdx = idx('tb');

    const players = [];
    let idCount = 1;

    for (let i = headerIndex + 1; i < rawLines.length; i += 1) {
      const line = rawLines[i];
      if (!line || line.trim().length === 0) continue;
      const cols = line.split(',').map((c) => c.trim());
      const firstCol = (cols[0] || '').toLowerCase();
      if (firstCol === '포지션' || firstCol === 'position') continue; // skip repeated headers

      if (!cols[1]) continue;

      const rawPos = cols[0] || '';
      const name = cols[1] || '';
      const team = cols[2] || '무소속';
      const isPitcher = rawPos.includes('투수');

      let contact = 60;
      let power = 60;
      let eye = 60;
      let salary = 5;
      let s_ab = 0;
      let s_h = 0;
      let s_hr = 0;

      if (isPitcher) {
        // minimal fallback for pitchers
        const era = parseFloat(cols[avgIdx]) || 4.5;
        const ip = parseFloat(cols[paIdx]) || 0;
        const bb = parseInt(cols[abIdx], 10) || 0;
        const so = parseInt(cols[hIdx], 10) || 0;

        contact = Math.min(99, Math.max(55, Math.floor(74 - (era - 3.5) * 5 + Math.random() * 5)));
        power = Math.min(99, Math.max(55, Math.floor(70 - (era - 3.5) * 3 + Math.random() * 6)));
        eye = Math.min(99, Math.max(55, Math.floor(68 - bb * 0.8 + so * 0.2 + Math.random() * 4)));
        salary = Math.max(3, Math.floor(6 + ip / 45));
      } else {
        const avg = avgIdx >= 0 ? parseFloat(cols[avgIdx]) : 0;
        const pa = paIdx >= 0 ? parseInt(cols[paIdx], 10) : 0;
        const ab = abIdx >= 0 ? parseInt(cols[abIdx], 10) : 0;
        const h = hIdx >= 0 ? parseInt(cols[hIdx], 10) : 0;
        const hr = hrIdx >= 0 ? parseInt(cols[hrIdx], 10) : 0;
        const tb = tbIdx >= 0 ? parseInt(cols[tbIdx], 10) : 0;

        contact = Math.min(99, Math.max(40, Math.floor(42 + avg * 140)));
        power = Math.min(99, Math.max(40, Math.floor(40 + ((tb - h) / (ab || 1)) * 150)));
        eye = Math.min(99, Math.max(40, Math.floor(40 + ((pa - ab) / (pa || 1)) * 200)));
        salary = Math.max(3, Math.floor(4 + avg * 20 + Math.random() * 4));
        s_ab = ab;
        s_h = h;
        s_hr = hr;
      }

      const total = contact + power + eye;
      let tier = 'C';
      if (total >= 235) tier = 'S';
      else if (total >= 200) tier = 'A';
      else if (total >= 170) tier = 'B';

      players.push({
        id: idCount,
        team,
        displayPos: rawPos || '지명타자',
        caps: parsePositions(rawPos, isPitcher),
        assignedPos: null,
        name,
        contact,
        power,
        eye,
        tier,
        salary,
        status: 'BENCH',
        isPitcher,
        s_ab,
        s_h,
        s_hr,
        fatigue: 100,
        recentForm: [],
      });
      idCount += 1;
    }

    dispatch({ type: 'SET_ALL_PLAYERS', payload: players });
    setCsvStatus(`${source} CSV 데이터 로드 완료 · 총 ${players.length}명`);
  }, [dispatch, setCsvStatus]);

  useEffect(() => {
    const loadKBOData = async () => {
      try {
        const response = await fetch('/kbo_2025_players.csv');
        const csvText = await response.text();
        parseCSVData(csvText, '기본');
      } catch (error) {
        console.error('CSV 로드 실패:', error);
        setCsvStatus('CSV 로드에 실패했습니다. 파일을 업로드해주세요.');
      }
    };

    loadKBOData();
  }, [parseCSVData]);

  const handleCSVUpload = (csvText) => {
    parseCSVData(csvText, '업로드된');
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
        return <RosterView />;
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
