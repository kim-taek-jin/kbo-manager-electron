import React from 'react';

const TradeView = () => {
  return (
    <div>
      <h2>타 구단 트레이드 블록</h2>
      <table>
        <thead>
          <tr>
            <th>소속팀</th>
            <th>가능 포지션</th>
            <th style={{ textAlign: 'left' }}>선수명</th>
            <th>컨택(구위)</th>
            <th>파워(제구)</th>
            <th>연봉</th>
            <th>우리 팀 제시 카드</th>
            <th>제안</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="8">데이터를 업로드해주세요.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TradeView;
