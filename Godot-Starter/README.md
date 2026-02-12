# Godot Starter Project

A kid-friendly game template to learn Godot game development.

## Setup

1. Download and install [Godot Engine](https://godotengine.org) (v4.x recommended)
2. Open Godot and import this folder as a project
3. Create your first scene in `scenes/` and script in `src/`

## Project Structure

```
Godot-Starter/
├── src/              # GDScript files
├── scenes/           # Godot scene files (.tscn)
├── assets/
│   ├── sprites/      # Images and character artwork
│   └── sounds/       # Audio effects and music
└── README.md
```

## Quick Start

1. **Create a Player Character:**
   - New Scene → 2D Scene → Node2D (rename to "Player")
   - Add Sprite2D child node
   - Add CharacterBody2D for movement

2. **Add Input:**
   - Create script: `src/player.gd`
   - Handle arrow keys or WASD

3. **Build and Test:**
   - Press F5 to run
   - Test on Windows/Web/Mobile

## Playtest Checklist

- [ ] Game runs without crashes
- [ ] Controls are responsive
- [ ] Screen is readable (font size 24+)
- [ ] Buttons are large (48x48 px minimum)
- [ ] Game exits cleanly
- [ ] Sound works (mute button added)
- [ ] Kid can play for 2+ minutes without getting stuck
- [ ] Fun factor: Kid wants to play again ✓

## Export for Kids

1. **Desktop (Windows/Mac):**
   - Project → Export → Create preset → Export PCK & ZIP

2. **Web (Browser):**
   - Project → Export → HTML5 → Export
   - Upload to GitHub Pages or itch.io

3. **Mobile (Android):**
   - Project → Export → Android (requires JDK)

## Tips for Kid-Friendly Games

- Use large, colorful sprites
- Keep controls simple (2-4 buttons max)
- Add clear feedback (sounds, screen shake, color flash)
- Make restart quick
- Always have a pause button
- Test with actual kids!

## Resources

- [Godot Docs](https://docs.godotengine.org)
- [GDScript Tutorial](https://docs.godotengine.org/en/stable/getting_started/scripting/gdscript/index.html)
- [Godot Asset Library](https://godotengine.org/asset-library)

## Next Steps

1. Create your first scene
2. Add a player sprite
3. Script basic movement
4. Commit to GitHub: `git add . && git commit -m "First game scene" && git push`

Good luck! 🎮
