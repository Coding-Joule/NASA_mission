// =====================================================================
//  Game flow:  title -> crew -> briefing -> pack -> check -> surface -> result
//  Words and numbers come from js/config.js and data/game_data.json.
// =====================================================================

const $ = (id) => document.getElementById(id);

const state = {
  planets: [],        // from game_data.json
  crew: null,         // picked crew member
  level: 0,           // index into CONFIG.levels
  pack: null,         // { fuel, supplies, heater, cooler, shield }
  spareFuel: 0,
  info: 0,
  timeLeft: 0,
  timer: null,
  nextEventAt: 0,
  scanning: false,
  paused: false,
};

// ---------- helpers ----------

// Put text in an element. "[TBD] ..." text gets the dashed placeholder look.
function put(el, text) {
  el.textContent = text;
  el.classList.toggle("tbd", String(text).startsWith("[TBD]"));
}

function show(name) {
  document.querySelectorAll(".screen").forEach((s) => {
    s.hidden = s.dataset.screen !== name;
  });
  window.scrollTo(0, 0);
}

function log(text) { $("strip-log").textContent = text; }

function currentLevel() { return CONFIG.levels[state.level]; }

function currentPlanet() {
  const name = currentLevel().planet;
  const data = state.planets.find((p) => p.name === name);
  if (!data) console.error(`Planet "${name}" is in CONFIG.levels but not in game_data.json`);
  return { ...data, ...(CONFIG.planets[name] || {}) };
}

function countTBD(obj) {
  if (typeof obj === "string") return obj.startsWith("[TBD]") ? 1 : 0;
  if (obj && typeof obj === "object") return Object.values(obj).reduce((n, v) => n + countTBD(v), 0);
  return 0;
}

const AU_KM = 149.6; // million km in 1 AU

// ---------- the rules (Evan + Diana) ----------

function needsFor(planet) {
  const r = CONFIG.rules;
  return {
    fuel:     Math.round(planet.gravity * r.fuelPerGravity),
    supplies: Math.round((planet.distance / AU_KM) * r.suppliesPerAU),
    heater:   planet.temperature < r.coldBelow,
    cooler:   planet.temperature > r.hotAbove,
    shield:   planet.shieldCost || 0,
  };
}

function spent(pack) {
  const r = CONFIG.rules;
  return pack.fuel + pack.supplies + pack.shield +
         (pack.heater ? r.thermalCost : 0) + (pack.cooler ? r.thermalCost : 0);
}

// ---------- 1. title ----------

function renderTitle() {
  const g = CONFIG.game;
  put($("strip-team"), g.teamName);
  put($("t-title"), g.title);
  put($("t-tagline"), g.tagline);
  put($("t-intro"), g.intro);
  put($("t-start"), g.startButton);
  const left = countTBD(CONFIG);
  $("t-tbd").hidden = left === 0;
  $("t-tbd").textContent = `${left} placeholders left to decide in js/config.js`;
  log("STANDBY");
  show("title");
}

// ---------- 2. crew ----------

function renderCrew() {
  const grid = $("crew-grid");
  grid.innerHTML = "";
  CONFIG.crew.forEach((c, i) => {
    const card = document.createElement("button");
    card.className = "crew-card";
    card.type = "button";

    const pic = document.createElement("div");
    pic.className = "crew-pic";
    if (c.portrait) {
      const img = document.createElement("img");
      img.src = c.portrait; img.alt = c.name;
      pic.append(img);
    } else {
      pic.textContent = c.name.slice(0, 2).toUpperCase();
    }

    const file = document.createElement("span");
    file.className = "crew-file mono";
    file.textContent = `FILE ${String(i + 1).padStart(2, "0")}`;

    const name = document.createElement("span");
    name.className = "crew-name";
    name.textContent = c.name;

    const role = document.createElement("span");
    const back = document.createElement("span");
    const perk = document.createElement("span");
    role.className = "crew-role"; back.className = "crew-line"; perk.className = "crew-line";
    put(role, c.role); put(back, c.backstory); put(perk, c.perk);

    card.append(file, pic, name, role, back, perk);
    card.addEventListener("click", () => {
      state.crew = c;
      state.level = 0;
      renderBriefing();
    });
    grid.append(card);
  });
  log("SELECT CREW");
  show("crew");
}

