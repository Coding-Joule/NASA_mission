// Educational captions shown in the background of the space scene.
// A new caption fades in every few seconds. Each part of the mission has
// its own list, plus facts about the planet you're visiting.
//
// Edit, add or remove lines freely. Check every fact against a NASA page.
// These words get filled in automatically:
//   {planet}  {trip_days}  {sma_au}  {gravity}  {temperature}  {from_earth}

const CAPTION_SECONDS = 7;   // how long each caption stays

const CAPTIONS = {
  // ---- by part of the mission ----
  intro: [
    "Every number in this game comes from NASA: the NASA Planetary Fact Sheet and NASA Mission Viz.",
    "Mission planners have to fit everything a mission needs into one launch. Nothing can be added once it leaves Earth.",
  ],
  brief: [
    "Real missions start with a science question, then engineers work out what the spacecraft needs to answer it.",
    "{planet} is {from_earth} million km from Earth at its closest.",
  ],
  load: [
    "Every bit of weight you launch needs more fuel to lift it. That's why mission planners count every kilogram.",
    "Stronger gravity means more fuel to slow down for landing and to take off again. {planet}'s gravity is {gravity} m/s²; Earth's is 9.8 m/s².",
    "The farther the trip, the more food, water and air the crew has to bring.",
  ],
  fly: [
    "This trip takes {trip_days} days. Spacecraft coast most of the way and fire their engines only at the start and the end.",
    "A Hohmann transfer is the most fuel-saving path between two orbits: half a loop around the Sun on a stretched-out orbit.",
    "{planet} is {sma_au} AU from the Sun. 1 AU is Earth's distance from the Sun, about 150 million km.",
    "Sunlight takes about 8 minutes to travel 1 AU, from the Sun to Earth.",
  ],
  land: [
    "Landers fire their engines downward to slow their fall before touchdown.",
  ],
  surface: [
    "Rock samples tell scientists how a world formed and how old its surface is.",
    "Photos help scientists map the surface and spot changes over time.",
    "Ground samples can show whether water was ever there.",
  ],
  home: [
    "Coming home, the spacecraft has to hit Earth's atmosphere at just the right angle to land safely.",
    "Apollo crews splashed down in the ocean under parachutes after returning from the Moon.",
  ],
  boss: [],
  quiz: [
    "Real mission teams check each other's numbers again and again. One wrong number can end a mission.",
  ],

  // ---- facts about each world (shown during every part of its mission) ----
  planets: {
    Moon: [
      "Twelve astronauts walked on the Moon between 1969 and 1972.",
      "The Moon's gravity is about 1/6 of Earth's. You could jump about six times higher there.",
      "The Moon has no air to hold heat, so its surface swings from about 120 °C in sunlight to about −130 °C at night.",
    ],
    Mars: [
      "A year on Mars lasts 687 Earth days (NASA Mission Viz orbit data).",
      "Mars has Olympus Mons, the tallest volcano in the solar system.",
      "Dust storms on Mars can grow big enough to cover the whole planet.",
      "NASA's Perseverance rover is collecting rock samples on Mars right now.",
    ],
    Europa: [
      "Europa is one of Jupiter's moons. Scientists think it hides a salty ocean under its ice.",
      "NASA's Europa Clipper launched in 2024 to study Europa up close.",
      "Jupiter's radiation is strong enough to damage spacecraft electronics, so Europa missions need shielding.",
      "Jupiter, and Europa with it, takes about 4,333 Earth days, almost 12 years, to go around the Sun (NASA Mission Viz orbit data).",
    ],
  },
};

// "What if...?" problems on the intro screen. Each one is a REAL problem
// NASA had to solve. The player picks a solution, then sees what NASA did.
//   options: the choices (any order)   best: the number of the best choice (0 = first)
//   why:     shown for each choice      real: what NASA actually did
const WHAT_IFS = [
  {
    q: "What if your spacecraft's air filters can't keep up and carbon dioxide starts building up?",
    options: ["Build an adapter from spare parts so the other filters fit",
              "Open a window to let fresh air in",
              "Hold your breath and wait"],
    best: 0,
    why: ["Yes! Use what you have on board.",
          "There's no air outside in space. You'd lose all of yours.",
          "That won't last long enough to fix anything."],
    real: "Apollo 13 (1970): the crew built an adapter out of duct tape, plastic bags and cardboard so the square air filters fit the round holes. It saved their lives.",
  },
  {
    q: "What if dust keeps covering your Mars rover's solar panels?",
    options: ["Power the rover with a nuclear battery that doesn't need sunlight",
              "Paint the panels a darker color",
              "Only drive at night"],
    best: 0,
    why: ["Yes! No sunlight needed, so dust can't stop it.",
          "Dust still blocks the light, whatever the color.",
          "Solar panels make no power at night."],
    real: "A 2018 dust storm ended the Opportunity rover's mission. The newer rovers, Curiosity and Perseverance, use a nuclear power source that keeps working through dust storms.",
  },
  {
    q: "What if a message to Mars takes up to 20 minutes to arrive, so you can't steer your rover live?",
    options: ["Let the rover drive itself and avoid rocks on its own",
              "Drive it like a remote-control car",
              "Never move the rover"],
    best: 0,
    why: ["Yes! The rover can't wait for every instruction.",
          "By the time your command arrives, the rover may have already hit the rock.",
          "Then it can't explore or collect samples."],
    real: "A signal takes about 5 to 20 minutes to travel between Earth and Mars. Perseverance uses its AutoNav system to plan its own path around rocks.",
  },
  {
    q: "What if Mars's air is too thin for parachutes to slow your heavy rover enough to land?",
    options: ["Use a heat shield, a parachute, then rockets that lower the rover on cables",
              "Use a bigger parachute only",
              "Drop it and hope it bounces"],
    best: 0,
    why: ["Yes! Each step slows it down a bit more.",
          "Even a huge parachute can't do it all in Mars's thin air.",
          "A heavy rover would break."],
    real: "Curiosity and Perseverance landed with a heat shield, a parachute and a rocket-powered \"sky crane\" that lowered them to the ground on cables.",
  },
  {
    q: "What if your crew needs water for a long trip, but water is very heavy to launch?",
    options: ["Recycle almost all the water, even sweat and urine",
              "Pack every drop at launch",
              "Collect rain on the way"],
    best: 0,
    why: ["Yes! Recycling means you launch much less.",
          "That would make the rocket far heavier and need more fuel.",
          "There's no rain in space."],
    real: "The International Space Station recycles about 98% of its water, including from sweat and urine, so it needs far less water sent up from Earth.",
  },
  {
    q: "What if Jupiter's radiation could fry your spacecraft's computers near Europa?",
    options: ["Put the electronics inside a thick metal vault",
              "Fly faster so the radiation can't catch you",
              "Turn the computers off the whole time"],
    best: 0,
    why: ["Yes! Thick metal blocks much of the radiation.",
          "You can't outrun radiation.",
          "Then the spacecraft couldn't do any science."],
    real: "NASA's Europa Clipper keeps its most important electronics inside a vault with thick titanium and aluminum walls.",
  },
];
