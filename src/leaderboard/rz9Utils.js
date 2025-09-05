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


export function computePlayerRating(
  entries,
  {
    initial = 1000,     // starting rating
    K = 60,             // update size
    halfLifeDays = 28,  // time decay: weight halves every H days
    mu = 1000,          // league-average anchor
    width = 400,        // Elo width (bigger = flatter curve)
    today = new Date(), // for age calculation
  } = {}
) {
  const MS_DAY = 86400000;

  const toUTC = (ymd) => {
    const [y, m, d] = (ymd || "").split("-").map(Number);
    return Number.isFinite(y) ? Date.UTC(y, (m || 1) - 1, d || 1) : NaN;
  };

  const floorUTC = (d) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const todayUTC = floorUTC(today);


  const sorted = [...(entries || [])].filter(Boolean).sort((a, b) =>
    (a.date || "").localeCompare(b.date || "")
  );

  let R = initial;

  for (const e of sorted) {
    const r = Math.min(1, Math.max(0, Number(e.rate))); // clamp
    if (!Number.isFinite(r)) continue;

    const when = toUTC(e.date);
    if (!Number.isFinite(when)) continue;

    const ageDays = Math.max(0, Math.floor((todayUTC - when) / MS_DAY));
    const decay = halfLifeDays > 0 ? Math.pow(0.5, ageDays / halfLifeDays) : 1;

    // Expected scoring rate from current rating
    const expected = 1 / (1 + Math.pow(10, -(R - mu) / width));

    // Incremental Elo-style update (uncapped)
    R = R + K * decay * (r - expected);
  }

  return Math.round(R);
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
        if (!playerMap.has(player)) playerMap.set(player, { scored: 0, reps: 0, practices: [] });
        const cur = playerMap.get(player);
        cur.scored += scores;
        cur.reps += reps;
        cur.practices.push({date: p.date, rate: scores / reps })
      }
    }
  }

  return playerMap;
}

export function toLeaderboard(playerMap) {
  const rows = [];
  for (const [player, { scored, reps, practices }] of playerMap.entries()) {
    const pct = reps > 0 ? scored / reps : 0;
    const rating = computePlayerRating(practices);
    rows.push({ player, scored, reps, pct, rating });
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