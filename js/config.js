// =====================================================================
//  GAME CONFIG  —  the team decides everything in this file.
//
//  Any text that starts with "[TBD]" shows up in the game inside a
//  dashed orange box, so you can see at a glance what is still undecided.
//  The title screen counts how many [TBD] items are left.
//
//  Numbers marked  // TBD  are working guesses so the game runs.
//  Change them to whatever the team agrees on.
//
//  Planet numbers (gravity, distance, temperature) are NOT here.
//  They live in data/game_data.json (Diana's NASA table).
// =====================================================================

const CONFIG = {

  // ---------------------------------------------------------------
  //  Story and names  (owner: Chloe)
  // ---------------------------------------------------------------
  game: {
    title:    "[TBD] Game name",
    tagline:  "[TBD] One-line tagline for the title screen",
    intro:    "[TBD] Opening story, about 3 sentences. Idea from the team: " +
              "the crew member is on their last chance. Fail this mission and you're fired.",
    teamName: "[TBD] Team name",
    startButton: "[TBD] Start button text",
  },

  // ---------------------------------------------------------------
  //  Crew  —  the player picks one  (owner: Chloe + each person)
  //  portrait: put a picture in assets/crew/ and write its path here,
  //            e.g. "assets/crew/chloe.png". Leave "" for initials.
  // ---------------------------------------------------------------
  crew: [
    { id: "chloe", name: "Chloe", role: "[TBD] Job title in the story", backstory: "[TBD] Why this is their last chance", perk: "[TBD] Special ability (or none)", portrait: "" },
    { id: "evan",  name: "Evan",  role: "[TBD] Job title in the story", backstory: "[TBD] Why this is their last chance", perk: "[TBD] Special ability (or none)", portrait: "" },
    { id: "ellie", name: "Ellie", role: "[TBD] Job title in the story", backstory: "[TBD] Why this is their last chance", perk: "[TBD] Special ability (or none)", portrait: "" },
    { id: "max",   name: "Max",   role: "[TBD] Job title in the story", backstory: "[TBD] Why this is their last chance", perk: "[TBD] Special ability (or none)", portrait: "" },
    { id: "diana", name: "Diana", role: "[TBD] Job title in the story", backstory: "[TBD] Why this is their last chance", perk: "[TBD] Special ability (or none)", portrait: "" },
  ],

  // ---------------------------------------------------------------
  //  Rules: NASA numbers -> game numbers  (owners: Evan + Diana)
  // ---------------------------------------------------------------
  rules: {
    budget: 100,              // TBD  mission points the player can spend
    fuelPerGravity: 10,       // TBD  fuel needed = gravity (m/s²) × this
    suppliesPerAU: 10,        // TBD  supplies needed = distance in AU × this  (1 AU = 149.6 million km)
    hotAbove: 50,             // TBD  °C — hotter than this needs a cooler
    coldBelow: -50,           // TBD  °C — colder than this needs a heater
    thermalCost: 10,          // TBD  points for a heater or a cooler
    eventEverySeconds: 25,    // TBD  about how often a bad situation happens on the surface
    scanSeconds: 1.5,         // TBD  how long one scan takes
  },

  // ---------------------------------------------------------------
  //  Levels  —  the team's idea: 3 minutes, then 2, then 1
  //  planet: must match a "name" in data/game_data.json
  // ---------------------------------------------------------------
  levels: [
    { planet: "Moon",    minutes: 3, infoNeeded: 6 },   // TBD infoNeeded
    { planet: "Mars",    minutes: 2, infoNeeded: 6 },   // TBD infoNeeded
    { planet: "Jupiter", minutes: 1, infoNeeded: 6 },   // TBD planet (Jupiter has no surface; Europa?) + infoNeeded
  ],

  // ---------------------------------------------------------------
  //  Planet extras that aren't in the NASA table  (owner: Diana)
  //  image: a NASA picture in assets/planets/, e.g. "assets/planets/mars.jpg"
  //         (write its title + link in README.md -> Sources)
  // ---------------------------------------------------------------
  planets: {
    Moon:    { color: "#b9c2cc", image: "", funFact: "[TBD] Fun fact for the Moon card",    danger: "[TBD] Special danger on the Moon",    shieldCost: 0  },  // TBD shieldCost
    Mars:    { color: "#e0703f", image: "", funFact: "[TBD] Fun fact for the Mars card",    danger: "[TBD] Special danger on Mars",        shieldCost: 5  },  // TBD shieldCost
    Jupiter: { color: "#d9a066", image: "", funFact: "[TBD] Fun fact for the Jupiter card", danger: "[TBD] Special danger at Jupiter",     shieldCost: 20 },  // TBD shieldCost
  },

  // ---------------------------------------------------------------
  //  How the player collects information on the surface (owner: team)
  // ---------------------------------------------------------------
  surface: {
    instructions: "[TBD] Tell the player how to collect information",
    siteNames: ["[TBD] Rock sample", "[TBD] Soil reading", "[TBD] Photo", "[TBD] Air sample"],
  },

  // ---------------------------------------------------------------
  //  Random bad situations  (owner: Chloe for words, Evan for numbers)
  //  Deal with it = costs spare fuel + seconds.  Ignore = mission over.
  // ---------------------------------------------------------------
  events: [
    { title: "[TBD] Bad situation 1", text: "[TBD] What is happening", fuelCost: 5,  timeCost: 10, ignoreMessage: "[TBD] What happens if you ignore it" },
    { title: "[TBD] Bad situation 2", text: "[TBD] What is happening", fuelCost: 8,  timeCost: 8,  ignoreMessage: "[TBD] What happens if you ignore it" },
    { title: "[TBD] Bad situation 3", text: "[TBD] What is happening", fuelCost: 3,  timeCost: 15, ignoreMessage: "[TBD] What happens if you ignore it" },
  ],

  // ---------------------------------------------------------------
  //  Result messages  (owner: Chloe — make them funny)
  // ---------------------------------------------------------------
  messages: {
    noFuel:      "[TBD] Not enough fuel message",
    noSupplies:  "[TBD] Not enough supplies message",
    noHeater:    "[TBD] Forgot the heater message",
    noCooler:    "[TBD] Forgot the cooler message",
    noShield:    "[TBD] Not enough shielding message",
    noSpareFuel: "[TBD] Can't afford to fix the problem message",
    notEnoughInfo: "[TBD] Didn't collect enough information — you're fired",
    levelPassed: "[TBD] Level passed message",
    gameWon:     "[TBD] Beat all levels — job saved message",
  },
};
