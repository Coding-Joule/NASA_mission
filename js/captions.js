// Educational captions shown in the background of the space scene.
// A new caption fades in every few seconds. Each part of the mission has
// its own list, plus facts about the planet you're visiting.
//
// Edit, add or remove lines freely (Chloe: story voice, Diana: check facts).
// These words get filled in automatically:
//   {planet}  {trip_days}  {sma_au}  {gravity}  {temperature}  {from_earth}

const CAPTION_SECONDS = 7;   // how long each caption stays

const CAPTIONS = {
  // ---- by part of the mission ----
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
