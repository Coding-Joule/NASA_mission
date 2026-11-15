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
  ["intro", "brief", "load", "fly", "surface", "quiz", "result"].forEach((p) => ($(`phase-${p}`).hidden = p !== name));
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

// ---------- popup (used by disasters and mini games) ----------

let paused = false;      // true while a disaster popup is waiting for an answer

function openModal(html, kind = "") {
  $("modal-box").className = `modal-box ${kind}`;
  $("modal-box").innerHTML = html;
  $("modal").hidden = false;
  $("modal-box").querySelectorAll("img[data-label]").forEach(useDrawingOrPlaceholder);
  $("modal-box").querySelector("button:not(:disabled)")?.focus();
}

function closeModal() {
  $("modal").hidden = true;
  $("modal-box").innerHTML = "";
}

function costText(cost) {
  return Object.entries(cost).map(([k, v]) => k === "seconds" ? `${v} seconds` : `${v} ${k}`).join(" and ");
}

// Pick a disaster for this part of the mission, or null for no disaster.
function pickDisaster(part) {
  if (Math.random() >= DISASTER_CHANCE) return null;
  const m = mission();
  const options = DISASTERS[part].filter((d) => !d.where || d.where.includes(m.planet));
  return options.length ? options[Math.floor(Math.random() * options.length)] : null;
}

