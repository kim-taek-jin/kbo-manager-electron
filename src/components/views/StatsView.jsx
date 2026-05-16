import React from 'react';
import { useGameContext } from '../../context/GameContext';

const StatsView = () => {
  const { state } = useGameContext();
  const allPlayers = state.allPlayersRegistry || [];
  const batters = allPlayers
    .filter((player) => !player.isPitcher && player.stats?.avg != null)
    .sort((a, b) => (b.stats.avg || 0) - (a.stats.avg || 0))
    .slice(0, 10);
  const hrLeaders = allPlayers
    .filter((player) => !player.isPitcher)
    .sort((a, b) => (b.stats.hr || 0) - (a.stats.hr || 0))
    .slice(0, 10);

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
              {batters.length === 0 ? (
                <tr>
                  <td colSpan="6">데이터를 로드하거나 CSV를 업로드해주세요.</td>
                </tr>
              ) : (
                batters.map((player, index) => (
                  <tr key={player.id}>
                    <td>{index + 1}</td>
                    <td>{player.name}</td>
                    <td>{player.team}</td>
                    <td>{player.stats.ab ?? '-'}</td>
                    <td>{player.stats.h ?? '-'}</td>
                    <td>{player.stats.avg?.toFixed(3) ?? '-'}</td>
                  </tr>
                ))
              )}
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
              {hrLeaders.length === 0 ? (
                <tr>
                  <td colSpan="5">데이터를 로드하거나 CSV를 업로드해주세요.</td>
                </tr>
              ) : (
                hrLeaders.map((player, index) => (
                  <tr key={player.id}>
                    <td>{index + 1}</td>
                    <td>{player.name}</td>
                    <td>{player.team}</td>
                    <td>{player.stats.ab ?? '-'}</td>
                    <td>{player.stats.hr ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatsView;
