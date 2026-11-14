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
  { level: 1, planet: "Moon",    distance: 149.6, from_earth: 0.384, gravity: 1.6,  temperature: -20,  fuel: 16,  food: 10 },
  { level: 2, planet: "Mars",    distance: 228.0, from_earth: 78.4,  gravity: 3.7,  temperature: -65,  fuel: 37,  food: 15 },
  { level: 3, planet: "Jupiter", distance: 778.5, from_earth: 628.9, gravity: 23.1, temperature: -110, fuel: 231, food: 52 },
];

const BUDGET = 100;          // mission points to split between fuel and food
const BASE_SECONDS = 2;      // trip time on screen: 2 s + 1 s per 120 million km
const KM_PER_SECOND = 120;
const LANDING_SECONDS = 2;   // how long the landing burn takes on screen

let levels = [];
let index = 0;               // which mission we're on
let load = { fuel: 0, food: 0 };
let missionStart = 0;
let clockTimer = null;

const mission = () => levels[index];

// ---------- helpers ----------

function showPhase(name) {
  ["brief", "load", "fly", "result"].forEach((p) => ($(`phase-${p}`).hidden = p !== name));
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
function useDrawingOrPlaceholder(img) {
  const swap = () => {
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

function moveRocket(progress, down = 0) {
  $("rocket").style.left = `${progress * 100}%`;
  $("rocket").style.transform = `translateX(-50%) translateY(${down}px) rotate(${down ? 90 : 0}deg)`;
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
    ["Gravity", `${m.gravity} m/s²`],
    ["Mean temperature", `${m.temperature} °C`],
  ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  $("brief-goal").textContent =
    `Fly to ${m.planet} and land safely. You have ${BUDGET} mission points to spend on fuel and food.`;

  $("log").replaceChildren();
  log(`Mission ${m.level} briefing: destination ${m.planet}.`);
  showPhase("brief");
}

// ---------- 2. load ----------

function startLoad() {
  const m = mission();
  load = { fuel: 0, food: 0 };
  $("fuel-hint").textContent =
    `Landing burns 10 fuel for every 1 m/s² of gravity. ${m.planet}'s gravity is ${m.gravity} m/s².`;
  $("food-hint").textContent =
    `The crew eats 10 food for every 149.6 million km of the planet's distance from the Sun. ` +
    `${m.planet} is ${m.distance} million km from the Sun.`;
  updateLoad();
  showPhase("load");
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

  // food runs out at this point of the trip (1 = makes it all the way)
  const foodLastsUntil = Math.min(load.food / m.food, 1);
  const duration = (BASE_SECONDS + m.from_earth / KM_PER_SECOND) * 1000;
  const start = performance.now();
  let halfwayLogged = false;

  function frame(now) {
    const progress = Math.min((now - start) / duration, foodLastsUntil);
    const foodLeft = load.food - m.food * progress;
    drawGauges(load.fuel, foodLeft, m.from_earth * (1 - progress));
    moveRocket(progress);

    if (!halfwayLogged && progress >= 0.5) {
      halfwayLogged = true;
      log(`Halfway there. ${Math.round(foodLeft)} food left.`);
    }

    if (progress < foodLastsUntil) return requestAnimationFrame(frame);

    if (foodLastsUntil < 1) {
      const kmLeft = (m.from_earth * (1 - progress)).toFixed(1);
      log(`Out of food with ${kmLeft} million km to go.`, "bad");
      return endMission(false, `Your crew ran out of food ${kmLeft} million km from ${m.planet}. ` +
        `This trip needs ${m.food} food; you packed ${load.food}.`);
    }
    log(`Arrived at ${m.planet}. Starting landing burn.`);
    land(load.food - m.food);
  }
  requestAnimationFrame(frame);
}

// ---------- 4. land ----------

function land(foodLeft) {
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
    const spare = Math.round(fuelLeft + foodLeft + (BUDGET - load.fuel - load.food));
    endMission(true, `You landed safely on ${m.planet} with ${spare} mission points to spare.`);
  }
  requestAnimationFrame(frame);
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

// ---------- 5. result ----------

function endMission(success, text) {
  clearInterval(clockTimer);
  const last = index === levels.length - 1;
  $("result-title").textContent = success ? "Mission success" : "Mission failed";
  $("result-title").className = success ? "good" : "bad";
  $("result-text").textContent = text;

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
}

// ---------- start ----------

async function loadLevels() {
  try {
    const res = await fetch("data/game_data.json");
    if (!res.ok) throw new Error(res.status);
    return (await res.json()).levels;
  } catch (err) {
    console.warn("Using backup numbers:", err);
    return BACKUP_LEVELS;
  }
}

document.querySelectorAll("img[data-label]").forEach(useDrawingOrPlaceholder);
$("to-load").onclick = startLoad;
$("back-brief").onclick = () => showPhase("brief");
$("launch").onclick = launch;

loadLevels().then((data) => {
  levels = data;
  startBriefing();
});
