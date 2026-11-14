// A real mission, from start to finish:
//   1. Briefing  – where you're going and the NASA numbers
//   2. Load      – split the mission points between fuel and food
//   3. Fly       – the trip eats food (farther = more food)
//   4. Land      – landing burns fuel (stronger gravity = more fuel)
//   5. Result    – success, or failed with the reason
// Numbers come from data/game_data.json.

const $ = (id) => document.getElementById(id);

// Backup copy of data/game_data.json, used if the file can't load
// (for example when index.html is opened by double-clicking).
const BACKUP_LEVELS = [
  { level: 1, minutes: 3, planet: "Moon",    distance: 149.6, from_earth: 0.384, sma_au: 1.0,      period_days: null,    trip_days: 3, gravity: 1.6,  temperature: -20,  fuel: 16,  food: 10 },
  { level: 2, minutes: 2, planet: "Mars",    distance: 228.0, from_earth: 78.4,  sma_au: 1.523679, period_days: 686.971, gravity: 3.7,  temperature: -65,  fuel: 37,  food: 15 },
  { level: 3, minutes: 1, planet: "Europa",  distance: 778.5, from_earth: 628.9, sma_au: 5.2044,   period_days: 4332.59, gravity: 1.31, temperature: -160, fuel: 13,  food: 52 },
];
const BACKUP_EARTH = { sma_au: 1.0, period_days: 365.25638 };

// Real trip time to a planet, in days, using NASA Mission Viz orbit data.
// A Hohmann transfer is the usual fuel-saving path between two orbits:
// it takes half an orbit around the Sun whose size is halfway between
// Earth's orbit and the planet's. Kepler's third law gives that orbit's
// length: (size in AU)^1.5 Earth-years.
function hohmannDays(planetAU, earth) {
  const transferAU = (earth.sma_au + planetAU) / 2;
  return 0.5 * Math.pow(transferAU, 1.5) * earth.period_days;
}

let earth = BACKUP_EARTH;

const BUDGET = 100;          // mission points to split between fuel and food
const BASE_SECONDS = 2;      // trip time on screen: 2 s + 1 s per 120 million km
const KM_PER_SECOND = 120;
const LANDING_SECONDS = 2;   // how long the landing burn takes on screen

// What you collect on the surface. Change "need" and "seconds" to tune it.
// drawing: put a picture at this path and it replaces the text label.
const SAMPLES = {
  rock:    { label: "Rock",    one: "rock",          plural: "rocks",          need: 2, seconds: 3,   drawing: "assets/surface/rock.png" },
  picture: { label: "Picture", one: "picture",       plural: "pictures",       need: 2, seconds: 1.5, drawing: "assets/surface/picture.png" },
  ground:  { label: "Ground",  one: "ground sample", plural: "ground samples", need: 2, seconds: 2.5, drawing: "assets/surface/ground.png" },
};
const SPOTS_PER_TYPE = 4;    // how many spots of each kind appear on the surface

let levels = [];
let index = 0;               // which mission we're on
let load = { fuel: 0, food: 0 };
let missionStart = 0;
let clockTimer = null;

const mission = () => levels[index];

// ---------- helpers ----------

function showPhase(name) {
  ["brief", "load", "fly", "surface", "result"].forEach((p) => ($(`phase-${p}`).hidden = p !== name));
}

function elapsed() {
  if (!missionStart) return "00:00:00";
  const s = Math.floor((performance.now() - missionStart) / 1000);
  return [s / 3600, (s % 3600) / 60, s % 60].map((n) => String(Math.floor(n)).padStart(2, "0")).join(":");
}

function log(text, kind = "") {
  const li = document.createElement("li");
  li.className = kind;
  li.innerHTML = `<span class="t">T+ ${elapsed()}</span> ${text}`;
  $("log").prepend(li);
}

