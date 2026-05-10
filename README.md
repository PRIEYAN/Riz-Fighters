<div align="center">

<!-- ARCADE MARQUEE HEADER -->
<img src="https://raw.githubusercontent.com/trinib/trinib/a5f17399d881c5651a89bfe4a621893f5c4b5041/images/marquee.gif" width="100%"/>

```
__________.__         /\ ___________.__       .__     __                       
\______   \__|_______ )/ \_   _____/|__| ____ |  |___/  |_  ___________  ______
 |       _/  \___   /     |    __)  |  |/ ___\|  |  \   __\/ __ \_  __ \/  ___/
 |    |   \  |/    /      |     \   |  / /_/  >   Y  \  | \  ___/|  | \/\___ \ 
 |____|_  /__/_____ \     \___  /   |__\___  /|___|  /__|  \___  >__|  /____  >
        \/         \/         \/      /_____/      \/          \/           \/ 
```

**A REAL-TIME MULTIPLAYER 2D FIGHTING GAME — INSERT COIN TO CONTINUE**

<img src="https://readme-typing-svg.demolab.com?font=Press+Start+2P&size=14&pause=1000&color=FFD700&center=true&vCenter=true&width=600&lines=ROUND+1+%E2%80%94+FIGHT!;POWERED+BY+PHASER+3+%2B+SOCKET.IO;2+PLAYERS+%7C+REAL-TIME+%7C+ONLINE;INSERT+COIN+TO+BEGIN..." alt="Typing SVG" />

