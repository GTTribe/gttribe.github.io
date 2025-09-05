import React, { useEffect, useMemo, useState } from "react";

/**
 * Generate.js — Build a per-practice JSON for Red Zone 9s
 *
 * What it does
 * - Choose number of teams
 * - For each team: pick players (multi-select), enter reps & scores
 * - Shows the resulting JSON so you can copy/paste into a file
 *
 * Assumptions
 * - Players are hardcoded below in the PLAYERS array. Edit to match your roster.
 * - We auto-assign team_id letters: A, B, C, ...
 */

// Roster
const PLAYERS = [
  "Adam Grossberg",
  "Adithya Deepak",
  "Camilo Castrillon",
  "Connor Case",
  "David Baker",
  "Dhruvsai Dhulipudi",
  "Edan Avissar",
  "Ephraim Connor",
  "Ethan Austin-Cruse",
  "Flavius Penescu",
  "Ganden Fung",
  "Grover Grendzinski",
  "Ivan Sanchez",
  "Jackson Armstrong",
  "Jedidiah Cheng",
  "John Davis",
  "Keller Smith",
  "Matthew Greenberg",
  "Neal Zeng",
  "Nikos Verlenden",
  "Owen Hammond-Lee",
  "Philip Emry",
  "Piss",
  "Sam Granade",
  "Sam Grossberg",
  "Stefan McCall"
];

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function Generate() {
  const [date, setDate] = useState(todayISO());
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState(() => initTeams(2));

  // Keep teams array in sync with teamCount
  useEffect(() => {
    setTeams((prev) => resizeTeams(prev, teamCount));
  }, [teamCount]);

  const practiceJson = useMemo(() => buildJson(date, teams), [date, teams]);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ marginTop: 0 }}>Generate RZ9 JSON</h1>

      {/* Date */}
      <section style={card}>
        <label style={label}>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={input}
        />
      </section>

      {/* Team count */}
      <section style={card}>
        <label style={label}>Number of Teams</label>
        <select
          value={teamCount}
          onChange={(e) => setTeamCount(parseInt(e.target.value, 10))}
          style={input}
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </section>

      {/* Teams editor */}
      <section style={{ ...card, paddingTop: 8 }}>
        {teams.map((t, idx) => (
          <TeamEditor
            key={idx}
            index={idx}
            data={t}
            onRosterChange={(roster) => updateTeam(idx, { roster }, setTeams)}
            onRepsChange={(reps) => updateTeam(idx, { reps }, setTeams)}
            onScoresChange={(scores) => updateTeam(idx, { scores }, setTeams)}
          />
        ))}
      </section>

      {/* Output */}
      <section style={card}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h2 style={{ margin: 0 }}>JSON Output</h2>
          <small style={{ color: "#666" }}>(copy and paste into a file named <code>{date || "YYYY-MM-DD"}.json</code>)</small>
        </div>
        <pre style={pre}>{JSON.stringify(practiceJson, null, 2)}</pre>
      </section>
    </div>
  );
}

function TeamEditor({ index, data, onRosterChange, onRepsChange, onScoresChange }) {
  const teamId = LETTERS[index] || `T${index + 1}`;

  function toggleRoster(player) {
    const exists = data.roster.includes(player);
    const next = exists
      ? data.roster.filter((p) => p !== player)
      : [...data.roster, player];
    // keep order consistent with PLAYERS list
    const ordered = next.slice().sort((a, b) => PLAYERS.indexOf(a) - PLAYERS.indexOf(b));
    onRosterChange(ordered);
  }

  const isSelected = (p) => data.roster.includes(p);

  return (
    <div style={{ borderBottom: "1px solid #eee", padding: "12px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ fontWeight: 700, minWidth: 28 }}>Team {teamId}</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <label style={labelCol}>
            <span>Reps</span>
            <input
              type="number"
              min={0}
              value={data.reps}
              onChange={(e) => onRepsChange(safeInt(e.target.value))}
              style={input}
            />
          </label>
          <label style={labelCol}>
            <span>Scores</span>
            <input
              type="number"
              min={0}
              value={data.scores}
              onChange={(e) => onScoresChange(safeInt(e.target.value))}
              style={input}
            />
          </label>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {PLAYERS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => toggleRoster(p)}
            aria-pressed={isSelected(p)}
            style={{
              ...chip,
              ...(isSelected(p) ? chipSelected : {}),
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

// -----------------
// Helpers & Styles
// -----------------

function initTeams(n) {
  return Array.from({ length: n }, () => ({ roster: [], reps: 0, scores: 0 }));
}

function resizeTeams(prev, n) {
  const next = prev.slice(0, n);
  while (next.length < n) next.push({ roster: [], reps: 0, scores: 0 });
  return next;
}

function updateTeam(index, patch, setTeams) {
  setTeams((prev) => {
    const next = prev.slice();
    next[index] = { ...next[index], ...patch };
    return next;
  });
}

function buildJson(date, teams) {
  const teamsOut = teams.map((t, idx) => ({
    team_id: LETTERS[idx] || `T${idx + 1}`,
    roster: t.roster,
  }));

  const resultsOut = teams.map((t, idx) => ({
    team_id: LETTERS[idx] || `T${idx + 1}`,
    reps: Number(t.reps) || 0,
    scores: Number(t.scores) || 0,
  }));

  return {
    date: date || "YYYY-MM-DD",
    teams: teamsOut,
    results: resultsOut,
  };
}

function safeInt(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

const card = {
  border: "1px solid #eee",
  borderRadius: 8,
  padding: 16,
  margin: "12px 0",
  background: "#fff",
};
const label = { display: "block", fontSize: 14, color: "#333", marginBottom: 6 };
const labelCol = { display: "flex", flexDirection: "column", gap: 6 };
const input = {
  width: 240,
  padding: "8px 10px",
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 14,
};
const pre = {
  background: "#0b1020",
  color: "#c4e3ff",
  padding: 16,
  borderRadius: 8,
  overflowX: "auto",
  fontSize: 13,
  lineHeight: 1.5,
};
const chip = {
    display: "inline-block",
    border: "1px solid black",
    background: "#f8f8f8",
    borderRadius: 9999,
    padding: "6px 10px",
    fontSize: 14,
    cursor: "pointer",
    userSelect: "none",
};


const chipSelected = {
    background: "#e6f3ff",
    borderColor: "#7ab8ff",
};