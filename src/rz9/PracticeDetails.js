import React, { useEffect, useMemo, useState } from "react";

/**
 * PracticeDetails — popup modal showing per-team details for a single practice
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - practiceDate: string (YYYY-MM-DD)
 *
 * Behavior:
 * - When opened, fetches `/rz9_data/${practiceDate}.json` from the PUBLIC folder
 *   (e.g., `public/rz9_data/2025-09-03.json`).
 * - Renders a table with one row per team: Team, Players, Scores, Reps, Rate.
 */

export default function PracticeDetails({ open, onClose, practiceDate, rankings, setSelectedPlayer, setSelectedPractice }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") onClose?.(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Fetch the practice JSON when opened and date changes
  useEffect(() => {
    if (!open || !practiceDate) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/rz9_data/${practiceDate}.json`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(`Failed to load ${practiceDate}.json`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, practiceDate]);

  const rows = useMemo(() => buildRows(data), [data]);

  const totals = useMemo(() => {
    let reps = 0, scores = 0;
    for (const r of rows) { reps += r.reps; scores += r.scores; }
    return { reps, scores, pct: reps > 0 ? scores / reps : 0 };
  }, [rows]);

  if (!open) return null;

  const date = practiceDate || data?.date || "—";

  return (
    <div role="dialog" aria-modal="true" aria-label={`Practice ${date}`} style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <header style={modalHeader}>
          <div>
            <h2 style={{ margin: 0 }}>Practice {date}</h2>
            <div style={{ color: "#666", marginTop: 4 }}>
              {loading ? (
                <em>Loading…</em>
              ) : error ? (
                <span style={{ color: "crimson" }}>{error}</span>
              ) : (
                <>Teams: <strong>{rows.length}</strong> · Overall: <strong>{totals.scores}</strong> / <strong>{totals.reps}</strong> ({formatPct(totals.pct)})</>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} style={closeBtn} aria-label="Close">×</button>
        </header>

        {loading ? (
          <div style={{ padding: 16, color: "#555" }}>Fetching practice data…</div>
        ) : error ? (
          <div style={{ padding: 16, color: "crimson" }}>{error}</div>
        ) : !data ? (
          <div style={{ padding: 16, color: "#555" }}>No practice data.</div>
        ) : (
          <div style={{ padding: 8, overflow: "auto", maxHeight: "70vh" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Players</TH>
                  <TH>Scores</TH>
                  <TH>Reps</TH>
                  <TH>Rate</TH>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <TR key={r.key}>
                    <TD>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {r.roster.length === 0 ? (
                          <span style={{ color: "#888" }}>—</span>
                        ) : (
                          r.roster.map((p) => (
                            <div className="player-pill" onClick={() => {setSelectedPlayer(p); setSelectedPractice(null)}} key={p} style={pill}>{p} ({rankings[p]})</div>
                          ))
                        )}
                      </div>
                    </TD>
                    <TD >{r.scores}</TD>
                    <TD >{r.reps}</TD>
                    <TD ><strong>{formatPct(r.pct)}</strong></TD>
                  </TR>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function buildRows(practice) {
  if (!practice) return [];
  const teams = Array.isArray(practice.teams) ? practice.teams : [];
  const results = Array.isArray(practice.results) ? practice.results : [];

  const resultByTeam = new Map();
  for (const r of results) {
    if (!r) continue;
    resultByTeam.set(r.team_id, {
      reps: Number(r.reps || 0),
      scores: Number(r.scores || 0),
    });
  }

  const rows = teams.map((t) => {
    const res = resultByTeam.get(t.team_id) || { reps: 0, scores: 0 };
    const reps = res.reps;
    const scores = res.scores;
    return {
      key: t.team_id,
      teamId: t.team_id,
      teamLabel: String(t.team_id),
      teamName: t.name || "",
      roster: Array.isArray(t.roster) ? t.roster : [],
      reps,
      scores,
      pct: reps > 0 ? scores / reps : 0,
    };
  });

  // Sort by team id lexicographically (A, B, C,...)
  rows.sort((a, b) => String(a.teamId).localeCompare(String(b.teamId)));

  return rows;
}

function formatPct(p) { return (p * 100).toFixed(1) + "%"; }

// ---------- styles ----------

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 1000,
};

const modal = {
  width: "min(900px, 100%)",
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  overflow: "hidden",
};

const modalHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 16px 12px",
  borderBottom: "1px solid #eee",
};

const closeBtn = {
  border: "none",
  background: "transparent",
  fontSize: 28,
  lineHeight: 1,
  cursor: "pointer",
  padding: 4,
};

function TH({ children }) {
  return (
    <th style={{ textAlign: "left", borderBottom: "2px solid #ddd", padding: "10px 8px", fontWeight: 600, fontSize: 14 }}>
      {children}
    </th>
  );
}
function TD({ children, center }) {
  return (
    <td style={{ textAlign: center ? "center" : "left", borderBottom: "1px solid #eee", padding: "10px 8px", verticalAlign: "top" }}>
      {children}
    </td>
  );
}
function TR({ children }) { return <tr>{children}</tr>; }

const pill = {
  display: "inline-block",
  border: "1px solid #e2e2e2",
  background: "#f7f7f7",
  borderRadius: 9999,
  padding: "4px 8px",
  fontSize: 12,
};