<br/>

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Phaser](https://img.shields.io/badge/Phaser_3-8B0000?style=for-the-badge&logo=phaser&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TanStack](https://img.shields.io/badge/TanStack-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

</div>

---

## PRESS START

<img align="right" width="220" src="https://raw.githubusercontent.com/Anmol-Baranwal/Cool-GIFs-For-GitHub/main/data/hyperkitty.gif"/>

**Riz-Fighters** is a browser-based, real-time 2-player fighting game. Two fighters. One arena. One winner.

- Real-time online 1v1 combat over WebSockets
- Browser-based — no download required
- Local physics with server-authoritative relaying
- Opponent movement interpolation for smooth gameplay
- Lightning-fast Vite + React dev experience

<br clear="right"/>

---

## GAME MAP — HOW IT WORKS

```
┌─────────────────────────────────────────────────────┐
│                    PLAYER BROWSER                    │
│                                                     │
│  ┌─────────────┐      ┌────────────────────────┐   │
│  │ TanStack    │ ───► │     Phaser 3 Canvas    │   │
│  │ React UI    │      │  (Fight Scene renders) │   │
│  │ (Lobby/MM)  │      └────────────┬───────────┘   │
│  └─────────────┘                   │                │
│                                    │ inputs + pos   │
└────────────────────────────────────┼────────────────┘
                                     ▼
                    ┌────────────────────────────┐
                    │   Node.js + Express        │
                    │   Socket.io Relay Server   │
                    │   (broadcasts to opponent) │
                    └────────────────────────────┘
                                     │
                    ┌────────────────▼───────────┐
                    │      OPPONENT BROWSER       │
                    │   Receives state → renders  │
                    │   interpolated movements    │
                    └────────────────────────────┘
```

> **TL;DR** — React handles the UI and lobby. Once a match starts, Phaser takes over rendering. Inputs are instantly relayed through a Socket.io server to the opponent, with interpolation keeping everything buttery smooth.

---

## PROJECT STRUCTURE

```
riz-fighters/
├── src/
│   ├── routes/          ← TanStack Start pages (lobby, matchmaking)
│   ├── game/            ← Phaser 3 scenes & game logic
│   │   ├── scenes/      ← FightScene, PreloadScene, UIScene
│   │   ├── fighters/    ← Fighter sprites, animations, hitboxes
│   │   └── net/         ← Socket.io client + interpolation logic
│   ├── components/      ← Radix UI + Tailwind React components
│   └── styles/          ← Global CSS
├── server/
│   └── server.js        ← Express + Socket.io relay server
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## INSTALLATION — PLAYER 1, READY?

> Make sure you have **Node.js 18+** installed before starting.

### STEP 1 — Clone the repo

```bash
git clone https://github.com/PRIEYAN/Riz-Fighters.git
cd Riz-Fighters
```

### STEP 2 — Install dependencies

```bash
npm install
```

### STEP 3 — Start the Socket relay server

```bash
node server.js
```

> You should see: `Socket relay running on port 3001`

### STEP 4 — Start the frontend (new terminal)

```bash
npm run dev
```

> You should see: `Local: http://localhost:5173`

### STEP 5 — Fight!

Open `http://localhost:5173` in **two different browser tabs** (or two devices on the same network) and press **START GAME** in both. A match will be created automatically.

---

## TECH STACK — CHARACTER SELECT

| Layer | Technology | Role |
|-------|-----------|------|
| **Game Engine** | Phaser 3 | Rendering, physics, animations, hitboxes |
| **UI Framework** | React 19 | Lobby, matchmaking, HUD overlays |
| **Routing** | TanStack Start / Router | Page routing & SSR-ready structure |
| **Styling** | Tailwind CSS + Radix UI | UI components & design system |
| **Realtime** | Socket.io | Bidirectional event relay between players |
| **Backend** | Express.js | HTTP server + Socket.io attachment |
| **Bundler** | Vite | Dev server + production build |
| **Language** | TypeScript / JavaScript | Type-safe game & server code |

---

## CONTROLS

```
┌─────────────────────────────────────┐
│           PLAYER 1                  │
│   Move  : ← → Arrow Keys           │
│   Jump  : ↑ Arrow                  │
│   Punch : Z                         │
│   Kick  : X                         │
│   Block : C / ↓ Arrow              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│           PLAYER 2 (Online)         │
│   Same controls — mirrored          │
│   opponent rendered via Socket.io   │
└─────────────────────────────────────┘
```

---

## NETWORK & MULTIPLAYER ARCHITECTURE

The game uses a **relay-based** multiplayer model — there's no authoritative game server; each client runs its own physics simulation:

```
CLIENT A (local physics)
    │
    │  { x, y, state, frame, timestamp }
    ▼
SOCKET.IO SERVER  ←──────────────────────────────────┐
    │                                                 │
    │  broadcasts to room                             │
    ▼                                                 │
CLIENT B (receives opponent state)               CLIENT B
    │  interpolates between last 2 received frames    │
    └─────────────────────────────────────────────────┘
```

**Interpolation** smooths out network jitter by always rendering the opponent slightly behind real-time (typically 1–2 frames), blending positions between the two most recently received snapshots.

---

## MAKI FRAMEWORK — BONUS STAGE

<details>
<summary>Click to read about Maki (not used in this project, but here's how it'd help)</summary>

**Maki** is a declarative, resource-oriented Node.js framework that auto-generates:

- Database bindings
- CRUD REST API routes  
- Basic views / scaffolding

You simply declare a "Resource":

```js
const User = new Maki.Resource('User', {
  attributes: {
    username: { type: String },
    score: { type: Number }
  }
});
```

And Maki auto-creates `GET /users`, `POST /users`, `GET /users/:id`, etc. with DB wiring — zero boilerplate.

For this game, Maki could power a **leaderboard API** or **player profile system** with almost no effort.

There's also a lightweight **Maki Game Framework** (sometimes used in hackathons) for building simple 2D RPGs.

</details>

---

## SCRIPTS REFERENCE

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `node server.js` | Start the Socket.io relay server |
| `npm run dev` | Start Vite frontend dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |

---

## TROUBLESHOOTING — CONTINUE? 9...8...7...

**Port already in use?**
```bash
# Kill whatever is on port 3001
npx kill-port 3001
```

**Opponent not connecting?**
- Make sure `server.js` is running before opening the game
- Both players must be on the same server URL (for LAN play, use your local IP instead of `localhost`)

**Blank screen / Phaser not loading?**
- Check browser console for errors
- Make sure assets are in `public/assets/`
- Try hard refresh: `Ctrl + Shift + R`

---

## CONTRIBUTING — PLAYER 2 JOIN

1. Fork the repo
2. Create a branch: `git checkout -b feature/new-fighter`
3. Commit: `git commit -m "Add new fighter: Adon"`
4. Push: `git push origin feature/new-fighter`
5. Open a Pull Request

---

<div align="center">

<img src="https://raw.githubusercontent.com/trinib/trinib/a5f17399d881c5651a89bfe4a621893f5c4b5041/images/footer.svg" width="100%"/>

**Made with way too many energy drinks**

`INSERT COIN ▶ PRESS START ▶ FIGHT`

</div>