import React from 'react';
import { useGameContext } from '../../context/GameContext';

const formatAvg = (value) => (value != null && !Number.isNaN(value) ? value.toFixed(3) : '-');
const formatRate = (value) => (value != null && !Number.isNaN(value) ? value.toFixed(3) : '-');
const formatInt = (value) => (value != null ? value : '-');

const StatsView = () => {
  const { state } = useGameContext();
  const allPlayers = state.allPlayersRegistry || [];

  const batters = allPlayers
    .filter((player) => !player.isPitcher && player.stats?.pa != null)
    .map((player) => ({
      ...player,
      stats: {
        ...player.stats,
        obp: player.stats.obp ?? (player.stats.pa ? Number(((player.stats.h || 0) + (player.stats.bb || 0) + (player.stats.hbp || 0)) / player.stats.pa).toFixed(3) : 0),
        slg: player.stats.slg ?? (player.stats.ab ? Number(((player.stats.tb || 0) / player.stats.ab).toFixed(3)) : 0),
      },
    }));

  const avgLeaders = batters
    .slice()
    .sort((a, b) => (b.stats.avg || 0) - (a.stats.avg || 0))
    .slice(0, 10);
  const hrLeaders = batters
    .slice()
    .sort((a, b) => (b.stats.hr || 0) - (a.stats.hr || 0))
    .slice(0, 10);
  const rbiLeaders = batters
    .slice()
    .sort((a, b) => (b.stats.rbi || 0) - (a.stats.rbi || 0))
    .slice(0, 10);
  const myBatters = state.myTeam
    .filter((player) => !player.isPitcher && player.stats?.pa != null)
    .slice()
    .sort((a, b) => (b.stats.avg || 0) - (a.stats.avg || 0))
    .slice(0, 8);

  return (
    <div>
      <h2>2026 전력 분석 및 개인 타이틀 홀더</h2>

      <section style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--accent)', borderBottom: '1px solid #555', paddingBottom: '6px' }}>
          ⚾ 내 팀 주요 타자
        </h3>
        <table>
          <thead>
            <tr>
              <th>순위</th>
              <th>선수명</th>
              <th>포지션</th>
              <th>AVG</th>
              <th>AB</th>
              <th>H</th>
              <th>HR</th>
              <th>RBI</th>
            </tr>
          </thead>
          <tbody>
            {myBatters.length === 0 ? (
              <tr>
                <td colSpan="8">로스터에 타자가 없거나 CSV 로드가 필요합니다.</td>
              </tr>
            ) : (
              myBatters.map((player, index) => (
                <tr key={player.id}>
                  <td>{index + 1}</td>
                  <td>{player.name}</td>
                  <td>{player.assignedPos || player.displayPos}</td>
                  <td>{formatAvg(player.stats.avg)}</td>
                  <td>{formatInt(player.stats.ab)}</td>
                  <td>{formatInt(player.stats.h)}</td>
                  <td>{formatInt(player.stats.hr)}</td>
                  <td>{formatInt(player.stats.rbi)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3 style={{ color: 'var(--accent)', borderBottom: '1px solid #555', paddingBottom: '6px' }}>
            🎯 타율 (AVG) TOP 10
          </h3>
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>선수명</th>
                <th>팀</th>
                <th>AB</th>
                <th>H</th>
                <th>AVG</th>
                <th>OBP</th>
                <th>SLG</th>
              </tr>
            </thead>
            <tbody>
              {avgLeaders.length === 0 ? (
                <tr>
                  <td colSpan="8">데이터를 로드하거나 CSV를 업로드해주세요.</td>
                </tr>
              ) : (
                avgLeaders.map((player, index) => (
                  <tr key={player.id}>
                    <td>{index + 1}</td>
                    <td>{player.name}</td>
                    <td>{player.team}</td>
                    <td>{formatInt(player.stats.ab)}</td>
                    <td>{formatInt(player.stats.h)}</td>
                    <td>{formatAvg(player.stats.avg)}</td>
                    <td>{formatRate(player.stats.obp)}</td>
                    <td>{formatRate(player.stats.slg)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h3 style={{ color: 'var(--danger)', borderBottom: '1px solid #555', paddingBottom: '6px' }}>
            🔥 홈런/타점 TOP 10
          </h3>
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>선수명</th>
                <th>팀</th>
                <th>AB</th>
                <th>HR</th>
                <th>RBI</th>
                <th>2B</th>
                <th>3B</th>
              </tr>
            </thead>
            <tbody>
              {hrLeaders.length === 0 ? (
                <tr>
                  <td colSpan="8">데이터를 로드하거나 CSV를 업로드해주세요.</td>
                </tr>
              ) : (
                hrLeaders.map((player, index) => (
                  <tr key={player.id}>
                    <td>{index + 1}</td>
                    <td>{player.name}</td>
                    <td>{player.team}</td>
                    <td>{formatInt(player.stats.ab)}</td>
                    <td>{formatInt(player.stats.hr)}</td>
                    <td>{formatInt(player.stats.rbi)}</td>
                    <td>{formatInt(player.stats.doubles)}</td>
                    <td>{formatInt(player.stats.triples)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section style={{ marginTop: '20px' }}>
        <h3 style={{ color: 'var(--accent)', borderBottom: '1px solid #555', paddingBottom: '6px' }}>
          🧡 타점 (RBI) TOP 10
        </h3>
        <table>
          <thead>
            <tr>
              <th>순위</th>
              <th>선수명</th>
              <th>팀</th>
              <th>AB</th>
              <th>RBI</th>
              <th>HR</th>
              <th>AVG</th>
            </tr>
          </thead>
          <tbody>
            {rbiLeaders.length === 0 ? (
              <tr>
                <td colSpan="7">데이터를 로드하거나 CSV를 업로드해주세요.</td>
              </tr>
            ) : (
              rbiLeaders.map((player, index) => (
                <tr key={player.id}>
                  <td>{index + 1}</td>
                  <td>{player.name}</td>
                  <td>{player.team}</td>
                  <td>{formatInt(player.stats.ab)}</td>
                  <td>{formatInt(player.stats.rbi)}</td>
                  <td>{formatInt(player.stats.hr)}</td>
                  <td>{formatAvg(player.stats.avg)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h3 style={{ color: 'var(--warning)', borderBottom: '1px solid #555', paddingBottom: '6px' }}>
          🧾 타자 상세 통계
        </h3>
        <table>
          <thead>
            <tr>
              <th>선수명</th>
              <th>팀</th>
              <th>AVG</th>
              <th>OBP</th>
              <th>SLG</th>
              <th>AB</th>
              <th>H</th>
              <th>HR</th>
              <th>RBI</th>
              <th>SAC</th>
              <th>SF</th>
            </tr>
          </thead>
          <tbody>
            {batters.length === 0 ? (
              <tr>
                <td colSpan="11">타자 데이터를 로드하거나 CSV를 업로드해주세요.</td>
              </tr>
            ) : (
              batters.slice(0, 12).map((player) => (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>{player.team}</td>
                  <td>{formatAvg(player.stats.avg)}</td>
                  <td>{formatRate(player.stats.obp)}</td>
                  <td>{formatRate(player.stats.slg)}</td>
                  <td>{formatInt(player.stats.ab)}</td>
                  <td>{formatInt(player.stats.h)}</td>
                  <td>{formatInt(player.stats.hr)}</td>
                  <td>{formatInt(player.stats.rbi)}</td>
                  <td>{formatInt(player.stats.sac)}</td>
                  <td>{formatInt(player.stats.sf)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default StatsView;
