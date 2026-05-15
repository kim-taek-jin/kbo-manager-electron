import React from 'react';

const LeagueView = () => {
  return (
    <div>
      <h2>
        2026 정규시즌 팀 순위{' '}
        <span style={{ fontSize: '14px', color: '#aaa', fontWeight: 'normal' }}>
          진행: <span id="current-round-display">0</span> 경기
        </span>
      </h2>
      <table>
        <thead>
          <tr>
            <th>순위</th>
            <th>구단명</th>
            <th>경기</th>
            <th>승</th>
            <th>무</th>
            <th>패</th>
            <th>승률</th>
            <th>승차</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="8">데이터 업로드 후 표시됩니다.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default LeagueView;
