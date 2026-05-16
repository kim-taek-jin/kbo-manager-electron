import React from 'react';
import { useGameContext } from '../../context/GameContext';

const LeagueView = () => {
  const { state } = useGameContext();
  const standings = state.standings || [];

  const sortedStandings = standings
    .slice()
    .sort((a, b) => {
      const pctA = a.wins + a.ties * 0.5;
      const pctB = b.wins + b.ties * 0.5;
      if (pctA !== pctB) return pctB - pctA;
      if (a.wins !== b.wins) return b.wins - a.wins;
      return a.losses - b.losses;
    })
    .map((team, index) => ({
      ...team,
      rank: index + 1,
      pct: team.wins + team.losses + team.ties > 0 ? ((team.wins + team.ties * 0.5) / (team.wins + team.losses + team.ties)).toFixed(3) : '0.000',
    }));

  return (
    <div>
      <h2>
        2026 정규시즌 팀 순위
        <span style={{ fontSize: '14px', color: '#aaa', fontWeight: 'normal' }}>
          진행: {state.currentRound > 1 ? state.currentRound - 1 : 0} 경기
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
          {sortedStandings.length === 0 ? (
            <tr>
              <td colSpan="8">데이터 업로드 후 표시됩니다.</td>
            </tr>
          ) : (
            sortedStandings.map((team, index) => {
              const games = team.wins + team.losses + team.ties;
              const leaderWins = sortedStandings[0]?.wins || 0;
              const gap = leaderWins - team.wins;
              return (
                <tr key={team.team}>
                  <td>{team.rank}</td>
                  <td>{team.team}</td>
                  <td>{games}</td>
                  <td>{team.wins}</td>
                  <td>{team.ties}</td>
                  <td>{team.losses}</td>
                  <td>{team.pct}</td>
                  <td>{team.rank === 1 ? '-' : `${gap}경기차`}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeagueView;
