# Maze Pitfalls - Gameplay Analysis & Iteration Plan

## Current Game State
- **Levels:** 10 levels designed with increasing complexity
- **Features:** Coins, moving obstacles, sound effects, lives system
- **Issues to Evaluate:**
  1. Are platforms too small/hard to land on?
  2. Is jump height/velocity correct?
  3. Are moving obstacles too fast/slow?
  4. Is difficulty progression smooth?
  5. Are coins placed in logical locations?
  6. Is the goal reachable?

## Playtest Instructions for Claude Code CLI

### Phase 1: Mechanical Testing
1. **Jump Testing:** Can player reach platform at (100,500) from (50,550)?
2. **Platform Gap Testing:** Can player jump across gaps in levels 1-3?
3. **Spike Collision:** Does spike at (600,560) damage player properly?
4. **Coin Collection:** Does collecting 5 coins grant extra life?
5. **Moving Obstacle Detection:** Do moving obstacles cause damage?

### Phase 2: Difficulty Analysis
- Level 1-2: Should be easy (tutorial-like)
- Level 3-5: Medium difficulty
- Level 6-8: Hard
- Level 9-10: Challenging/Expert

### Phase 3: Iterate & Fix Issues
- Adjust platform sizes if unreachable
- Increase jump velocity if gaps too large
- Adjust moving obstacle speed
- Rebalance coin quantities
- Fix collision detection issues

## Key Metrics to Track
- Coin placement reachability: ✓ Check each coin is on accessible platform
- Platform sizing: ✓ Minimum 80px wide for reliable landing
- Goal reachability: ✓ Must be on reachable platform
- Jump arc: Can player clear 60px gap?
- Moving obstacle speed: Not faster than player can dodge

## Implementation Notes
- Player speed: 5 px/frame
- Jump velocity: -12 (upward), gravity: 0.8
- Moving obstacles should be in range [1-2.5] speed units
- Coins should be visible and not overlapping hazards