// ---------- 3. briefing ----------

function renderBriefing() {
  const lvl = currentLevel();
  const p = currentPlanet();
  log(`LVL ${state.level + 1}/${CONFIG.levels.length} · ${p.name.toUpperCase()} · CREW ${state.crew.name.toUpperCase()}`);

  $("b-eyebrow").textContent = `Level ${state.level + 1} of ${CONFIG.levels.length} · Mission briefing`;
  $("b-planet").textContent = p.name;
  document.documentElement.style.setProperty("--planet", p.color || "#ccc");

  const art = $("b-art");
  art.innerHTML = "";
  if (p.image) {
    const img = document.createElement("img");
    img.src = p.image; img.alt = p.name;
    art.append(img);
  } else {
    art.classList.add("tbd");
    art.textContent = "[TBD] NASA picture";
  }

  const rows = [
    ["Gravity", `${p.gravity} m/s²`],
    ["Distance from Sun", `${p.distance} M km (${(p.distance / AU_KM).toFixed(1)} AU)`],
    ["Mean temperature", `${p.temperature} °C`],
    ["Time on surface", `${lvl.minutes} min`],
  ];
  $("b-readouts").innerHTML = rows
    .map(([k, v]) => `<div><dt>${k}</dt><dd class="mono">${v}</dd></div>`).join("");

  put($("b-fact"), p.funFact);
  put($("b-danger"), p.danger);
  $("b-goal").textContent = `Land, collect ${lvl.infoNeeded} pieces of information in ${lvl.minutes} minute${lvl.minutes > 1 ? "s" : ""}, and get home.`;
  show("briefing");
}

// ---------- 4. packing ----------

const PACK_ITEMS = [
  { key: "fuel",     label: "Fuel",      hint: "Landing and take-off. Stronger gravity needs more.", kind: "number" },
  { key: "supplies", label: "Supplies",  hint: "Food and water. Farther trips need more.",           kind: "number" },
  { key: "shield",   label: "Shielding", hint: "Protection from the planet's danger.",               kind: "number" },
  { key: "heater",   label: "Heater",    hint: "For very cold places.",                              kind: "toggle" },
  { key: "cooler",   label: "Cooler",    hint: "For very hot places.",                               kind: "toggle" },
];

function renderPack() {
  state.pack = { fuel: 0, supplies: 0, shield: 0, heater: false, cooler: false };
  const box = $("p-manifest");
  box.innerHTML = "";

  PACK_ITEMS.forEach((item) => {
    const row = document.createElement("div");
    row.className = "line";
    row.innerHTML = `
      <div class="line-name"><strong>${item.label}</strong><span>${item.hint}</span></div>
      <div class="line-ctl" data-key="${item.key}"></div>`;
    const ctl = row.querySelector(".line-ctl");

    if (item.kind === "number") {
      [-5, -1].forEach((d) => ctl.append(stepBtn(item.key, d)));
      const val = document.createElement("output");
      val.className = "mono line-val"; val.id = `v-${item.key}`;
      ctl.append(val);
      [1, 5].forEach((d) => ctl.append(stepBtn(item.key, d)));
    } else {
      const t = document.createElement("button");
      t.type = "button"; t.className = "toggle"; t.id = `v-${item.key}`;
      t.addEventListener("click", () => {
        const on = !state.pack[item.key];
        if (on && spent(state.pack) + CONFIG.rules.thermalCost > CONFIG.rules.budget) return;
        state.pack[item.key] = on;
        updatePack();
      });
      ctl.append(t);
    }
    box.append(row);
  });

  updatePack();
  log(`LVL ${state.level + 1} · LOADING`);
  show("pack");
}

function stepBtn(key, delta) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "step";
  b.textContent = (delta > 0 ? "+" : "−") + Math.abs(delta);
  b.addEventListener("click", () => {
    const room = CONFIG.rules.budget - spent(state.pack);
    const change = delta > 0 ? Math.min(delta, room) : Math.max(delta, -state.pack[key]);
    state.pack[key] += change;
    updatePack();
  });
  return b;
}

