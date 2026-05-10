import * as Phaser from "phaser";
import { getSocket, matchState } from "../net";

export class OnboardScene extends Phaser.Scene {
  private statusText?: Phaser.GameObjects.Text;

  constructor() { super("Onboard"); }
  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#0a0a0a");

    const title = this.add.text(width / 2, height * 0.18, "RIZ FIGHTERS", {
      fontFamily: '"Press Start 2P", monospace', fontSize: Math.min(48, width / 14) + "px", color: "#ffd700",
    }).setOrigin(0.5).setShadow(4, 4, "#ff2020", 0, true, true);

    this.tweens.add({ targets: title, alpha: { from: 1, to: 0.4 }, duration: 120, repeat: -1, yoyo: true,
      repeatDelay: 3000 + Math.random() * 4000 });

    this.add.text(width / 2, height * 0.3, "ARCADE EDITION", {
      fontFamily: '"Press Start 2P", monospace', fontSize: "12px", color: "#ffffff",
    }).setOrigin(0.5);

    // embers
    const g = this.add.graphics(); g.fillStyle(0xffaa33, 1).fillCircle(3, 3, 3); g.generateTexture("ember", 6, 6); g.destroy();
    const emitter = this.add.particles(0, height, "ember", {
      x: { min: 0, max: width }, y: height + 10,
      lifespan: 3500, speedY: { min: -120, max: -60 }, scale: { start: 1, end: 0 },
      alpha: { start: 0.9, end: 0 }, quantity: 2, frequency: 80, blendMode: "ADD",
    });
    void emitter;

    // panel
    const panelW = Math.min(440, width - 40), panelH = 260;
    const px = width / 2 - panelW / 2, py = height * 0.42;
    const panel = this.add.graphics();
    panel.fillStyle(0x111111, 0.95).fillRect(px, py, panelW, panelH);
    panel.lineStyle(3, 0xffd700, 1).strokeRect(px, py, panelW, panelH);

    // Use DOM so we get a real text input — Phaser has no native one
    const nameInput = this.add.dom(width / 2, py + 50).createFromHTML(
      `<input id="rzname" maxlength="10" placeholder="YOUR NAME" style="font-family:'Press Start 2P',monospace;font-size:12px;padding:10px;width:260px;background:#000;color:#ffd700;border:3px solid #ffd700;text-align:center;text-transform:uppercase;outline:none;" />`
    );
    void nameInput;
    const joinInput = this.add.dom(width / 2, py + 180).createFromHTML(
      `<input id="rzjoin" maxlength="4" placeholder="CODE" style="font-family:'Press Start 2P',monospace;font-size:12px;padding:8px;width:120px;background:#000;color:#3080ff;border:3px solid #3080ff;text-align:center;text-transform:uppercase;outline:none;" />`
    );
    void joinInput;

    const mkBtn = (x: number, y: number, label: string, color: string, cb: () => void) => {
      const t = this.add.text(x, y, label, {
        fontFamily: '"Press Start 2P", monospace', fontSize: "12px", color: "#ffffff",
        backgroundColor: "#1a1a1a", padding: { x: 16, y: 10 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.setStroke(color, 2); t.setShadow(3, 3, "#000", 0);
      t.on("pointerdown", cb);
      return t;
    };

    mkBtn(width / 2 - 80, py + 110, "▶ CREATE", "#ffd700", () => this.startMatch(true));
    mkBtn(width / 2 + 80, py + 180, "⚔ JOIN", "#3080ff", () => this.startMatch(false));

    this.statusText = this.add.text(width / 2, py + 230, "", {
      fontFamily: '"Press Start 2P", monospace', fontSize: "8px", color: "#ffaa00", align: "center",
      wordWrap: { width: panelW - 30 },
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 30, "PRESS START 2P · BEST OF 3", {
      fontFamily: '"Press Start 2P", monospace', fontSize: "8px", color: "#555",
    }).setOrigin(0.5);
  }

  private startMatch(create: boolean) {
    const nameEl = document.getElementById("rzname") as HTMLInputElement | null;
    const joinEl = document.getElementById("rzjoin") as HTMLInputElement | null;
    const name = (nameEl?.value || "PLAYER").toUpperCase().slice(0, 10);
    let room = (joinEl?.value || "").toUpperCase().slice(0, 4);
    if (create) {
      room = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "K7RX";
      try { navigator.clipboard?.writeText(room); } catch {}
    }
    if (!room) { this.statusText?.setText("ENTER A ROOM CODE").setColor("#ff3030"); return; }
    matchState.roomId = room; matchState.myName = name;
    const s = getSocket();

    this.statusText?.setText(create ? `CREATING ROOM ${room}...` : `JOINING ROOM ${room}...`).setColor("#ffaa00");
    s.off("room_created"); s.off("room_joined"); s.off("room_full"); s.off("connect_error");
    // Listen for match_ready before transitioning to waiting scene.
    // If the match is already ready (both players joined), go straight to CharSelect.
    s.once("match_ready", ({ p1Name, p2Name }: any) => {
      // Update opponent name for consistency.
      matchState.oppName = matchState.slot === 1 ? p2Name : p1Name;
      // Directly start CharSelect scene, skipping waiting screen.
      this.scene.start("CharSelect");
    });
    s.once("room_created", ({ slot }: any) => { matchState.slot = slot; this.scene.start("Waiting"); });
    s.once("room_joined",  ({ slot }: any) => { matchState.slot = slot; this.scene.start("Waiting"); });
    s.once("room_full", () => this.statusText?.setText("ROOM FULL").setColor("#ff3030"));
    s.once("connect_error", () => this.statusText?.setText("SERVER OFFLINE - SET VITE_SOCKET_URL").setColor("#ff3030"));
    if (s.connected) s.emit("join_room", { roomId: room, playerName: name });
    else s.once("connect", () => s.emit("join_room", { roomId: room, playerName: name }));
    s.connect();
  }
}