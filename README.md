# SEAL BOUND (ผนึกมหาเวท)

> 4v4 Tactical Action Web Game & Custom 3D Engine built with Three.js, TypeScript, and Vite.

---

## Overview

**SEAL BOUND** is a competitive 4v4 round-based tactical action web game. Players control stylized anime champions in a third-person perspective (TPP), utilizing primary and secondary weapon combos, tactical parries, and draconic skills to either plant the Ancient Seal at Site A/B or defend and dispel it.

- **Match Format:** 4v4, First to 5 rounds (Best of 9)
- **Objective:** Attacking team plants the Seal (4s plant, 45s timer). Defending team dispels it (7s defuse with 3.5s half-defuse milestone).
- **Economy:** Round 1 is an Eco/Pistol round (primary weapon locked, only secondary weapon and starter perks allowed). Subsequent rounds unlock primary weapons and tactical perks with earned Gold.
- **Cross-Platform:** Full seamless support for both PC (Keyboard & Mouse) and Mobile (Touch Virtual Joystick & Action Buttons).
- **No Emojis:** Pure SVG vector iconography and clean Apple / Fortnite inspired UI.

---

## Custom Engine Architecture (Seal Core Engine)

- **Rendering:** Three.js with Toon/Cel-shading, shadow mapping, and DPR clamping for mobile 60 FPS.
- **Camera:** TPP Over-the-Shoulder camera with SpringArm obstacle collision, shoulder swap (V), and ADS zoom.
- **Combat:** Swept-volume melee hitboxes, parry windows with metallic audio feedback, floating damage numbers, and animation cancel windows.
- **In-Browser Creator Suite:**
  - `F2` — **Level & Map Editor:** Flycam, 3D object placement (pillars, walls, crates, sites), and JSON map export.
  - `F3` — **Hitbox Visualizer:** Real-time wireframe hurtboxes and weapon swing arcs.
  - **Live Inspector:** Real-time stat and balance tweaking.
- **Data-Driven:** Character stats, weapons, perks, and maps are loaded from clean JSON configurations in `src/data/`.

---

## Controls

### PC (Keyboard & Mouse)
- `W / A / S / D`: Move
- `Shift`: Sprint
- `Left Click`: Attack / Greatsword Slash
- `Right Click`: Parry / Aim Down Sights (ADS)
- `Q`: Quick Weapon Swap (Greatsword <-> Parrying Dagger)
- `C`: Skill 1 [Crimson Cleave]
- `E`: Skill 2 [Steel Aegis] / Hold to Plant or Defuse Seal
- `X`: Ultimate [Tectonic Cataclysm]
- `V`: Shoulder Swap (Left / Right camera peek)
- `F2`: Toggle In-Browser Map Editor (Flycam)
- `F3`: Toggle Hitbox Debug Wireframes

### Mobile / Tablet (Touchscreen)
- **Left Thumb:** Virtual 360-degree analog joystick (auto-appears under touch).
- **Right Thumb:** Swipe across right screen to rotate camera look.
- **Action Buttons:** Dedicated on-screen touch buttons for Slash, Quick Swap, Parry, Skills, and Hold-to-Plant/Defuse.

---

## Quick Start

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build for production
npm run build
```

---

## License

ISC
