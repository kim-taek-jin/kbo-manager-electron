import React from 'react';

const MarketView = () => {
  return (
    <div>
      <h2>FA 시장 (경쟁 입찰)</h2>
      <table>
        <thead>
          <tr>
            <th>등급</th>
            <th>원소속</th>
            <th>가능 포지션</th>
            <th style={{ textAlign: 'left' }}>선수명</th>
            <th>컨택(구위)</th>
            <th>파워(제구)</th>
            <th>선구(체력)</th>
            <th>기본가</th>
            <th>협상</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="9">데이터를 업로드해주세요.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default MarketView;
