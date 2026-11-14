// Loads the NASA planet numbers from data/game_data.json.
// If the file can't be loaded (for example when index.html is opened by
// double-clicking instead of through a local server), the backup copy
// below is used so the demo never breaks.
// KEEP THE BACKUP THE SAME AS data/game_data.json.

const BACKUP_PLANETS = [
  { name: "Moon",    distance: 149.6, gravity: 1.6,  temperature: -20 },
  { name: "Mars",    distance: 228.0, gravity: 3.7,  temperature: -65 },
  { name: "Jupiter", distance: 778.5, gravity: 23.1, temperature: -110 },
];

async function loadPlanets() {
  try {
    const res = await fetch("data/game_data.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    return { planets: json.planets, fromFile: true };
  } catch (err) {
    console.warn("Using backup planet numbers:", err.message);
    return { planets: BACKUP_PLANETS, fromFile: false };
  }
}
