import * as Phaser from "phaser";
import { getSocket, matchState } from "../net";
import { CHAR_COLORS, makeFighterTexture } from "../textures";

const CHARS = [
  { id: "warrior",  name: "WARRIOR",  pow: 5, spd: 3, def: 4 },
  { id: "hero",     name: "HERO",     pow: 4, spd: 4, def: 4 },
  { id: "wizard",   name: "WIZARD",   pow: 5, spd: 2, def: 5 },
  { id: "huntress", name: "HUNTRESS", pow: 3, spd: 5, def: 3 },
];

export class CharSelectScene extends Phaser.Scene {
  private myIdx = 0;
  private oppIdx = -1;
  private myCursor!: Phaser.GameObjects.Graphics;
  private oppCursor!: Phaser.GameObjects.Graphics;
  private boxes: Phaser.GameObjects.Container[] = [];
  private locked = false;
  constructor() { super("CharSelect"); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#0a0a0a");
    const F = '"Press Start 2P", monospace';

    this.add.text(width / 2, 40, "SELECT YOUR FIGHTER", { fontFamily: F, fontSize: "20px", color: "#ffd700" }).setOrigin(0.5);

    const boxW = Math.min(150, (width - 80) / 4 - 16);
    const total = boxW * 4 + 16 * 3;
    const startX = width / 2 - total / 2 + boxW / 2;
    const cy = height / 2;

    CHARS.forEach((c, i) => {
      makeFighterTexture(this, `cs_${c.id}`, CHAR_COLORS[c.id]);
      const x = startX + i * (boxW + 16);
      const cont = this.add.container(x, cy);
      const bg = this.add.graphics();
      bg.fillStyle(0x1a1a1a, 1).fillRect(-boxW / 2, -boxW / 2, boxW, boxW);
      bg.lineStyle(2, 0x444444, 1).strokeRect(-boxW / 2, -boxW / 2, boxW, boxW);
      const sprite = this.add.image(0, -10, `cs_${c.id}`).setScale(0.7);
      const name = this.add.text(0, boxW / 2 - 20, c.name, { fontFamily: F, fontSize: "10px", color: "#fff" }).setOrigin(0.5);
      cont.add([bg, sprite, name]);
      cont.setSize(boxW, boxW).setInteractive({ useHandCursor: true });
      cont.on("pointerdown", () => { this.myIdx = i; this.lockIn(); });
      cont.on("pointerover", () => { this.myIdx = i; this.emitCursor(); });
      this.boxes.push(cont);

      // stat bars below
      const bar = (y: number, label: string, val: number) => {
        this.add.text(x - boxW / 2, cy + boxW / 2 + 10 + y, label, { fontFamily: F, fontSize: "7px", color: "#888" });
        const g = this.add.graphics();
        g.fillStyle(0x222222, 1).fillRect(x - boxW / 2 + 50, cy + boxW / 2 + 10 + y, 60, 6);
        g.fillStyle(0xffd700, 1).fillRect(x - boxW / 2 + 50, cy + boxW / 2 + 10 + y, (val / 5) * 60, 6);
      };
      bar(0, "POW", c.pow); bar(12, "SPD", c.spd); bar(24, "DEF", c.def);
    });

    this.myCursor = this.add.graphics();
    this.oppCursor = this.add.graphics();
    this.refreshCursors();

    const hint = this.add.text(width / 2, height - 30, "← → SELECT · ENTER LOCK IN", {
      fontFamily: F, fontSize: "9px", color: "#888",
    }).setOrigin(0.5);
    void hint;

    this.input.keyboard?.on("keydown-LEFT", () => { this.myIdx = (this.myIdx + 3) % 4; this.emitCursor(); });
    this.input.keyboard?.on("keydown-RIGHT", () => { this.myIdx = (this.myIdx + 1) % 4; this.emitCursor(); });
    this.input.keyboard?.on("keydown-ENTER", () => this.lockIn());

    const s = getSocket();
    s.on("opponent_cursor", ({ character }: any) => {
      this.oppIdx = CHARS.findIndex((c) => c.id === character);
      this.refreshCursors();
    });
    s.on("opponent_selected", ({ character }: any) => {
      this.oppIdx = CHARS.findIndex((c) => c.id === character);
      matchState.oppChar = character;
      this.refreshCursors(true);
    });
    s.on("match_start", ({ stage, p1Char, p2Char }: any) => {
      matchState.stage = stage;
      matchState.myChar = matchState.slot === 1 ? p1Char : p2Char;
      matchState.oppChar = matchState.slot === 1 ? p2Char : p1Char;
      this.showVsAndStart();
    });
  }

  private emitCursor() {
    this.refreshCursors();
    getSocket().emit("cursor_move", { character: CHARS[this.myIdx].id });
  }
  private lockIn() {
    if (this.locked) return; this.locked = true;
    matchState.myChar = CHARS[this.myIdx].id;
    getSocket().emit("character_selected", { character: matchState.myChar });
    this.refreshCursors(true);
  }
  private refreshCursors(locked = false) {
    this.myCursor.clear(); this.oppCursor.clear();
    const drawAt = (g: Phaser.GameObjects.Graphics, idx: number, color: number) => {
      if (idx < 0 || idx >= this.boxes.length) return;
      const b = this.boxes[idx];
      g.lineStyle(4, color, 1).strokeRect(b.x - b.width / 2 - 4, b.y - b.height / 2 - 4, b.width + 8, b.height + 8);
    };
    drawAt(this.myCursor, this.myIdx, locked ? 0xffd700 : 0xff3030);
    drawAt(this.oppCursor, this.oppIdx, 0x3080ff);
  }
  private showVsAndStart() {
    const { width, height } = this.scale;
    const F = '"Press Start 2P", monospace';
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    const txt = this.add.text(width / 2, height / 2, `${matchState.slot === 1 ? matchState.myName : matchState.oppName}\nVS\n${matchState.slot === 1 ? matchState.oppName : matchState.myName}`, {
      fontFamily: F, fontSize: "32px", color: "#ffd700", align: "center",
    }).setOrigin(0.5);
    void overlay;
    this.tweens.add({ targets: txt, scale: { from: 3, to: 1 }, duration: 500, ease: "Bounce.easeOut" });
    this.time.delayedCall(2000, () => this.scene.start("Fight"));
  }
}