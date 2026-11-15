// Mini games for collecting samples on the surface (the team doc's
// "do experiments" idea). The surface timer keeps running while you play.
//
//   Rock    -> click DRILL quickly to drill out a rock core
//   Picture -> click SNAP when the moving marker is inside the target
//   Ground  -> press and hold SCOOP until the bar fills
//
// playMiniGame(kind, done) shows the game in the popup and calls
// done(true) when the sample is collected, or done(false) if you back out.

const MINI = {
  rock:    { title: "Drill the rock",   how: "Click DRILL 8 times to drill out a rock core.", clicks: 8,
             learn: "NASA's Perseverance rover drills out rock cores about the size of a piece of chalk." },
  picture: { title: "Take the picture", how: "Click SNAP when the moving marker is inside the green box.",
             learn: "Rovers have lots of cameras. Perseverance has 23 of them." },
  ground:  { title: "Scoop the ground", how: "Press and hold SCOOP until the bar is full. Let go too early and you spill it.", holdSeconds: 2,
             learn: "NASA's Phoenix lander scooped Martian soil with its robotic arm and found water ice just under the surface in 2008." },
};

let miniCleanup = null;

function playMiniGame(kind, done) {
  const g = MINI[kind];
  const s = SAMPLES[kind];
  openModal(`
    <p class="eyebrow">Mini game · ${s.label}</p>
    <h3>${g.title}</h3>
    <p>${g.how}</p>
    <div class="mini-area" id="mini-area"></div>
    <p class="learn"><strong>Did you know?</strong> ${g.learn}</p>
    <div class="row"><button class="ghost" id="mini-quit">Back to the surface</button></div>
  `, "mini");

  const area = $("mini-area");
  const finish = (ok) => { stopMini(); closeModal(); done(ok); };
  $("mini-quit").onclick = () => finish(false);

  if (kind === "rock") {
    let n = 0;
    area.innerHTML = `<div class="bar big"><div class="fill dist" id="mini-bar" style="width:0%"></div></div>
                      <button class="go" id="mini-btn">DRILL</button>`;
    $("mini-btn").onclick = () => {
      n += 1;
      $("mini-bar").style.width = `${(n / g.clicks) * 100}%`;
      if (n >= g.clicks) finish(true);
    };
  }

  if (kind === "picture") {
    const zone = 20 + Math.random() * 55;          // where the green box starts (%)
    const width = 18;                              // how wide the green box is (%)
    area.innerHTML = `<div class="track" id="mini-track">
                        <div class="target" style="left:${zone}%;width:${width}%"></div>
                        <div class="marker" id="mini-marker"></div>
                      </div>
                      <p class="mini-msg" id="mini-msg"></p>
                      <button class="go" id="mini-btn">SNAP</button>`;
    let pos = 0, dir = 1, last = performance.now(), alive = true;
    const step = (now) => {
      if (!alive) return;
      pos += dir * ((now - last) / 1000) * 70;     // 70% of the track per second
      last = now;
      if (pos > 100) { pos = 100; dir = -1; }
      if (pos < 0) { pos = 0; dir = 1; }
      $("mini-marker").style.left = `${pos}%`;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    miniCleanup = () => { alive = false; };
    $("mini-btn").onclick = () => {
      if (pos >= zone && pos <= zone + width) finish(true);
      else $("mini-msg").textContent = "Blurry! Try again.";
    };
  }

  if (kind === "ground") {
    area.innerHTML = `<div class="bar big"><div class="fill food" id="mini-bar" style="width:0%"></div></div>
                      <button class="go" id="mini-btn">SCOOP (hold)</button>`;
    let held = 0, timer = null;
    const btn = $("mini-btn");
    const start = (e) => {
      e.preventDefault();
      clearInterval(timer);
      timer = setInterval(() => {
        held += 0.05;
        $("mini-bar").style.width = `${Math.min(held / g.holdSeconds, 1) * 100}%`;
        if (held >= g.holdSeconds) finish(true);
      }, 50);
    };
    const stop = () => {
      clearInterval(timer);
      if (held < g.holdSeconds) { held = 0; $("mini-bar").style.width = "0%"; }
    };
    btn.addEventListener("pointerdown", start);
    btn.addEventListener("pointerup", stop);
    btn.addEventListener("pointerleave", stop);
    btn.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) start(e); });
    btn.addEventListener("keyup", stop);
    miniCleanup = () => clearInterval(timer);
  }
}

function stopMini() {
  if (miniCleanup) miniCleanup();
  miniCleanup = null;
}