function updatePack() {
  const r = CONFIG.rules;
  const used = spent(state.pack);
  ["fuel", "supplies", "shield"].forEach((k) => ($(`v-${k}`).textContent = state.pack[k]));
  ["heater", "cooler"].forEach((k) => {
    const t = $(`v-${k}`);
    t.textContent = state.pack[k] ? `Packed (${r.thermalCost})` : `Not packed`;
    t.classList.toggle("on", state.pack[k]);
  });
  $("p-left").textContent = `${r.budget - used} of ${r.budget} points left`;
  $("p-fill").style.width = `${(used / r.budget) * 100}%`;
}

// ---------- 5. launch check ----------

function runCheck() {
  const p = currentPlanet();
  const need = needsFor(p);
  const pack = state.pack;
  const m = CONFIG.messages;

  const checks = [
    { name: "Fuel",      ok: pack.fuel >= need.fuel,         detail: `${pack.fuel} packed / ${need.fuel} needed`,         fail: m.noFuel },
    { name: "Supplies",  ok: pack.supplies >= need.supplies, detail: `${pack.supplies} packed / ${need.supplies} needed`, fail: m.noSupplies },
    { name: "Heater",    ok: !need.heater || pack.heater,    detail: need.heater ? "Needed here" : "Not needed here",      fail: m.noHeater },
    { name: "Cooler",    ok: !need.cooler || pack.cooler,    detail: need.cooler ? "Needed here" : "Not needed here",      fail: m.noCooler },
    { name: "Shielding", ok: pack.shield >= need.shield,     detail: `${pack.shield} packed / ${need.shield} needed`,     fail: m.noShield },
  ];
  const go = checks.every((c) => c.ok);

  $("c-head").textContent = go ? "All stations: GO" : "Launch scrubbed";
  const poll = $("c-poll");
  poll.innerHTML = "";
  checks.forEach((c, i) => {
    const li = document.createElement("li");
    li.className = c.ok ? "go" : "nogo";
    li.style.animationDelay = `${i * 180}ms`;
    li.innerHTML = `<span class="poll-name">${c.name}</span><span class="mono poll-detail">${c.detail}</span><span class="poll-call mono">${c.ok ? "GO" : "NO-GO"}</span>`;
    if (!c.ok) {
      const why = document.createElement("span");
      why.className = "poll-why";
      put(why, c.fail);
      li.append(why);
    }
    poll.append(li);
  });

  Hardware.signal("launch");
  const btn = $("c-next");
  if (go) {
    state.spareFuel = pack.fuel - need.fuel;
    btn.textContent = "Land";
    btn.onclick = startSurface;
    log(`LVL ${state.level + 1} · GO FOR LANDING`);
  } else {
    btn.textContent = "See the result";
    btn.onclick = () => endLevel(false, checks.find((c) => !c.ok).fail);
    log(`LVL ${state.level + 1} · SCRUB`);
  }
  show("check");
}

// ---------- 6. surface ----------

function startSurface() {
  const lvl = currentLevel();
  state.info = 0;
  state.timeLeft = lvl.minutes * 60;
  state.paused = false;
  state.scanning = false;
  scheduleEvent();

  put($("s-howto"), CONFIG.surface.instructions);
  const sites = $("s-sites");
  sites.innerHTML = "";
  const names = CONFIG.surface.siteNames;
  for (let i = 0; i < 12; i++) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "site";
    const label = names[i % names.length];
    b.innerHTML = `<span class="mono site-id">S-${String(i + 1).padStart(2, "0")}</span><span class="site-name"></span><span class="site-bar"></span>`;
    put(b.querySelector(".site-name"), label);
    b.addEventListener("click", () => scan(b));
    sites.append(b);
  }

  updateHud();
  log(`LVL ${state.level + 1} · ON SURFACE`);
  show("surface");
  clearInterval(state.timer);
  state.timer = setInterval(tick, 1000);
}

function scheduleEvent() {
  const base = CONFIG.rules.eventEverySeconds;
  const wait = base * (0.6 + Math.random() * 0.8);
  state.nextEventAt = state.timeLeft - wait;
}

