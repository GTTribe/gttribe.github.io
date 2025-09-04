import React, { useEffect, useMemo, useState } from "react";


async function fetchManifest() {
  const res = await fetch("/rz9_data/manifest.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Manifest load failed: ${res.status}`);
  return res.json();
}

async function fetchPractice(filename) {
  const res = await fetch(`/rz9_data/${filename}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Practice load failed (${filename}): ${res.status}`);
  return res.json();
}

function aggregatePlayerStats(practices) {
  // Map: playerName -> { scored: number, reps: number }
  const playerMap = new Map();

  for (const p of practices) {
    if (!p || !p.teams || !p.results) continue;

    const teamRoster = new Map(); // team_id -> roster[]
    for (const t of p.teams) {
      teamRoster.set(t.team_id, Array.isArray(t.roster) ? t.roster : []);
    }

    for (const r of p.results) {
      const roster = teamRoster.get(r.team_id) || [];
      const reps = Number(r.reps || 0);
      const scores = Number(r.scores || 0);

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

export default function RedZoneELO() {
  const [practices, setPractices] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <h1 style={{ margin: 0 }}>Red Zone 9s — Player Rankings</h1>
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
                <TH>Scores</TH>
                <TH>Reps</TH>
                <TH>Rate</TH>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, idx) => (
                <TR key={row.player} alt={idx % 2 === 1}>
                  <TD center>{idx + 1}</TD>
                  <TD>{row.player}</TD>
                  <TD center>{row.scored}</TD>
                  <TD center>{row.reps}</TD>
                  <TD center><strong>{formatPct(row.pct)}</strong></TD>
                </TR>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

function EmptyState() {
  return (
    <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
      <p style={{ margin: 0 }}>
        No practices found. Add JSON files under <code>public/rz9_data/</code> and list them in
        <code> public/rz9_data/manifest.json</code>.
      </p>
      <pre style={{ marginTop: 12, background: "#f8f8f8", padding: 12, borderRadius: 6, overflowX: "auto" }}>
        {`// public/rz9_data/manifest.json
        [
        "2025-09-03.json",
        "2025-09-05.json"
        ]

        // public/rz9_data/2025-09-03.json
        {
        "date": "2025-09-03",
        "teams": [
            { "team_id": "A", "roster": ["Adam Grossberg", "Sam Keller"] },
            { "team_id": "B", "roster": ["Nina Ross", "Omar Hayes"] }
        ],
        "results": [
            { "team_id": "A", "reps": 18, "scores": 11 },
            { "team_id": "B", "reps": 18, "scores": 7 }
        ]
        }`}
      </pre>
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
function TR({ children, alt }) {
  return (
    <tr style={alt ? { background: "#fafafa" } : undefined}>
      {children}
    </tr>
  );
}
