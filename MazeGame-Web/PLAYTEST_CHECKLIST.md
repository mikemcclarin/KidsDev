# Maze Pitfalls - Playtest Checklist

Use this checklist to simulate testing the game like you would with kids.

## Session Setup
- [ ] Game running at http://localhost:8000
- [ ] Full screen browser (F11 or maximize)
- [ ] Sound on (if you add audio later)
- [ ] Controller plugged in (optional - for future)

## Level 1 - Controls & Movement
- [ ] Player (red square) appears at bottom-left
- [ ] Arrow keys move player left/right
- [ ] WASD also works for movement
- [ ] Spacebar makes player jump
- [ ] Player can't move past left/right edges
- [ ] Player gravity works (falls when in air)
- [ ] Player lands on platforms

## Level 1 - Hazards
- [ ] Can see pits (black holes) clearly
- [ ] Falling in pit loses a life
- [ ] Life counter decreases after pit fall
- [ ] Player respawns at starting position after pit
- [ ] Can see spikes (yellow) clearly
- [ ] Touching spike loses a life
- [ ] Spike hit respawns player

## Level 1 - Win Condition
- [ ] Green EXIT label visible at top-right
- [ ] Jump to platforms and reach EXIT
- [ ] Reaching EXIT shows "LEVEL COMPLETE!" screen
- [ ] Next Level button works
- [ ] Level counter increments to 2

## Level 2 - Difficulty Increase
- [ ] More platforms than Level 1
- [ ] More pits and spikes
- [ ] Platform layout is different
- [ ] Requires better timing/jumping
- [ ] Exit in harder position

## UI & HUD
- [ ] Lives counter shows "Lives: 10" at start
- [ ] Level counter shows "Level: 1" at start
- [ ] Lives update after each hazard hit
- [ ] Level updates when level completes
- [ ] Font is readable (large)
- [ ] Colors: Red (lives), Green (level), Yellow (goal)

## Game Over Scenario
- [ ] Fall into pits 10 times (intentionally)
- [ ] "GAME OVER!" screen appears after 10th loss
- [ ] Game Over screen is centered on canvas
- [ ] Restart button works
- [ ] Game resets to Level 1 with 10 lives

## Controls Edge Cases
- [ ] Can't jump while already jumping (no double-jump exploit)
- [ ] Can move while jumping
- [ ] Can't move past screen boundaries
- [ ] Landing on platform stops falling

## Difficulty Assessment (Rate 1-5, 5=too hard)
- [ ] Level 1 difficulty: ___/5
- [ ] Level 2 difficulty: ___/5
- [ ] Jumps feel responsive: ___/5
- [ ] Graphics clarity (see all objects clearly): ___/5

## Bugs/Issues Found

(Note any crashes, unresponsive controls, collision issues, etc.)

```
Issue 1: ___________________________________________
How to reproduce: _________________________________
Severity: Minor / Medium / Major


Issue 2: ___________________________________________
How to reproduce: _________________________________
Severity: Minor / Medium / Major
```

## Fun Factor Assessment

- [ ] Game is fun (would kid play again?)
- [ ] Controls feel good
- [ ] Levels are engaging
- [ ] Difficulty progression makes sense
- [ ] Visual feedback is clear

## Feedback Summary

**What worked well:**
- ___________________________________________
- ___________________________________________

**What needs improvement:**
- ___________________________________________
- ___________________________________________

**Top priority fix:**
- ___________________________________________

## Next Steps

- [ ] Fix any critical bugs
- [ ] Balance difficulty if needed
- [ ] Add more levels (3-10)
- [ ] Add moving obstacles
- [ ] Add bonus life pickups
- [ ] Add sound effects
- [ ] Test with actual kids

---

## Quick Test Scenarios

### Scenario 1: Normal Playthrough
1. Start game (should see Level 1 with 10 lives)
2. Navigate platforms using arrow keys
3. Jump over first pit
4. Jump over second pit
5. Reach green EXIT
6. See "Level Complete!" screen
7. Click "Next Level"
8. Should be on Level 2 now

### Scenario 2: Game Over
1. Start game
2. Intentionally fall into pits/spikes 10 times
3. After 10th loss, should see "GAME OVER!" screen
4. Click "Restart"
5. Should reset to Level 1 with 10 lives

### Scenario 3: Edge Cases
1. Move to left edge - should stop (not fall off)
2. Move to right edge - should stop (not fall off)
3. Try double-jump - should only jump once while airborne
4. Try jumping while on pit's edge - should work normally

---

**Tester:** _____________  
**Date:** _____________  
**Notes:** _____________
