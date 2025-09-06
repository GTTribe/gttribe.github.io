import React, { useEffect, useMemo } from "react";
import { computePlayerRating } from "./rz9Utils";

/**
 * PlayerDetails — popup modal showing per-practice scoring for a player
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - player: string (player name as used in practice JSON rosters)
 * - practices: Array<Practice> (objects using your per-practice schema)
 *
 * Usage example (inside RedZoneELO):
 * const [selectedPlayer, setSelectedPlayer] = useState(null);
 * ... in the table row ... onClick={() => setSelectedPlayer(row.player)}
 * <PlayerDetails
 *   open={!!selectedPlayer}
 *   onClose={() => setSelectedPlayer(null)}
 *   player={selectedPlayer}
 *   practices={practices}
 * />
 */

export default function PlayerDetails({ open, onClose, player, practices = [], rankings, setSelectedPractice }) {
  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const rows = useMemo(() => {
    if (!player) return [];
    const out = [];

    for (const p of practices) {
      if (!p?.teams || !p?.results) continue;

      // teams that include the player
      const teamsWithPlayer = (p.teams || []).filter((t) => Array.isArray(t.roster) && t.roster.includes(player));
      if (teamsWithPlayer.length === 0) continue;

      // sum results for all such teams (usually one per practice)
      let reps = 0;
      let scores = 0;
      const teamIds = [];

      for (const t of teamsWithPlayer) {
        teamIds.push(t.team_id);
        const r = (p.results || []).find((x) => x.team_id === t.team_id);
        if (r) {
          reps += Number(r.reps || 0);
          scores += Number(r.scores || 0);
        }
      }

      const pct = reps > 0 ? scores / reps : 0;
      out.push({ date: p.date, teamIds, reps, scores, pct });
    }

    // Newest first
    out.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return out;
  }, [player, practices]);

  const totals = useMemo(() => {
    let reps = 0,
      scores = 0;
    for (const r of rows) {
      reps += r.reps;
      scores += r.scores;
    }
    return { reps, scores, pct: reps > 0 ? scores / reps : 0 };
  }, [rows]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={`Details for ${player || "player"}`} style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <header style={modalHeader}>
          <div>
            <h2 style={{ margin: 0 }}>{player || "Player"}</h2>
            <div style={{ color: "#666", marginTop: 4 }}>
              Practices: <strong>{rows.length}</strong> · Overall: <strong>{totals.scores}</strong> / <strong>{totals.reps}</strong> ({formatPct(totals.pct)}) 
              · Current Rank: <strong>{rankings[player]}</strong> · Current Rating: <strong>{Math.round(computePlayerRating(rows))}</strong> 
            </div>
          </div>
          <button type="button" onClick={onClose} style={closeBtn} aria-label="Close">×</button>
        </header>

        {rows.length === 0 ? (
          <div style={{ padding: 16, color: "#555" }}>No practices found for this player.</div>
        ) : (
          <div style={{ padding: 8, overflow: "auto", maxHeight: "60vh" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Date</TH>
                  <TH>Scores</TH>
                  <TH>Reps</TH>
                  <TH>Rate</TH>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr className="row" key={r.date} onClick={() => setSelectedPractice(r.date)}>
                    <TD>{r.date}</TD>
                    <TD >{r.scores}</TD>
                    <TD >{r.reps}</TD>
                    <TD ><strong>{formatPct(r.pct)}</strong></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- helpers ----------

function formatPct(p) {
  return (p * 100).toFixed(1) + "%";
}

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
  width: "min(760px, 100%)",
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
    <td style={{ textAlign: center ? "center" : "left", borderBottom: "1px solid #eee", padding: "10px 8px" }}>
      {children}
    </td>
  );
}
