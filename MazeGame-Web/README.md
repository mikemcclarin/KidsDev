# Maze Pitfalls - Web Game

A retro Atari-style maze game with platforms, pits, and spikes. Navigate through 10 levels!

## How to Play

1. **Open** `index.html` in any web browser (no server needed!)
2. **Move:** Arrow keys or WASD
3. **Jump:** Spacebar or Up arrow
4. **Goal:** Reach the green EXIT without falling into pits or hitting spikes
5. **Lives:** You start with 10 lives

## Controls

- **Arrow Keys** or **WASD** — Move left/right
- **Spacebar** or **Up Arrow** — Jump

## Game Features

- ✅ 10 levels with increasing difficulty
- ✅ 10 lives system
- ✅ Platforms, pits, spikes
- ✅ Simple Atari-style graphics
- ✅ Level progression

## File Structure

```
MazeGame-Web/
├── index.html      # Main game page
├── style.css       # Game styling
├── js/
│   ├── game.js     # Game controller & state
│   ├── player.js   # Player class & movement
│   └── level.js    # Level layouts & collisions
```

## How to Test

1. **Double-click** `index.html` to open in browser
2. Or: Right-click → **Open with → Browser**

## Quick Tips for Kids

- Platform jumps require timing!
- Fall into a pit? You lose a life and restart the level
- Touch spikes? Lose a life
- Reach the green EXIT to win the level
- Game over at 0 lives (press Restart)

## Next Steps

- Add more levels (edit `level.js` createLevel function)
- Add moving obstacles
- Add bonus lives pickups
- Add sound effects
- Publish to GitHub Pages or itch.io

## Customize

To add more levels, edit `level.js` and add more `else if` conditions in the `createLevel()` function.

Good luck! 🎮