// If a drawing is missing, show a dashed box with its name instead.
// Pictures can be .png or .jpg: if "x.png" isn't there, try "x.jpg" once.
function tryJpg(img) {
  const src = img.getAttribute("src") || "";
  if (!src.endsWith(".png") || img.dataset.triedJpg) return false;
  img.dataset.triedJpg = "1";
  img.src = src.replace(/\.png$/, ".jpg");
  return true;
}

function useDrawingOrPlaceholder(img) {
  const swap = () => {
    if (tryJpg(img)) return;
    const box = document.createElement("div");
    box.className = "placeholder";
    box.textContent = img.dataset.label;
    img.replaceWith(box);
  };
  img.onerror = swap;
  if (img.complete && img.getAttribute("src") && img.naturalWidth === 0) swap();
}

function setPlanetPicture(name) {
  const img = document.createElement("img");
  img.alt = name;
  img.dataset.label = `${name} drawing`;
  useDrawingOrPlaceholder(img);
  img.src = `assets/planets/${name.toLowerCase()}.png`;   // e.g. assets/planets/mars.png
  $("planet-slot").replaceChildren(img);
}

function moveRocket(progress, down = 0, home = false) {
  $("rocket").style.left = `${progress * 100}%`;
  $("rocket").style.transform =
    `translate(-50%, calc(-50% + ${down}px)) rotate(${down ? 90 : 0}deg) scaleX(${home ? -1 : 1})`;
}

// ---------- background captions (words live in js/captions.js) ----------

let captionTimer = null;

function fillIn(text, m) {
  return text.replace(/\{(\w+)\}/g, (all, key) => (m[key] ?? all));
}

function setCaptions(part) {
  const m = mission();
  const list = [...(CAPTIONS[part] || []), ...(CAPTIONS.planets[m.planet] || [])]
    .map((t) => fillIn(t, m));
  const el = $("caption");
  clearInterval(captionTimer);
  if (!list.length) { el.textContent = ""; return; }

  let i = 0;
  const showNext = () => {
    el.classList.remove("show");
    setTimeout(() => {
      el.textContent = list[i % list.length];
      el.classList.add("show");
      i += 1;
    }, 300);
  };
  showNext();
  captionTimer = setInterval(showNext, CAPTION_SECONDS * 1000);
}

// ---------- 1. briefing ----------