function tick() {
  if (state.paused) return;
  state.timeLeft -= 1;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    updateHud();
    return finishSurface();
  }
  if (state.timeLeft <= state.nextEventAt && CONFIG.events.length) triggerEvent();
  updateHud();
}

function scan(btn) {
  if (state.scanning || state.paused || btn.classList.contains("done")) return;
  state.scanning = true;
  btn.classList.add("scanning");
  btn.style.setProperty("--scan", `${CONFIG.rules.scanSeconds}s`);
  setTimeout(() => {
    btn.classList.remove("scanning");
    btn.classList.add("done");
    state.scanning = false;
    state.info += 1;
    updateHud();
    if (state.info >= currentLevel().infoNeeded) finishSurface();
  }, CONFIG.rules.scanSeconds * 1000);
}

function updateHud() {
  const t = Math.max(0, state.timeLeft);
  $("s-time").textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  $("s-time").classList.toggle("warn", t <= 15);
  $("s-info").textContent = `${state.info} / ${currentLevel().infoNeeded}`;
  $("s-fuel").textContent = state.spareFuel;
}

function triggerEvent() {
  state.paused = true;
  const ev = CONFIG.events[Math.floor(Math.random() * CONFIG.events.length)];
  put($("a-title"), ev.title);
  put($("a-text"), ev.text);
  const canAfford = state.spareFuel >= ev.fuelCost;
  $("a-cost").textContent = canAfford
    ? `Fix costs ${ev.fuelCost} fuel and ${ev.timeCost} seconds`
    : `Fix costs ${ev.fuelCost} fuel — you only have ${state.spareFuel} spare`;
  $("a-deal").disabled = !canAfford;
  $("alarm").hidden = false;
  $("a-deal").focus();
  Hardware.signal("event");

  $("a-deal").onclick = () => {
    state.spareFuel -= ev.fuelCost;
    state.timeLeft = Math.max(1, state.timeLeft - ev.timeCost);
    closeAlarm();
  };
  $("a-ignore").onclick = () => {
    closeAlarm(true);
    endLevel(false, canAfford ? ev.ignoreMessage : CONFIG.messages.noSpareFuel);
  };
}

function closeAlarm(stop) {
  $("alarm").hidden = true;
  if (stop) return;
  state.paused = false;
  scheduleEvent();
  updateHud();
}

function finishSurface() {
  clearInterval(state.timer);
  const passed = state.info >= currentLevel().infoNeeded;
  endLevel(passed, passed ? CONFIG.messages.levelPassed : CONFIG.messages.notEnoughInfo);
}

// ---------- 7. result ----------

function endLevel(passed, message) {
  clearInterval(state.timer);
  state.paused = true;
  const last = state.level === CONFIG.levels.length - 1;
  const stamp = $("r-stamp");
  const btn = $("r-next");

  if (passed && last) {
    stamp.textContent = "Job saved";
    stamp.className = "stamp stamp-go";
    put($("r-msg"), CONFIG.messages.gameWon);
    btn.textContent = "Play again";
    btn.onclick = renderCrew;
    Hardware.signal("won");
  } else if (passed) {
    stamp.textContent = "Approved";
    stamp.className = "stamp stamp-go";
    put($("r-msg"), message);
    btn.textContent = `Next: level ${state.level + 2}`;
    btn.onclick = () => { state.level += 1; renderBriefing(); };
    Hardware.signal("success");
  } else {
    stamp.textContent = "Fired";
    stamp.className = "stamp stamp-stop";
    put($("r-msg"), message);
    btn.textContent = "Pick a crew member and try again";
    btn.onclick = renderCrew;
    Hardware.signal("fired");
  }
  log(passed ? `LVL ${state.level + 1} · COMPLETE` : `LVL ${state.level + 1} · MISSION LOST`);
  show("result");
}

// ---------- start ----------

$("t-start").addEventListener("click", renderCrew);
$("b-next").addEventListener("click", renderPack);
$("p-back").addEventListener("click", renderBriefing);
$("p-launch").addEventListener("click", runCheck);

loadPlanets().then(({ planets, fromFile }) => {
  state.planets = planets;
  $("strip-src").textContent = fromFile ? "DATA: NASA FACT SHEET" : "DATA: BACKUP COPY";
  renderTitle();
});
