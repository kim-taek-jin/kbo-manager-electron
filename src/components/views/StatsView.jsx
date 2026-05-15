import React from 'react';

const StatsView = () => {
  return (
    <div>
      <h2>2026 전력 분석 및 개인 타이틀 홀더</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3 style={{ color: 'var(--accent)', borderBottom: '1px solid #555', paddingBottom: '5px' }}>
            🎯 타율 (AVG) TOP 10
          </h3>
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>선수명</th>
                <th>팀</th>
                <th>타수</th>
                <th>안타</th>
                <th>타율</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="6">데이터 로드 중...</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <h3 style={{ color: 'var(--danger)', borderBottom: '1px solid #555', paddingBottom: '5px' }}>
            🔥 홈런 (HR) TOP 10
          </h3>
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>선수명</th>
                <th>팀</th>
                <th>타수</th>
                <th>홈런</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="5">데이터 로드 중...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatsView;
