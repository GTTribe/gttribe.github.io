import React, { useEffect, useMemo, useState } from "react";

/**
 * RedZoneELO
 *
 * Assumptions & Setup
 * -------------------
 * 1) Put your per-practice JSON files in `src/rz9_data/` (Vite/webpack source folder, not /public).
 *    Example filenames: 2025-09-01.json, 2025-09-03.json, ...
 * 2) Each JSON follows your schema:
 *    {
 *      "date": "YYYY-MM-DD",
 *      "teams": [{ team_id, name?, roster: ["First Last", ...] }],
 *      "results": [{ team_id, reps, scores }]
 *    }
 * 3) Because results are at the TEAM level, we attribute a team’s reps/scores to EVERY player on that team’s roster for that practice.
 *    If you later log per-attempt or per-line data, you can refine this logic.
 *
 * Works best with Vite via import.meta.glob to bundle the JSONs at build time.
 */

// IMPORTANT: adjust the glob path below based on where THIS file lives.
// If RedZoneELO.js is at `src/RedZoneELO.js` and the data is at `src/rz9_data/*.json`,
// then the relative path './rz9_data/*.json' is correct.
// If this component is in `src/components/`, change to '../rz9_data/*.json'.
const practiceFiles = import.meta.glob("./rz9_data/*.json", {
  eager: true,
  import: "default",
});

function aggregatePlayerStats(practices) {
  /**
   * Returns a Map: playerName -> { scored: number, reps: number }
   */
  const playerMap = new Map();

  for (const p of practices) {
    if (!p || !p.teams || !p.results) continue;

    // Build lookup: team_id -> roster[]
    const teamRoster = new Map();
    for (const t of p.teams) {
      teamRoster.set(t.team_id, Array.isArray(t.roster) ? t.roster : []);
    }

    for (const r of p.results) {
      const roster = teamRoster.get(r.team_id) || [];
      const reps = Number(r.reps || 0);
      const scores = Number(r.scores || 0);

      // Attribute this team’s totals to each player on the roster
      for (const player of roster) {
        if (!playerMap.has(player)) playerMap.set(player, { scored: 0, reps: 0 });
        const cur = playerMap.get(player);
        cur.scored += scores;
        cur.reps += reps;
      }
    }
  }

  return playerMap;
}

function toLeaderboard(playerMap) {
  const rows = [];
  for (const [player, { scored, reps }] of playerMap.entries()) {
    const pct = reps > 0 ? scored / reps : 0;
    rows.push({ player, scored, reps, pct });
  }

  // Sort by: percentage desc, reps desc, name asc
  rows.sort((a, b) => {
    if (b.pct !== a.pct) return b.pct - a.pct;
    if (b.reps !== a.reps) return b.reps - a.reps;
    return a.player.localeCompare(b.player);
  });

  return rows;
}

function formatPct(p) {
  return (p * 100).toFixed(1) + "%";
}

function sum(nums) {
  return nums.reduce((acc, n) => acc + n, 0);
}

export default function RedZoneELO() {
  const [practices, setPractices] = useState([]);
  const [error, setError] = useState(null);

  // Load all JSON at build-time via Vite import.meta.glob
  useEffect(() => {
    try {
      const loaded = Object.keys(practiceFiles)
        .map((path) => ({ path, data: practiceFiles[path] }))
        .filter((f) => f.data && f.data.date)
        // sort chronologically by date
        .sort((a, b) => a.data.date.localeCompare(b.data.date))
        .map((f) => f.data);
      setPractices(loaded);
    } catch (e) {
      console.error(e);
      setError("Failed to load practice data.");
    }
  }, []);

  const playerMap = useMemo(() => aggregatePlayerStats(practices), [practices]);
  const leaderboard = useMemo(() => toLeaderboard(playerMap), [playerMap]);

  const totals = useMemo(() => {
    // Overall totals across all teams (sum once per result, not per player)
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

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Red Zone 9s Leaderboard</h2>
        <p style={{ color: "crimson" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Red Zone 9s — Player Rankings</h1>
        <div style={{ color: "#555", marginTop: 4 }}>
          Practices loaded: <strong>{practices.length}</strong> · Last update: <strong>{lastDate}</strong>
        </div>
        <div style={{ color: "#555", marginTop: 4 }}>
          Aggregate: <strong>{totals.totalScores}</strong> scores / <strong>{totals.totalReps}</strong> reps · Team-wide rate {totals.totalReps > 0 ? formatPct(totals.totalScores / totals.totalReps) : "0.0%"}
        </div>
      </header>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Player</th>
              <th style={th}>Scores</th>
              <th style={th}>Reps</th>
              <th style={th}>Rate</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row, idx) => (
              <tr key={row.player} style={idx % 2 ? trAlt : trNorm}>
                <td style={tdCenter}>{idx + 1}</td>
                <td style={tdLeft}>{row.player}</td>
                <td style={tdCenter}>{row.scored}</td>
                <td style={tdCenter}>{row.reps}</td>
                <td style={tdCenter}><strong>{formatPct(row.pct)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer style={{ marginTop: 16, color: "#666", fontSize: 14 }}>
        <p>
          Note: Team totals are attributed to all rostered players for that practice. If you start
          logging per-attempt or per-line participation, this can be refined to only credit players
          on the field for each rep.
        </p>
      </footer>
    </div>
  );
}

const th = {
  textAlign: "left",
  borderBottom: "2px solid #ddd",
  padding: "10px 8px",
  fontWeight: 600,
  fontSize: 14,
};

const tdLeft = { textAlign: "left", borderBottom: "1px solid #eee", padding: "10px 8px" };
const tdCenter = { textAlign: "center", borderBottom: "1px solid #eee", padding: "10px 8px" };
const trNorm = {};
const trAlt = { background: "#fafafa" };