import React from 'react';

const TycoonView = () => {
  return (
    <div>
      <h2>구단 재정 및 인프라 관리</h2>
      <p style={{ color: '#aaa' }}>경기를 진행하여 수익을 창출하세요.</p>
      <div className="tycoon-dashboard">
        <div className="finance-card">
          <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>📊 재정 요약</h3>
          <p>구단 재정 데이터 로드 대기 중...</p>
        </div>
        <div>
          <div className="facility-grid">
            <div className="facility-card">
              <div className="facility-icon">🏟️</div>
              <div className="facility-name">홈 구장 증축</div>
              <div style={{ fontSize: '11px', color: '#aaa' }}>수용 인원을 늘려 홈 경기 수익 극대화.</div>
              <button className="btn-upgrade" disabled>
                업그레이드
              </button>
            </div>
            <div className="facility-card">
              <div className="facility-icon">🎁</div>
              <div className="facility-name">팬 마케팅 강화</div>
              <div style={{ fontSize: '11px', color: '#aaa' }}>경기당 굿즈 수익 배수를 늘립니다.</div>
              <button className="btn-upgrade" disabled>
                업그레이드
              </button>
            </div>
            <div className="facility-card">
              <div className="facility-icon">🏋️</div>
              <div className="facility-name">최신식 훈련장</div>
              <div style={{ fontSize: '11px', color: '#aaa' }}>로스터 전원 스탯 영구 상승.</div>
              <button className="btn-upgrade" disabled>
                업그레이드
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TycoonView;
