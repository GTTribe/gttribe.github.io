export const NEUTRAL = 0.555
export const INITIAL = 1000
export const MU = 1000
export const HALF_LIFE = 21
export const WIDTH = 10000
export const STEP = 200

const TODAY = new Date()

export const PLAYERS = [
  "Adam Grossberg",
  "Adithya Deepak",
  "Camilo Castrillon",
  "Connor Case",
  "David Baker",
  "Dhruvsai Dhulipudi",
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



function expectedPct(R, { mu = MU, width = WIDTH, neutral = NEUTRAL } = {}) {
  // clamp neutral to (0,1) to avoid infinities
  const nz = Math.min(0.999999, Math.max(0.000001, neutral));
  const bias = Math.log10(nz / (1 - nz));            // E(mu) = neutral
  const expo = -((R - mu) / width + bias);           // critical parens
  return 1 / (1 + Math.pow(10, expo));
}

export function computePlayerRating(
  entries,
  {
    initial = INITIAL,     // starting rating
    K = STEP,             // update size
    halfLifeDays = HALF_LIFE,  // time decay: weight halves every H days
    mu = MU,          // league-average anchor
    width = WIDTH,        // Elo width (bigger = flatter curve)
    today = TODAY, // for age calculation
    neutral = NEUTRAL,  // define NEUTRAL elsewhere (e.g., 0.5 or 0.6)
  } = {}
) {
  const MS_DAY = 86400000;

  const toUTC = (ymd) => {
    const [y, m, d] = (ymd || "").split("-").map(Number);
    return Number.isFinite(y) ? Date.UTC(y, (m || 1) - 1, d || 1) : NaN;
  };

  const floorUTC = (d) => {
    const dt = (d instanceof Date) ? d : new Date(d);
    return Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
  };

  const todayUTC = floorUTC(today);

  const sorted = [...(entries || [])]
    .filter(Boolean)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  let R = initial;

  for (const e of sorted) {
    const r = Math.min(1, Math.max(0, Number(e.pct))); // clamp
    if (!Number.isFinite(r)) continue;

    const when = toUTC(e.date);
    if (!Number.isFinite(when)) continue;

    const ageDays = Math.max(0, Math.floor((todayUTC - when) / MS_DAY));
    const decay = halfLifeDays > 0 ? Math.pow(0.5, ageDays / halfLifeDays) : 1;

    const expected = expectedPct(R, { mu, width, neutral });

    // Incremental Elo-style update (uncapped)
    R = R + K * decay * (r - expected);
  }

  return R;
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
        cur.practices.push({date: p.date, pct: scores / reps })
      }
    }
  }

  return playerMap;
}

export function toLeaderboard(playerMap) {
  const rows = [];
  const usedPlayers = [];
  for (const [player, { scored, reps, practices }] of playerMap.entries()) {
    const pct = reps > 0 ? scored / reps : 0;
    const rating = computePlayerRating(practices);
    rows.push({ player, scored, reps, pct, rating });
  }
  rows.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.pct !== a.pct) return b.pct - a.pct;
    if (b.reps !== a.reps) return a.reps - a.reps;
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