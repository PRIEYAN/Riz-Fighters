# Riz'Fighters Server

Standalone Node socket.io relay. Lovable's serverless runtime can't host this — deploy it on Render/Fly/Railway.

## Run locally
```
npm init -y
npm install express socket.io
node server.js
```

## Point the client at it
Set `VITE_SOCKET_URL` in your Lovable project (Cloud → Secrets) to the deployed URL, e.g. `https://rizfighters.onrender.com`. Defaults to `http://localhost:3001`.

## Sprite assets
The game ships with procedural Phaser Graphics fighters as a fallback. To use real sprites, drop sheets into `public/assets/sprites/{warrior|hero|wizard|huntress}/` named `idle.png run.png attack1.png attack2.png attack3.png block.png take_hit.png death.png` (200x200, 8 cols). Loader auto-detects.