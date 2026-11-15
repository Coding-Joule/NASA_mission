// Music and sound effects, made live in the browser with the Web Audio API.
// Style: eerie, mysterious "space mystery" music (a ghostly whistle with
// wobble and echo over dark minor chords). The tune is our own original one.
// No music files: every note is generated here, so it's 100% original,
// works offline, and has no copyright problems.
//
// Music.start()         call once after the player's first click (browsers require it)
// Music.mood(name)      "calm" | "travel" | "surface" | "tense" | "quiet"
// Music.sfx(name)       "launch" | "land" | "collect" | "alarm" | "fix" | "win" | "lose" | "click"
// Music.toggle()        music and sounds on/off (remembered on this device)

const Music = (() => {
  // ---- settings you can change ----
  const VOLUME = 0.5;                        // overall loudness, 0 to 1
  const MOODS = {
    //            beats per minute, arpeggio, bass pulse, pad, ghostly whistle
    calm:    { bpm: 76,  arp: true,  bass: false, pad: true,  whistle: true },
    travel:  { bpm: 88,  arp: true,  bass: true,  pad: true,  whistle: true },
    surface: { bpm: 108, arp: true,  bass: true,  pad: false, whistle: false },
    tense:   { bpm: 132, arp: false, bass: true,  pad: false, whistle: false },
    quiet:   { bpm: 70,  arp: false, bass: false, pad: true,  whistle: false },
  };
  // Dark minor chords: C minor → A-flat → F minor → G (MIDI note numbers)
  const CHORDS = [[48, 51, 55], [44, 48, 51], [41, 44, 48], [43, 47, 50]];
  // Our own spooky whistle tune: one note per 2 beats, null = rest
  const WHISTLE = [72, null, 75, 74, 72, null, 67, null, 68, 67, 65, null, 67, null, null, null];

  let ctx = null, master, musicBus, sfxBus;
  let on = true, current = "calm", timer = null, beat = 0, nextTime = 0;
  try { on = localStorage.getItem("music") !== "off"; } catch (e) { /* storage blocked: default on */ }

  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  function setup() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;                    // very old browser: play silently
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = on ? VOLUME : 0;
    master.connect(ctx.destination);

    // a soft echo makes it sound like space
    const echo = ctx.createDelay(1);
    echo.delayTime.value = 0.45;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.45;
    echo.connect(feedback); feedback.connect(echo); echo.connect(master);

    musicBus = ctx.createGain(); musicBus.gain.value = 0.32;
    musicBus.connect(master); musicBus.connect(echo);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55;
    sfxBus.connect(master);
    return true;
  }

  // one note: oscillator → filter → volume envelope
  function note(midi, when, length, { type = "sine", vol = 0.2, attack = 0.02, cutoff = 2400, bus = musicBus, slideTo = null, wobble = 0 } = {}) {
    const osc = ctx.createOscillator();
    if (wobble) {                              // vibrato: the ghostly "wobble" of the whistle
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 5.5;
      depth.gain.value = hz(midi) * wobble;
      lfo.connect(depth); depth.connect(osc.frequency);
      lfo.start(when); lfo.stop(when + length + 0.05);
    }
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(hz(midi), when);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(hz(slideTo), when + length);
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(vol, when + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + length);
    osc.connect(filter); filter.connect(amp); amp.connect(bus);
    osc.start(when);
    osc.stop(when + length + 0.05);
  }

  // plan the next notes a little ahead of time, so the beat never stutters
  function scheduler() {
    const m = MOODS[current];
    const beatLen = 60 / m.bpm;
    while (nextTime < ctx.currentTime + 0.25) {
      const chord = CHORDS[Math.floor(beat / 8) % CHORDS.length];
      if (m.pad && beat % 8 === 0) {
        chord.forEach((n) => note(n + 12, nextTime, beatLen * 8, { type: "triangle", vol: 0.06, attack: 1.2, cutoff: 800 }));
      }
      if (m.arp) {
        // quick, bell-like notes high up, like a mysterious piano
        const pattern = [0, 2, 1, 2];
        const n = chord[pattern[beat % 4]] + 24;
        note(n, nextTime, beatLen * 1.2, { type: "sine", vol: 0.07, attack: 0.005, cutoff: 4000 });
      }
      if (m.whistle && beat % 2 === 0) {
        const w = WHISTLE[(beat / 2) % WHISTLE.length];
        if (w !== null) note(w, nextTime, beatLen * 2.2, { type: "sine", vol: 0.1, attack: 0.25, cutoff: 3000, wobble: 0.012 });
      }
      if (m.bass) {
        note(chord[0] - 12, nextTime, beatLen * 0.45, { type: "square", vol: current === "tense" ? 0.09 : 0.05, cutoff: 500 });
      }
      nextTime += beatLen;
      beat += 1;
    }
  }

  function start() {
    if (!setup()) return;
    if (ctx.state === "suspended") ctx.resume();
    if (timer) return;
    nextTime = ctx.currentTime + 0.1;
    timer = setInterval(scheduler, 100);
  }

  function mood(name) {
    if (!MOODS[name] || name === current) return;
    current = name;
  }

  function sfx(name) {
    if (!ctx || !on) return;
    const t = ctx.currentTime + 0.01;
    const s = { bus: sfxBus };
    const play = {
      click:   () => note(84, t, 0.08, { ...s, type: "sine", vol: 0.15 }),
      collect: () => { note(76, t, 0.12, { ...s, vol: 0.25 }); note(83, t + 0.08, 0.2, { ...s, vol: 0.25 }); },
      fix:     () => { note(67, t, 0.12, { ...s, type: "triangle", vol: 0.3 }); note(74, t + 0.1, 0.25, { ...s, type: "triangle", vol: 0.3 }); },
      alarm:   () => { for (let i = 0; i < 3; i++) { note(81, t + i * 0.3, 0.14, { ...s, type: "square", vol: 0.12, cutoff: 3000 }); note(76, t + i * 0.3 + 0.15, 0.14, { ...s, type: "square", vol: 0.12, cutoff: 3000 }); } },
      launch:  () => note(36, t, 1.6, { ...s, type: "sawtooth", vol: 0.25, attack: 0.2, cutoff: 700, slideTo: 60 }),
      land:    () => note(60, t, 1.0, { ...s, type: "sawtooth", vol: 0.2, attack: 0.05, cutoff: 600, slideTo: 36 }),
      win:     () => [60, 64, 67, 72].forEach((n, i) => note(n, t + i * 0.14, 0.5, { ...s, type: "triangle", vol: 0.3 })),
      lose:    () => [67, 63, 60, 55].forEach((n, i) => note(n, t + i * 0.22, 0.6, { ...s, type: "triangle", vol: 0.3 })),
    }[name];
    if (play) play();
  }

  function toggle() {
    on = !on;
    try { localStorage.setItem("music", on ? "on" : "off"); } catch (e) { /* ignore */ }
    if (setup()) {
      start();
      master.gain.setTargetAtTime(on ? VOLUME : 0, ctx.currentTime, 0.1);
    }
    return on;
  }

  return { start, mood, sfx, toggle, isOn: () => on };
})();
