import React from 'react';
import { useGameContext } from '../../context/GameContext';

const RosterView = () => {
  // eslint-disable-next-line no-unused-vars
  const { state } = useGameContext();

  return (
    <div>
      <h2>
        1군 로스터 (타자 9명 + 투수 11명)
        <span style={{ fontSize: '14px', color: '#aaa', fontWeight: 'normal' }}>
          (활성 <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>0</span>/20)
        </span>
      </h2>

      <button
        className="action-btn"
        style={{ padding: '10px', float: 'right', marginTop: '-40px', width: 'auto' }}
      >
        ⚡ 자동 추천 라인업
      </button>

      <div id="missing-pos-alert" className="missing-pos-bar">
        데이터를 먼저 업로드해주세요!
      </div>

      <table>
        <thead>
          <tr>
            <th>상태</th>
            <th>출전 포지션</th>
            <th style={{ textAlign: 'left' }}>선수명</th>
            <th>OVR (컨/파/선)</th>
            <th>최근 5경기 흐름</th>
            <th>피로도 (컨디션)</th>
            <th>연봉</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody id="roster-tbody">
          <tr>
            <td colSpan="8" style={{ color: '#888' }}>
              데이터를 업로드해주세요.
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ fontSize: '11px', color: '#888', marginTop: '5px', textAlign: 'right' }}>
        * 피로도가 50 이하로 떨어지면 경기 중 스탯 하락 페널티가 부여됩니다. 로테이션을 돌려주세요.
      </div>
    </div>
  );
};

export default RosterView;
