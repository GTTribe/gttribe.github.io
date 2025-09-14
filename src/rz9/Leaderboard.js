import React, { useEffect, useMemo, useState } from "react";
import './rz9.css';
import { 
    fetchManifest,
    fetchPractice, 
    aggregatePlayerStats,
    toLeaderboard,
    formatPct,
    getPlayerRankings
 } from "./rz9Utils";
 import PlayerDetails from "./PlayerDetails";
import PracticeDetails from "./PracticeDetails";
import Explanation from "./Explanation";


export default function Leaderboard() {
  const [practices, setPractices] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPractice, setSelectedPractice] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const manifest = await fetchManifest();
        if (cancelled) return;
        if (!Array.isArray(manifest) || manifest.length === 0) {
          setPractices([]);
          setLoading(false);
          return;
        }
        const loaded = [];
        for (const file of manifest) {
          try {
            const data = await fetchPractice(file);
            loaded.push(data);
          } catch (e) {
            console.warn(e);
          }
        }
        loaded.sort((a, b) => (a?.date || "").localeCompare(b?.date || ""));
        if (!cancelled) setPractices(loaded);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load practice data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const playerMap = useMemo(() => aggregatePlayerStats(practices), [practices]);
  const leaderboard = useMemo(() => toLeaderboard(playerMap), [playerMap]);
  const rankings = useMemo(() => getPlayerRankings(leaderboard), [leaderboard]);

  const totals = useMemo(() => {
    let totalReps = 0;
    let totalScores = 0;
    for (const p of practices) {
      for (const r of p.results || []) {
        totalReps += Number(r.reps || 0);
        totalScores += Number(r.scores || 0);
      }
    }
    return { totalReps, totalScores };
  }, [practices]);

  const lastDate = practices.length ? practices[practices.length - 1].date : "—";

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Tribe 2025 · Red Zone 9s</h1>
        <div style={{ color: "#555", marginTop: 4 }}>
          Practices loaded: <strong>{practices.length}</strong> · Last update: <strong>{lastDate}</strong>
        </div>
        <div style={{ color: "#555", marginTop: 4 }}>
          Aggregate: <strong>{totals.totalScores}</strong> scores / <strong>{totals.totalReps}</strong> reps · Team-wide rate {totals.totalReps > 0 ? formatPct(totals.totalScores / totals.totalReps) : "0.0%"}
        </div>
      </header>

      {loading && <p>Loading practice data…</p>}
      {!loading && practices.length === 0 && !error && (
        <EmptyState />
      )}

      {error && (
        <p style={{ color: "crimson" }}>{error}</p>
      )}

      {!loading && !error && practices.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <TH>#</TH>
                <TH>Player</TH>
                <TH># Scores</TH>
                <TH># Reps</TH>
                <TH>Score %</TH>
                <TH>Rating</TH>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, idx) => (
                <tr className="row" key={row.player} onClick={() => {setSelectedPlayer(row.player); console.log(practices)}} style={idx % 2 === 1 ? { background: "#fafafa" } : undefined}>
                  <TD >{idx === 0 ? "🥇" : (idx === 1 ? "🥈" : (idx === 2 ? "🥉" : (idx === leaderboard.length - 1) ? "💩" : idx + 1))}</TD>
                  <TD>{row.player}</TD>
                  <TD >{row.scored}</TD>
                  <TD >{row.reps}</TD>
                  <TD ><strong>{formatPct(row.pct)}</strong></TD>
                  <TD >{Math.round(row.rating)}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Explanation />
      <footer style={{ marginTop: 16, color: "#666", fontSize: 14 }}>
        <p>
          Note: This is a very simple calculation that attributes team scoring rates to all players on that team. Rate is not calculated on a per-player basis.
        </p>
      </footer>
      <PlayerDetails
        open={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        player={selectedPlayer}
        practices={practices}
        rankings={rankings}
        setSelectedPractice={setSelectedPractice}
      />
      <PracticeDetails
        open={!!selectedPractice}
        onClose={() => setSelectedPractice(null)}
        practiceDate={selectedPractice}
        rankings={rankings}
        setSelectedPlayer={setSelectedPlayer}
        setSelectedPractice={setSelectedPractice}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
      <p style={{ margin: 0 }}>
        No practices found. Add JSON files under <code>public/rz9_data/</code> and list them in
        <code> public/rz9_data/manifest.json</code>.
      </p>
    </div>
  );
}

// Simple styled table components
function TH({ children }) {
  return (
    <th style={{ textAlign: "left", borderBottom: "2px solid #ddd", padding: "10px 8px", fontWeight: 600, fontSize: 14 }}>
      {children}
    </th>
  );
}
function TD({ children, center }) {
  return (
    <td style={{ textAlign: center ? "center" : "left", borderBottom: "1px solid #eee", padding: "10px 8px" }}>
      {children}
    </td>
  );
}