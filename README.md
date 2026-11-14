# [TBD] Game name

NASA Space Apps Challenge 2026, Norwalk · Challenge: **Space Mission Design Game**

Team: Chloe, Evan, Ellie, Max, Diana

## How to play

1. Pick a crew member. They're on their last chance.
2. Read the mission briefing. Real NASA numbers for the planet are shown.
3. Spend your mission points on fuel, supplies, shielding, a heater or a cooler.
4. Launch. The go/no-go poll checks your packing against the NASA numbers.
5. On the surface, collect enough information before time runs out (3, then 2, then 1 minute).
6. Bad situations pop up. Deal with them (costs spare fuel and time) or ignore them (mission over).
7. Pass all levels to save your job. Fail and you're fired.

## Run it

Plain HTML, CSS and JavaScript. No installs.

```
python -m http.server 8000
```

Then open http://localhost:8000. Double-clicking `index.html` also works, but it
uses the backup numbers in `js/data.js` instead of `data/game_data.json`.

## Where to change things

| What | File | Owner |
|---|---|---|
| Game name, story, crew details, messages, rule numbers, levels, events | `js/config.js` | everyone, see comments |
| NASA planet numbers | `data/game_data.json` (and the backup in `js/data.js`) | Diana |
| Colors and fonts | top of `css/style.css` | [TBD] |
| Crew pictures | `assets/crew/` | [TBD] |
| Planet pictures | `assets/planets/` | Diana |
| ESP32 lights / button | `js/hardware.js` | [TBD] |

Anything in `js/config.js` that starts with `[TBD]` shows in the game with a dashed
orange box, and the title screen counts how many are left.

## How NASA data is used

[TBD] Fill in for the judges. Draft:
We used the NASA Planetary Fact Sheet for the gravity, distance from the Sun and mean
temperature of each planet. In our game, these numbers decide how much fuel, supplies
and temperature gear the player needs.

## Sources

- NASA Planetary Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/
- [TBD] NASA images used (title + link from images.nasa.gov)

## Tools and AI use

- [TBD] List every tool used.
- The starting code was generated with Claude (an AI assistant by Anthropic). [TBD] Describe what the team changed.

## License

[TBD] Pick a license (for example MIT).
