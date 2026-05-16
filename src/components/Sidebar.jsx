import React, { useState } from 'react';
import { useGameContext } from '../context/GameContext';

const Sidebar = ({ activeTab, onTabChange, onUploadCSV }) => {
  const { state } = useGameContext();
  const [uploadedData, setUploadedData] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target.result;
      if (typeof csvText === 'string') {
        onUploadCSV(csvText);
        setUploadedData(true);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const navButtons = [
    { id: 'tycoon', label: '🏦 구단 경영', className: 'tycoon-btn' },
    { id: 'league', label: '🏆 리그 순위표' },
    { id: 'stats', label: '🏅 개인 기록 순위' },
    { id: 'roster', label: '📋 1군 로스터' },
    { id: 'trade', label: '🔄 트레이드' },
    { id: 'market', label: '💰 이적 시장' },
    { id: 'match', label: '⚾ 정규시즌' },
  ];

  return (
    <div className="sidebar">
      <div className="brand">KBO MANAGER '26</div>

      <div className="manager-info">
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>단장 겸 감독</div>
        <div style={{ fontSize: '1.05rem', fontWeight: '800', marginTop: '6px' }}>김택진</div>
        <div
          id="my-team-name-display"
          style={{
            color: 'var(--accent)',
            fontSize: '0.95rem',
            fontWeight: '700',
            marginTop: '6px',
          }}
        >
          {state.userTeamName || '선택 전'}
        </div>
      </div>

      <div className="budget-box">
        <div className="budget-title">구단 잔여 예산</div>
        <div className="budget-amount">{Math.floor(state.budget)}억 원</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '6px' }}>
          선수단: <strong>{state.myTeam?.length || 0}</strong>/20 명
        </div>
      </div>

      {navButtons.map((btn) => (
        <button
          key={btn.id}
          className={`nav-btn ${btn.className || ''} ${activeTab === btn.id ? 'active' : ''}`}
          onClick={() => onTabChange(btn.id)}
        >
          {btn.label}
        </button>
      ))}

      <div className="upload-block">
        <button className="upload-btn">📁 CSV 데이터 업로드</button>
        <input type="file" accept=".csv" onChange={handleFileUpload} />
      </div>
      {uploadedData && <div className="upload-status">업로드된 CSV가 정상적으로 반영되었습니다.</div>}
    </div>
  );
};

export default Sidebar;
