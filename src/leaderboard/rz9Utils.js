export async function fetchManifest() {
  const res = await fetch("/rz9_data/manifest.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Manifest load failed: ${res.status}`);
  return res.json();
}

export async function fetchPractice(filename) {
  const res = await fetch(`/rz9_data/${filename}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Practice load failed (${filename}): ${res.status}`);
  return res.json();
}

export function aggregatePlayerStats(practices) {
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

export function toLeaderboard(playerMap) {
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

export function getPlayerRankings(rows) {
    const rankByPlayer = {};
    rows.forEach((r, idx) => {
        rankByPlayer[r.player] = idx + 1;
    });

    return rankByPlayer
}

export function formatPct(p) {
  return (p * 100).toFixed(1) + "%";
}