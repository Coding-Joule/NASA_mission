// The boss's quiz: after a successful mission the boss checks whether you
// learned from the NASA data. Most questions are built from
// data/game_data.json, so they always match the numbers in the game.
//
// QUIZ_LENGTH questions per mission; you need QUIZ_PASS right to keep your job.

const QUIZ_LENGTH = 3;
const QUIZ_PASS = 2;

// Extra fact questions for each world (edit freely; first answer = correct).
const QUIZ_FACTS = {
  Moon: [
    { q: "How many astronauts have walked on the Moon?", a: ["12", "3", "50"],
      why: "Twelve astronauts walked on the Moon between 1969 and 1972." },
    { q: "Why does the Moon get so hot and so cold?", a: ["It has no air to hold heat", "It's very close to the Sun", "It spins very fast"],
      why: "With no air to trap heat, the Moon swings from about 120 °C in sunlight to about −130 °C at night." },
  ],
  Mars: [
    { q: "What is the tallest volcano in the solar system?", a: ["Olympus Mons on Mars", "Mount Everest on Earth", "Mauna Kea on Earth"],
      why: "Olympus Mons on Mars is the tallest volcano in the solar system." },
    { q: "What ended NASA's Opportunity rover's mission in 2018?", a: ["A dust storm covered its solar panels", "It fell into a crater", "It ran out of food"],
      why: "A planet-wide dust storm covered Opportunity's solar panels." },
  ],
  Europa: [
    { q: "What might be hidden under Europa's ice?", a: ["A salty ocean", "A layer of lava", "A forest"],
      why: "Scientists think Europa has a salty ocean under its icy shell." },
    { q: "Which NASA mission launched in 2024 to study Europa?", a: ["Europa Clipper", "Apollo 11", "Perseverance"],
      why: "Europa Clipper launched in 2024 to study Europa up close." },
  ],
};

function shuffle(list) {
  return list.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
}

// Build a question whose wrong answers are the other worlds' numbers.
function numberQuestion(q, m, all, key, unit, why) {
  const right = `${m[key]}${unit}`;
  const wrong = [...new Set(all.filter((o) => o[key] !== m[key]).map((o) => `${o[key]}${unit}`))];
  return { q, a: [right, ...wrong.slice(0, 2)], why };
}

function buildQuiz(m, all) {
  const dataQuestions = [
    numberQuestion(`What is ${m.planet}'s gravity?`, m, all, "gravity", " m/s²",
      `${m.planet}'s gravity is ${m.gravity} m/s², which is why landing took ${m.fuel} fuel.`),
    numberQuestion(`How many days did the trip to ${m.planet} take?`, m, all, "trip_days", " days",
      `The trip took ${m.trip_days} days.`),
    numberQuestion(`What is the mean temperature on ${m.planet}?`, m, all, "temperature", " °C",
      `${m.planet}'s mean temperature is ${m.temperature} °C (NASA Planetary Fact Sheet).`),
    { q: `Why did landing on ${m.planet} need ${m.fuel} fuel?`,
      a: [`Its gravity is ${m.gravity} m/s², and stronger gravity needs more fuel`,
          "Because it's far from the Sun", "Because it's very cold"],
      why: "Landing fuel depends on gravity: stronger gravity pulls harder, so you need more fuel to slow down." },
    { q: `Why did the trip to ${m.planet} need ${m.food} food?`,
      a: [`It's ${m.sma_au} AU from the Sun, and farther trips need more food`,
          "Because its gravity is strong", "Because it's hot there"],
      why: "Food depends on distance: the farther the trip, the longer the crew needs to eat." },
  ];
  const facts = QUIZ_FACTS[m.planet] || [];
  // mostly data questions, plus one fact question if there is one
  const picked = [...shuffle(dataQuestions).slice(0, QUIZ_LENGTH - (facts.length ? 1 : 0)),
                  ...shuffle(facts).slice(0, 1)];
  return shuffle(picked).map((x) => ({ q: x.q, right: x.a[0], options: shuffle(x.a), why: x.why }));
}
