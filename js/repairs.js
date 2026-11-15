// Repair tasks: when you choose to fix a disaster, you have to actually do
// the repair first. Each disaster uses the task that fits it.
//
//   wires    -> connect each colored wire to the same color
//   patch    -> click every hole (or dust spot) to seal or wipe it
//   keypad   -> type the 4-digit shelter door code
//   thruster -> hold the button, let go when the power is in the green zone
//
// playRepair(disaster, done) shows the task in the popup and calls done()
// when the repair is finished.

const REPAIR_FOR = {
  "solar-panel": "wires",
  "equipment":   "wires",
  "air-leak":    "patch",
  "moon-dust":   "patch",
  "solar-flare": "keypad",
  "dust-storm":  "keypad",
  "radiation":   "keypad",
  "asteroid":    "thruster",
  "ice-crack":   "thruster",
};

let repairCleanup = null;

function stopRepair() {
  if (repairCleanup) repairCleanup();
  repairCleanup = null;
}

function playRepair(d, done) {
  const kind = REPAIR_FOR[d.id] || "patch";
  const titles = {
    wires: "Connect the wires",
    patch: d.id === "moon-dust" ? "Wipe off the dust" : "Patch the holes",
    keypad: "Open the shelter door",
    thruster: "Fire the thrusters",
  };
  const how = {
    wires: "Click a wire on the left, then the wire of the same color on the right. Connect all 4.",
    patch: d.id === "moon-dust" ? "Click every dust spot to wipe it clean." : "Click every hole to seal it.",
    keypad: "Type the code shown on the door panel.",
    thruster: "Hold the button to build up power. Let go when the bar is in the green zone.",
  };
  openModal(`
    <p class="eyebrow">Repair task · ${d.title}</p>
    <h3>${titles[kind]}</h3>
    <p>${how[kind]}</p>
    <div class="task" id="task"></div>
    <p class="mini-msg" id="task-msg" aria-live="polite"></p>
  `, "repair-box");
  const area = $("task");
  const finish = () => { stopRepair(); done(); };

  if (kind === "wires") {
    const colors = [["red", "#ff5a5a"], ["blue", "#5aa0ff"], ["yellow", "#ffd84a"], ["green", "#5ee08a"]];
    const left = shuffle(colors), right = shuffle(colors);
    area.innerHTML = `<div class="wires"><div class="wcol" id="wl"></div><div class="wmid" id="wmid"></div><div class="wcol" id="wr"></div></div>`;
    let picked = null, joined = 0;
    left.forEach(([name, hex]) => {
      const b = document.createElement("button");
      b.className = "wire"; b.style.background = hex; b.textContent = name; b.dataset.c = name;
      b.onclick = () => {
        if (b.disabled) return;
        $("wl").querySelectorAll(".wire").forEach((x) => x.classList.remove("picked"));
        b.classList.add("picked"); picked = b;
      };
      $("wl").append(b);
    });
    right.forEach(([name, hex]) => {
      const b = document.createElement("button");
      b.className = "wire"; b.style.background = hex; b.textContent = name; b.dataset.c = name;
      b.onclick = () => {
        if (!picked || b.disabled) return;
        if (picked.dataset.c === name) {
          picked.disabled = b.disabled = true;
          picked.classList.remove("picked"); picked.classList.add("joined"); b.classList.add("joined");
          picked = null; joined += 1;
          Music.sfx("click");
          $("task-msg").textContent = `${joined} of 4 connected`;
          if (joined === 4) finish();
        } else {
          $("task-msg").textContent = "Wrong color! Match the same color.";
        }
      };
      $("wr").append(b);
    });
  }

  if (kind === "patch") {
    const n = 5;
    area.innerHTML = `<div class="panel-area ${d.id === "moon-dust" ? "dusty" : "hull"}" id="spots-area"></div>`;
    let left = n;
    for (let i = 0; i < n; i++) {
      const b = document.createElement("button");
      b.className = d.id === "moon-dust" ? "spot-fix dust" : "spot-fix hole";
      b.setAttribute("aria-label", d.id === "moon-dust" ? "Dust spot" : "Hole");
      b.style.left = `${8 + Math.random() * 78}%`;
      b.style.top = `${10 + Math.random() * 70}%`;
      b.onclick = () => {
        b.disabled = true; b.classList.add("fixed");
        Music.sfx("click");
        left -= 1;
        $("task-msg").textContent = left ? `${left} left` : "";
        if (!left) finish();
      };
      $("spots-area").append(b);
    }
  }

  if (kind === "keypad") {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    area.innerHTML = `<div class="door"><p class="door-code">DOOR CODE <strong>${code}</strong></p>
      <p class="door-entry" id="entry">____</p>
      <div class="keypad" id="keypad"></div></div>`;
    let typed = "";
    const show = () => ($("entry").textContent = (typed + "____").slice(0, 4));
    [..."123456789", "C", "0"].forEach((k) => {
      const b = document.createElement("button");
      b.className = "key"; b.textContent = k;
      b.onclick = () => {
        Music.sfx("click");
        if (k === "C") { typed = ""; return show(); }
        typed += k; show();
        if (typed.length === 4) {
          if (typed === code) finish();
          else { $("task-msg").textContent = "Wrong code! Try again."; typed = ""; setTimeout(show, 300); }
        }
      };
      $("keypad").append(b);
    });
  }

  if (kind === "thruster") {
    const zone = 55 + Math.random() * 25;          // where the green zone starts (%)
    const width = 15;
    area.innerHTML = `<div class="thrust"><div class="thrust-bar">
        <div class="thrust-zone" style="bottom:${zone}%;height:${width}%"></div>
        <div class="thrust-fill" id="tfill"></div></div>
        <button class="go" id="tbtn">HOLD TO FIRE</button></div>`;
    // Power is worked out from how long you've held the button (the clock),
    // so it works the same on slow or busy computers.
    const RATE = 45;                               // % of power per second of holding
    let heldSince = null, alive = true;
    const powerNow = () => heldSince === null ? 0 : Math.min(100, ((performance.now() - heldSince) / 1000) * RATE);
    const step = () => {
      if (!alive) return;
      $("tfill").style.height = `${powerNow()}%`;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    repairCleanup = () => { alive = false; };
    const btn = $("tbtn");
    const down = (e) => { e.preventDefault(); if (heldSince === null) heldSince = performance.now(); $("task-msg").textContent = ""; };
    const up = () => {
      if (heldSince === null) return;
      const power = powerNow();
      heldSince = null;
      $("tfill").style.height = `${power}%`;
      if (power >= zone && power <= zone + width) finish();
      else $("task-msg").textContent = power < zone ? "Not enough power! Hold longer." : "Too much power! Let go sooner.";
    };
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", up);
    btn.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) down(e); });
    btn.addEventListener("keyup", up);
  }
}
