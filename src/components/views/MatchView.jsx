import React from 'react';

const MatchView = () => {
  return (
    <div>
      <h2>
        정규시즌 매치데이{' '}
        <span style={{ fontSize: '14px', color: '#aaa', fontWeight: 'normal' }}>
          Game <span id="match-round">1</span> / 144
        </span>
      </h2>

      <div id="playoff-banner" className="playoff-banner">
        🏆 KBO 포스트시즌 진출! 🏆
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div
          style={{
            background: 'var(--panel)',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ color: '#aaa', fontWeight: 'bold', fontSize: '14px' }}>
            오늘의 매치업 <span style={{ color: 'var(--gold)', marginLeft: '10px' }}>-</span>
          </div>
          <div style={{ fontSize: '40px', fontWeight: '900', margin: '15px 0', letterSpacing: '2px' }}>
            <span style={{ color: 'var(--accent)', fontSize: '24px' }}>내 구단</span> 0 : <span style={{ color: 'var(--danger)' }}>0</span>{' '}
            <span style={{ fontSize: '24px' }}>상대팀</span>
          </div>
          <div id="match-status" style={{ fontSize: '16px', color: '#888' }}>
            플레이볼 대기 중
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
          <button className="action-btn" disabled>
            🎮 개입 모드 (직접 감독)
          </button>
          <button className="action-btn fast" disabled>
            ▶ 1경기 결과 보기 (빠른 시뮬)
          </button>
          <button className="action-btn fast" disabled>
            ⏩ 10경기 쾌속 자동 진행
          </button>
        </div>
      </div>

      <div className="relay-log" id="relay-log" style={{ marginTop: '20px' }}>
        <div style={{ color: '#888' }}>경기 로그가 여기에 표시됩니다.</div>
      </div>
    </div>
  );
};

export default MatchView;
