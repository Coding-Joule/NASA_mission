// ESP32 hook (worth 5 judging points — 0 if unused).
// The game calls Hardware.signal(...) at key moments. Right now it only
// logs to the browser console. Owner: [TBD]
//
// Ideas: green LED on success, red LED on fail, a physical Launch button.
// Chrome and Edge can talk to an ESP32 over USB with the Web Serial API
// (navigator.serial) using plain JavaScript — no extra libraries.

const Hardware = {
  connected: false,

  // [TBD] connect to the ESP32 here (needs a button click to start)
  async connect() {
    console.log("[hardware] connect() not built yet");
  },

  // moment: "launch" | "success" | "fail" | "event" | "fired" | "won"
  signal(moment) {
    console.log("[hardware] signal:", moment);
    // [TBD] send something to the ESP32, e.g. writer.write("G\n") for green
  },
};
