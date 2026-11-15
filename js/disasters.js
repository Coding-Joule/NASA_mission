// Disasters: random problems during the mission (ideas from the team doc:
// asteroids, low oxygen, damaged equipment, dust storms, low power).
//
// "Fix it" costs fuel, food or seconds. "Ignore it" ends the mission.
// where: which worlds it can happen on (leave out to allow all)
// picture: put a drawing at assets/disasters/<id>.png
// Edit freely. Check every "learn" fact against a NASA page.

const DISASTER_CHANCE = 1;   // 1 = always one problem in flight and one on the surface; 0.5 = half the time

const DISASTERS = {
  // ---- during the flight (fix with fuel or food) ----
  flight: [
    {
      id: "asteroid", where: ["Europa"],
      title: "Asteroid ahead!",
      text: "You're crossing the asteroid belt and a rock is heading straight for you.",
      fix: "Fire the thrusters to steer around it", cost: { fuel: 4 },
      ignore: "The asteroid smashed into your spacecraft.",
      learn: "The asteroid belt lies between Mars and Jupiter. It's mostly empty space, but missions to Jupiter still plan their path around known rocks.",
    },
    {
      id: "air-leak",
      title: "Air leak!",
      text: "A tiny hole is letting the cabin's air escape into space.",
      fix: "Use the patch kit and wait for the air to refill", cost: { food: 3 },
      ignore: "The cabin ran out of air.",
      learn: "Space is a vacuum, so even a tiny hole lets air rush out. Crews carry patch kits and spare air.",
    },
    {
      id: "solar-flare",
      title: "Solar flare!",
      text: "The Sun just blasted out a burst of radiation.",
      fix: "Shelter in the shielded part of the ship", cost: { food: 2 },
      ignore: "The radiation made your crew sick.",
      learn: "Solar flares send out bursts of radiation. Spacecraft have shielded areas where crews can shelter until the storm passes.",
    },
    {
      id: "solar-panel",
      title: "Low power!",
      text: "A solar panel stopped working and the batteries are draining.",
      fix: "Go on a spacewalk to repair it", cost: { fuel: 3 },
      ignore: "The batteries died and the ship went dark.",
      learn: "Sunlight gets weaker farther from the Sun. At Jupiter it's about 25 times weaker than at Earth, so NASA's Juno spacecraft needs huge solar panels.",
    },
  ],

  // ---- on the surface (fix with seconds) ----
  surface: [
    {
      id: "dust-storm", where: ["Mars"],
      title: "Dust storm!",
      text: "A huge dust storm is rolling toward your lander.",
      fix: "Shelter in the lander until it passes", cost: { seconds: 15 },
      ignore: "Dust buried your solar panels and your lander lost power.",
      learn: "Dust storms on Mars can cover the whole planet. A 2018 storm covered the solar panels of NASA's Opportunity rover and ended its mission.",
    },
    {
      id: "moon-dust", where: ["Moon"],
      title: "Moon dust jam!",
      text: "Sharp, sticky Moon dust has jammed your tools.",
      fix: "Stop and clean your tools", cost: { seconds: 10 },
      ignore: "Your tools broke and you couldn't finish the job.",
      learn: "Moon dust is sharp and clingy. Apollo astronauts said it got into everything: suits, tools and the lander.",
    },
    {
      id: "radiation", where: ["Europa"],
      title: "Radiation spike!",
      text: "Jupiter's radiation is getting dangerously strong.",
      fix: "Shelter in the lander's shielded room", cost: { seconds: 15 },
      ignore: "Jupiter's radiation fried your computers.",
      learn: "Jupiter's radiation is so strong that NASA's Europa Clipper keeps its electronics inside a thick metal vault.",
    },
    {
      id: "ice-crack", where: ["Europa"],
      title: "The ice is cracking!",
      text: "A crack is opening in the ice next to you.",
      fix: "Move to safer ice", cost: { seconds: 10 },
      ignore: "Your lander slid into the crack.",
      learn: "Europa's icy shell is covered in long cracks and ridges. Scientists think water from below may push up through some of them.",
    },
    {
      id: "equipment",
      title: "Equipment damaged!",
      text: "Your sample arm got bent on a rock.",
      fix: "Repair the arm", cost: { seconds: 12 },
      ignore: "You couldn't collect any more samples.",
      learn: "Rovers and landers are tested on Earth for months, but crews and engineers still have to fix surprises far from home.",
    },
  ],
};