function startBriefing() {
  const m = mission();
  clearInterval(clockTimer);
  missionStart = 0;
  $("clock").textContent = "T+ 00:00:00";
  $("mission-name").textContent = `Mission ${m.level} of ${levels.length}: ${m.planet}`;
  setPlanetPicture(m.planet);
  moveRocket(0);

  $("brief-title").textContent = `Mission ${m.level}: Land on ${m.planet}`;
  $("brief-facts").innerHTML = [
    ["Distance from Earth", `${m.from_earth} million km`],
    ["Distance from Sun", `${m.sma_au} AU`],
    ["Trip time", `${m.trip_days} days`],
    ["Gravity", `${m.gravity} m/s²`],
    ["Mean temperature", `${m.temperature} °C`],
  ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  $("brief-goal").textContent =
    `Fly to ${m.planet} and land safely. You have ${BUDGET} mission points to spend on fuel and food.`;

  $("log").replaceChildren();
  log(`Mission ${m.level} briefing: destination ${m.planet}.`);
  showPhase("brief");
  setCaptions("brief");
}

// ---------- 2. load ----------

function startLoad() {
  const m = mission();
  load = { fuel: 0, food: 0 };
  $("fuel-hint").textContent =
    `Landing burns 10 fuel for every 1 m/s² of gravity. ${m.planet}'s gravity is ${m.gravity} m/s².`;
  $("food-hint").textContent =
    `The crew eats 10 food for every 1 AU of the planet's distance from the Sun. ` +
    `${m.planet} is ${m.sma_au} AU from the Sun, and the trip takes ${m.trip_days} days.`;
  updateLoad();
  showPhase("load");
  setCaptions("load");
}

function updateLoad() {
  const used = load.fuel + load.food;
  $("load-fuel").textContent = load.fuel;
  $("load-food").textContent = load.food;
  $("budget-text").textContent = `${BUDGET - used} of ${BUDGET} mission points left`;
  $("launch").disabled = used === 0;
}

document.querySelectorAll(".stepper").forEach((stepper) => {
  const key = stepper.dataset.key;
  stepper.querySelectorAll("button").forEach((b) => {
    b.onclick = () => {
      const step = Number(b.dataset.step);
      const room = BUDGET - load.fuel - load.food;
      load[key] += step > 0 ? Math.min(step, room) : Math.max(step, -load[key]);
      updateLoad();
    };
  });
});

// ---------- 3. fly ----------

function launch() {
  const m = mission();
  missionStart = performance.now();
  clockTimer = setInterval(() => ($("clock").textContent = `T+ ${elapsed()}`), 250);

  log(`Loaded ${load.fuel} fuel and ${load.food} food.`);
  log(`Liftoff! Heading for ${m.planet}.`, "good");
  showPhase("fly");
  setCaptions("fly");

  // food runs out at this point of the trip (1 = makes it all the way)
  const foodLastsUntil = Math.min(load.food / m.food, 1);
  const duration = (BASE_SECONDS + m.from_earth / KM_PER_SECOND) * 1000;
  const start = performance.now();
  let halfwayLogged = false;

  function frame(now) {
    const progress = Math.min((now - start) / duration, foodLastsUntil);
    const foodLeft = load.food - m.food * progress;
    drawGauges(load.fuel, foodLeft, m.from_earth * (1 - progress));
    drawDay(progress, m.trip_days);
    moveRocket(progress);

    if (!halfwayLogged && progress >= 0.5) {
      halfwayLogged = true;
      log(`Day ${Math.round(m.trip_days / 2)}: halfway there. ${Math.round(foodLeft)} food left.`);
    }

    if (progress < foodLastsUntil) return requestAnimationFrame(frame);

    if (foodLastsUntil < 1) {
      const kmLeft = (m.from_earth * (1 - progress)).toFixed(1);
      const day = Math.max(1, Math.round(m.trip_days * progress));
      log(`Day ${day}: out of food with ${kmLeft} million km to go.`, "bad");
      return endMission(false, `On day ${day} of ${m.trip_days}, your crew ran out of food ` +
        `${kmLeft} million km from ${m.planet}. This trip needs ${m.food} food; you packed ${load.food}.`);
    }
    log(`Day ${m.trip_days}: arrived at ${m.planet}. Starting landing burn.`);
    land(load.food - m.food);
  }
  requestAnimationFrame(frame);
}

// ---------- 4. land ----------

function land(foodLeft) {
  setCaptions("land");
  const m = mission();
  const fuelLastsUntil = Math.min(load.fuel / m.fuel, 1);
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / (LANDING_SECONDS * 1000), fuelLastsUntil);
    const fuelLeft = load.fuel - m.fuel * progress;
    drawGauges(fuelLeft, foodLeft, 0);
    moveRocket(1, progress * 40);

    if (progress < fuelLastsUntil) return requestAnimationFrame(frame);

    if (fuelLastsUntil < 1) {
      log(`Fuel tanks empty during landing.`, "bad");
      return endMission(false, `Your lander couldn't fight ${m.planet}'s gravity and crashed. ` +
        `Landing on ${m.planet} needs ${m.fuel} fuel; you packed ${load.fuel}.`);
    }
    log(`Touchdown on ${m.planet}!`, "good");
    left = { fuel: fuelLeft, food: foodLeft };
    startSurface();
  }
  requestAnimationFrame(frame);
}

// ---------- 5. collect information on the surface ----------

let collected = {};
let busy = false;
let timeLeft = 0;
let surfaceTimer = null;

