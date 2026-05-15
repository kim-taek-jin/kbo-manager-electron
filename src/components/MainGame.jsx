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
    const lines = csvText.trim().split(/\r?\n/).filter((line) => line.trim().length > 0);
    const players = [];
    let idCount = 1;

    for (let i = 1; i < lines.length; i += 1) {
      const cols = lines[i].split(',').map((col) => col.trim());
      if (cols.length < 4 || !cols[1]) continue;

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
        const era = parseFloat(cols[3]) || 4.5;
        const ip = parseFloat(cols[5]) || 0;
        const bb = parseInt(cols[8], 10) || 0;
        const so = parseInt(cols[10], 10) || 0;

        contact = Math.min(99, Math.max(55, Math.floor(74 - (era - 3.5) * 5 + Math.random() * 5)));
        power = Math.min(99, Math.max(55, Math.floor(70 - (era - 3.5) * 3 + Math.random() * 6)));
        eye = Math.min(99, Math.max(55, Math.floor(68 - bb * 0.8 + so * 0.2 + Math.random() * 4)));
        salary = Math.max(3, Math.floor(6 + ip / 45));
      } else {
        const avg = parseFloat(cols[3]) || 0;
        const pa = parseInt(cols[4], 10) || 0;
        const ab = parseInt(cols[5], 10) || 0;
        const h = parseInt(cols[7], 10) || 0;
        const hr = parseInt(cols[10], 10) || 0;
        const tb = parseInt(cols[12], 10) || 0;

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