// Show a disaster. have = what the player has, e.g. { fuel: 10, food: 4 } or { seconds: 50 }.
function showDisaster(d, have, onFix, onIgnore) {
  paused = true;
  const canFix = Object.entries(d.cost).every(([k, v]) => (have[k] ?? 0) > v);
  log(`Problem: ${d.title}`, "bad");
  openModal(`
    <p class="eyebrow alarm">Problem!</p>
    <div class="disaster">
      <img src="assets/disasters/${d.id}.png" alt="${d.title}" data-label="${d.title} drawing">
      <div>
        <h3>${d.title}</h3>
        <p>${d.text}</p>
      </div>
    </div>
    <p class="learn"><strong>Did you know?</strong> ${d.learn}</p>
    <p class="hint">${canFix ? `Fixing it costs ${costText(d.cost)}.`
                             : `Fixing it costs ${costText(d.cost)}, and you don't have enough left.`}</p>
    <div class="row">
      <button class="go" id="fix" ${canFix ? "" : "disabled"}>${d.fix}</button>
      <button class="ghost danger" id="ignore">Ignore it</button>
    </div>
  `, "disaster-box");
  $("fix").onclick = () => {
    closeModal();
    paused = false;
    log(`Fixed: ${d.fix.toLowerCase()} (${costText(d.cost)}).`);
    onFix(d.cost);
  };
  $("ignore").onclick = () => {
    closeModal();
    log(`Ignored the problem.`, "bad");
    onIgnore(`${d.ignore} Ignoring problems in space can end a mission.`);
  };
}

// ---------- 3. fly ----------

let tank = { fuel: 0, food: 0 };   // what's on board right now

function launch() {
  const m = mission();
  missionStart = performance.now();
  clockTimer = setInterval(() => ($("clock").textContent = `T+ ${elapsed()}`), 250);
  tank = { fuel: load.fuel, food: load.food };
  paused = false;

  log(`Loaded ${load.fuel} fuel and ${load.food} food.`);
  log(`Liftoff! Heading for ${m.planet}.`, "good");
  showPhase("fly");
  setCaptions("fly");

  const duration = (BASE_SECONDS + m.from_earth / KM_PER_SECOND) * 1000;
  const disaster = pickDisaster("flight");
  const disasterAt = 0.3 + Math.random() * 0.4;    // somewhere in the middle of the trip
  let t = 0, last = performance.now(), halfwayLogged = false, disasterDone = !disaster, over = false;

  function frame(now) {
    if (over) return;
    if (!paused) t = Math.min(1, t + (now - last) / duration);
    last = now;
    const foodLeft = tank.food - m.food * t;
    drawGauges(tank.fuel, foodLeft, m.from_earth * (1 - t));
    drawDay(t, m.trip_days);
    moveRocket(t);

    if (foodLeft < -0.001) {
      over = true;
      const kmLeft = (m.from_earth * (1 - t)).toFixed(1);
      const day = Math.max(1, Math.round(m.trip_days * t));
      log(`Day ${day}: out of food with ${kmLeft} million km to go.`, "bad");
      return endMission(false, `On day ${day} of ${m.trip_days}, your crew ran out of food ` +
        `${kmLeft} million km from ${m.planet}. This trip needs ${m.food} food; you packed ${load.food}.`);
    }
    if (!halfwayLogged && t >= 0.5) {
      halfwayLogged = true;
      log(`Day ${Math.round(m.trip_days / 2)}: halfway there. ${Math.round(foodLeft)} food left.`);
    }
    if (!disasterDone && t >= disasterAt) {
      disasterDone = true;
      showDisaster(disaster, { fuel: tank.fuel, food: foodLeft },
        (cost) => { tank.fuel -= cost.fuel || 0; tank.food -= cost.food || 0; },
        (why) => { over = true; endMission(false, why); });
    }
    if (t < 1) return requestAnimationFrame(frame);

    log(`Day ${m.trip_days}: arrived at ${m.planet}. Starting landing burn.`);
    land(Math.max(0, foodLeft));
  }
  requestAnimationFrame(frame);
}

// ---------- 4. land ----------

function land(foodLeft) {
  setCaptions("land");
  const m = mission();
  const fuelLastsUntil = Math.min(tank.fuel / m.fuel, 1);
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / (LANDING_SECONDS * 1000), fuelLastsUntil);
    const fuelLeft = tank.fuel - m.fuel * progress;
    drawGauges(fuelLeft, foodLeft, 0);
    moveRocket(1, progress * 40);

    if (progress < fuelLastsUntil) return requestAnimationFrame(frame);

    if (fuelLastsUntil < 1) {
      log(`Fuel tanks empty during landing.`, "bad");
      return endMission(false, `Your lander couldn't fight ${m.planet}'s gravity and crashed. ` +
        `Landing on ${m.planet} needs ${m.fuel} fuel; you had ${Math.round(tank.fuel)} left.`);
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
  paused = false;
  timeLeft = m.minutes * 60;
  const disaster = pickDisaster("surface");
  // the problem shows up when 40-75% of the time is still left
  const disasterAtSecond = Math.round(timeLeft * (0.4 + Math.random() * 0.35));
  let disasterDone = !disaster;

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
    if (paused) return;
    timeLeft -= 1;
    drawTimer();
    if (timeLeft <= 0) return finishSurface();
    if (!disasterDone && !busy && timeLeft <= disasterAtSecond) {
      disasterDone = true;
      showDisaster(disaster, { seconds: timeLeft },
        (cost) => { timeLeft = Math.max(1, timeLeft - (cost.seconds || 0)); drawTimer(); },
        (why) => endMission(false, why));
    }
  }, 1000);
}

function collect(spot, kind) {
  if (busy || paused || spot.disabled || timeLeft <= 0) return;
  busy = true;
  const s = SAMPLES[kind];
  spot.classList.add("working");
  playMiniGame(kind, (ok) => {
    busy = false;
    spot.classList.remove("working");
    if (!ok || timeLeft <= 0) return;
    spot.classList.add("done");
    spot.disabled = true;
    collected[kind] += 1;
    log(`Collected ${s.plural}: ${collected[kind]} of ${s.need}.`);
    drawQuota();
    if (Object.keys(SAMPLES).every((k) => collected[k] >= SAMPLES[k].need)) finishSurface();
  });
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
  stopMini();
  closeModal();
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
    if (passed) startQuiz(report);
    else endMission(false, report);
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

// ---------- 7. the boss's quiz ----------

function startQuiz(report) {
  const m = mission();
  const questions = buildQuiz(m, levels);
  let n = 0, score = 0;
  showPhase("quiz");
  setCaptions("quiz");
  log(`The boss is giving you a quiz.`);

  function ask() {
    const q = questions[n];
    $("quiz-count").textContent = `Question ${n + 1} of ${questions.length}`;
    $("quiz-q").textContent = q.q;
    $("quiz-why").textContent = "";
    $("quiz-next").hidden = true;
    const box = $("quiz-options");
    box.replaceChildren();
    q.options.forEach((opt) => {
      const b = document.createElement("button");
      b.className = "option";
      b.textContent = opt;
      b.onclick = () => {
        const right = opt === q.right;
        if (right) score += 1;
        box.querySelectorAll("button").forEach((x) => {
          x.disabled = true;
          if (x.textContent === q.right) x.classList.add("right");
        });
        if (!right) b.classList.add("wrong");
        $("quiz-why").textContent = `${right ? "Correct!" : "Not quite."} ${q.why}`;
        $("quiz-next").hidden = false;
        $("quiz-next").textContent = n + 1 < questions.length ? "Next question" : "See what the boss says";
        $("quiz-next").focus();
      };
      box.append(b);
    });
  }

  $("quiz-next").onclick = () => {
    n += 1;
    if (n < questions.length) return ask();
    const ok = score >= QUIZ_PASS;
    log(`Quiz score: ${score} of ${questions.length}.`, ok ? "good" : "bad");
    endMission(ok, ok
      ? `${report} And you got ${score} of ${questions.length} on my quiz, so you really understand the data.`
      : `${report} But you only got ${score} of ${questions.length} on my quiz. A mission planner has to understand the data.`);
  };
  ask();
}

// ---------- 8. the boss decides ----------

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
  stopMini();
  closeModal();
  paused = false;
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
    btn.onclick = showIntro;
  }
  showPhase("result");
  setCaptions("boss");
}

// ---------- start ----------

async function loadLevels() {
  try {
    const res = await fetch("data/game_data.json", { cache: "no-cache" });   // always check for new numbers
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

// ---------- intro ----------

function showIntro() {
  index = 0;
  clearInterval(clockTimer);
  $("clock").textContent = "T+ 00:00:00";
  $("mission-name").textContent = "Mission Control";
  setPlanetPicture(mission().planet);
  moveRocket(0);
  $("log").replaceChildren();
  $("what-ifs").replaceChildren(...WHAT_IFS.map((w) => {
    const card = document.createElement("div");
    card.className = "what-if";
    card.innerHTML = `<p class="wi-q">${w.q}</p><div class="wi-options"></div>
                      <p class="wi-why" aria-live="polite"></p><p class="wi-real"></p>`;
    w.options.forEach((opt, i) => {
      const b = document.createElement("button");
      b.className = "wi-option";
      b.textContent = opt;
      b.dataset.i = i;
      b.onclick = () => {
        card.querySelectorAll(".wi-option").forEach((x) => {
          x.disabled = true;
          if (Number(x.dataset.i) === w.best) x.classList.add("right");
        });
        if (i !== w.best) b.classList.add("wrong");
        card.querySelector(".wi-why").textContent = `${i === w.best ? "Good solution!" : "Not quite."} ${w.why[i]}`;
        card.querySelector(".wi-real").innerHTML = `<strong>What NASA really did:</strong> ${w.real}`;
        card.classList.add("open");
      };
      card.querySelector(".wi-options").append(b);
    });
    // shuffle the choices so the best one isn't always first
    const box = card.querySelector(".wi-options");
    [...box.children].sort(() => Math.random() - 0.5).forEach((c) => box.append(c));
    return card;
  }));
  showPhase("intro");
  setCaptions("intro");
}
$("start-game").onclick = startBriefing;

loadLevels().then((data) => {
  earth = data.earth;
  levels = data.levels;
  // planets: work out the real trip time from the Mission Viz orbit numbers
  levels.forEach((m) => {
    if (!m.trip_days) m.trip_days = Math.round(hohmannDays(m.sma_au, earth));
  });
  showIntro();
});