function startSurface() {
  const m = mission();
  collected = { rock: 0, picture: 0, ground: 0 };
  busy = false;
  timeLeft = m.minutes * 60;

  $("surface-title").textContent = `On ${m.planet}: collect information`;
  log(`You have ${m.minutes} minute${m.minutes > 1 ? "s" : ""} to collect rocks, pictures and ground samples.`);

  // make the spots: SPOTS_PER_TYPE of each kind, shuffled
  const kinds = [];
  Object.keys(SAMPLES).forEach((k) => { for (let i = 0; i < SPOTS_PER_TYPE; i++) kinds.push(k); });
  kinds.sort(() => Math.random() - 0.5);

  const box = $("spots");
  box.replaceChildren();
  kinds.forEach((kind) => {
    const s = SAMPLES[kind];
    const spot = document.createElement("button");
    spot.className = `spot spot-${kind}`;
    spot.innerHTML = `<span class="spot-label">${s.label}</span><span class="spot-bar"></span>`;
    const img = document.createElement("img");
    img.alt = s.label;
    img.onload = () => spot.querySelector(".spot-label")?.replaceWith(img);
    img.onerror = () => tryJpg(img);
    img.src = s.drawing;
    spot.onclick = () => collect(spot, kind);
    box.append(spot);
  });

  drawQuota();
  drawTimer();
  showPhase("surface");
  setCaptions("surface");
  clearInterval(surfaceTimer);
  surfaceTimer = setInterval(() => {
    timeLeft -= 1;
    drawTimer();
    if (timeLeft <= 0) finishSurface();
  }, 1000);
}

function collect(spot, kind) {
  if (busy || spot.disabled || timeLeft <= 0) return;
  busy = true;
  const s = SAMPLES[kind];
  spot.classList.add("working");
  spot.style.setProperty("--seconds", `${s.seconds}s`);

  setTimeout(() => {
    if (timeLeft <= 0) return;           // time ran out while collecting
    busy = false;
    spot.classList.remove("working");
    spot.classList.add("done");
    spot.disabled = true;
    collected[kind] += 1;
    log(`Collected ${s.plural}: ${collected[kind]} of ${s.need}.`);
    drawQuota();
    if (Object.keys(SAMPLES).every((k) => collected[k] >= SAMPLES[k].need)) finishSurface();
  }, s.seconds * 1000);
}

function drawQuota() {
  $("quota").innerHTML = Object.entries(SAMPLES).map(([k, s]) => {
    const done = collected[k] >= s.need;
    return `<div class="quota-item ${done ? "met" : ""}"><span>${s.plural[0].toUpperCase() + s.plural.slice(1)}</span><strong>${collected[k]} / ${s.need}</strong></div>`;
  }).join("");
}

function drawTimer() {
  const t = Math.max(0, timeLeft);
  $("surface-timer").textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  $("surface-timer").classList.toggle("low", t <= 10);
}

function finishSurface() {
  clearInterval(surfaceTimer);
  busy = false;
  const m = mission();
  const missing = Object.entries(SAMPLES)
    .filter(([k, s]) => collected[k] < s.need)
    .map(([k, s]) => { const n = s.need - collected[k]; return `${n} more ${n === 1 ? s.one : s.plural}`; });

  if (missing.length) {
    log(`Time's up. Still needed: ${missing.join(", ")}.`, "bad");
    return flyHome(false, `You went all the way to ${m.planet} and came back without enough information. ` +
      `You still needed ${missing.join(", ")}.`);
  }
  log(`All information collected on ${m.planet}!`, "good");
  flyHome(true, `You landed on ${m.planet} and brought back every rock, picture and ground sample, ` +
    `with ${timeLeft} seconds to spare.`);
}

// ---------- 6. fly home ----------

let left = { fuel: 0, food: 0 };   // what's left in the tanks after landing

function flyHome(passed, report) {
  const m = mission();
  log(`Lifting off from ${m.planet}. Heading home to Earth.`);
  showPhase("fly");
  setCaptions("home");
  const duration = (BASE_SECONDS + m.from_earth / KM_PER_SECOND) * 1000;
  const start = performance.now();

  function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    const progress = 1 - t;                       // 1 = at the planet, 0 = back at Earth
    drawGauges(left.fuel, left.food, m.from_earth * progress);
    drawDay(t, m.trip_days, "home");
    moveRocket(progress, 0, true);
    if (t < 1) return requestAnimationFrame(frame);

    log(`Splashdown! Back on Earth. Reporting to the boss.`, "good");
    endMission(passed, report);
  }
  requestAnimationFrame(frame);
}

// "Day 130 of 259" during a flight
function drawDay(progress, tripDays, where = "out") {
  const day = Math.min(tripDays, Math.max(1, Math.ceil(tripDays * progress)));
  $("fly-day").textContent = where === "home"
    ? `Flying home · Day ${day} of ${tripDays}`
    : `Day ${day} of ${tripDays}`;
}

function drawGauges(fuel, food, km) {
  const m = mission();
  $("fuel-num").textContent = `${Math.max(0, Math.round(fuel))} / ${load.fuel}`;
  $("food-num").textContent = `${Math.max(0, Math.round(food))} / ${load.food}`;
  $("dist-num").textContent = `${km.toFixed(m.from_earth < 1 ? 3 : 1)} M km`;
  $("fuel-bar").style.width = `${load.fuel ? (fuel / load.fuel) * 100 : 0}%`;
  $("food-bar").style.width = `${load.food ? (food / load.food) * 100 : 0}%`;
  $("dist-bar").style.width = `${(km / m.from_earth) * 100}%`;
}

// ---------- 7. the boss decides ----------

// The boss's words. Change these to whatever your team wants.
const BOSS = {
  name: "The Boss",
  keep:  ["Good work.", "You keep your job."],
  fired: ["That's it.", "YOU'RE FIRED!"],
};

let typing = null;

function endMission(success, text) {
  clearInterval(clockTimer);
  clearInterval(surfaceTimer);
  const last = index === levels.length - 1;
  const lines = success ? BOSS.keep : BOSS.fired;

  $("boss-name").textContent = BOSS.name;
  $("result-title").textContent = success ? "Not fired" : "Fired";
  $("result-title").className = `verdict ${success ? "good" : "bad"}`;
  $("result-title").hidden = true;
  $("result-btn").hidden = true;

  // the boss "talks": the words appear one letter at a time
  const speech = `${text} ${lines.join(" ")}`;
  const bubble = $("result-text");
  bubble.textContent = "";
  clearInterval(typing);
  let i = 0;
  typing = setInterval(() => {
    bubble.textContent = speech.slice(0, ++i);
    if (i >= speech.length) {
      clearInterval(typing);
      $("result-title").hidden = false;
      $("result-btn").hidden = false;
    }
  }, 22);
  log(success ? `The boss says: you keep your job.` : `The boss says: you're fired.`, success ? "good" : "bad");

  const btn = $("result-btn");
  if (!success) {
    btn.textContent = "Try again";
    btn.onclick = startBriefing;
  } else if (!last) {
    btn.textContent = `Next mission: ${levels[index + 1].planet}`;
    btn.onclick = () => { index += 1; startBriefing(); };
  } else {
    btn.textContent = "Play from the start";
    btn.onclick = () => { index = 0; startBriefing(); };
  }
  showPhase("result");
  setCaptions("boss");
}

// ---------- start ----------

async function loadLevels() {
  try {
    const res = await fetch("data/game_data.json");
    if (!res.ok) throw new Error(res.status);
    const json = await res.json();
    return { levels: json.levels, earth: json.earth };
  } catch (err) {
    console.warn("Using backup numbers:", err);
    return { levels: BACKUP_LEVELS, earth: BACKUP_EARTH };
  }
}

document.querySelectorAll("img[data-label]").forEach(useDrawingOrPlaceholder);
$("to-load").onclick = startLoad;
$("back-brief").onclick = () => { showPhase("brief"); setCaptions("brief"); };
$("launch").onclick = launch;

loadLevels().then((data) => {
  earth = data.earth;
  levels = data.levels;
  // planets: work out the real trip time from the Mission Viz orbit numbers
  levels.forEach((m) => {
    if (!m.trip_days) m.trip_days = Math.round(hohmannDays(m.sma_au, earth));
  });
  startBriefing();
});
