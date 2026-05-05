import * as Phaser from "phaser";
import { getSocket, matchState } from "../net";
import { CHAR_COLORS, makeFighterTexture, makeStageTextures, makeParticleDot } from "../textures";
import { sfx } from "../audio";

type Anim = "idle" | "walk" | "punch" | "uppercut" | "kick" | "roundhouse" | "block" | "take_hit" | "death" | "jump" | "crouch";

const GROUND_Y_OFFSET = 120;
const GRAVITY = 1200;
const WALK = 220;
const JUMP_V = -600;
const ATTACK_COOLDOWN = 350;

export class FightScene extends Phaser.Scene {
  private me!: Phaser.Physics.Arcade.Sprite;
  private opp!: Phaser.Physics.Arcade.Sprite;
  private myHp = 100; private oppHp = 100;
  private myHpBar!: Phaser.GameObjects.Graphics;
  private oppHpBar!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private timeLeft = 99;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private currentAnim: Anim = "idle";
  private isBlocking = false;
  private isCrouching = false;
  private lastAttack = 0;
  private lastSent = 0;
  private oppState = { x: 0, y: 0, anim: "idle" as Anim, flipX: false, isBlocking: false };
  private active = true;
  private mobileBus?: { on: (e: string, cb: () => void) => void; off: (e: string, cb: () => void) => void };
  private mobileHandlers: Array<[string, () => void]> = [];
  private joyVec = { x: 0, y: 0 };

  constructor() { super("Fight"); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#000");
    makeParticleDot(this);
    makeStageTextures(this, matchState.stage);
    this.add.image(width / 2, height / 2, `stage${matchState.stage}_sky`).setDisplaySize(width, height).setScrollFactor(0.1);
    this.add.image(width / 2, height / 2, `stage${matchState.stage}_mid2`).setDisplaySize(width, height).setScrollFactor(0.3);
    this.add.image(width / 2, height / 2, `stage${matchState.stage}_fg2`).setDisplaySize(width, height).setScrollFactor(0.6);

    // textures for fighters
    const myCharId = matchState.myChar || "warrior";
    const oppCharId = matchState.oppChar || "hero";
    makeFighterTexture(this, `f_${myCharId}`, CHAR_COLORS[myCharId] || 0xff5544);
    makeFighterTexture(this, `f_${oppCharId}`, CHAR_COLORS[oppCharId] || 0x44aaff, 0x88ddff);

    this.physics.world.gravity.y = GRAVITY;
    const groundY = height - GROUND_Y_OFFSET;
    const ground = this.add.rectangle(width / 2, height - 40, width, 80, 0x000000, 0).setOrigin(0.5);
    this.physics.add.existing(ground, true);

    const myStartX = matchState.slot === 1 ? 200 : width - 200;
    const oppStartX = matchState.slot === 1 ? width - 200 : 200;

    this.me = this.physics.add.sprite(myStartX, groundY, `f_${myCharId}`);
    this.me.setCollideWorldBounds(true).setSize(50, 110).setOffset(15, 5);
    this.physics.add.collider(this.me, ground);

    this.opp = this.physics.add.sprite(oppStartX, groundY, `f_${oppCharId}`);
    this.opp.setSize(50, 110).setOffset(15, 5);
    this.physics.add.collider(this.opp, ground);

    // HUD
    this.drawHud();

    // controls
    const kb = this.input.keyboard!;
    this.keys = {
      left: kb.addKey("A"), right: kb.addKey("D"), up: kb.addKey("W"), down: kb.addKey("S"),
      punch: kb.addKey("J"), kick: kb.addKey("L"), block: kb.addKey("F"),
    };

    // mobile bus
    this.mobileBus = (window as any).__mobileBus;
    if (this.mobileBus) this.bindMobile();

    // socket listeners
    const s = getSocket();
    s.on("opponent_state", (st: any) => { this.oppState = st; this.opp.setPosition(st.x, st.y); this.opp.setFlipX(st.flipX); });
    s.on("opponent_hit", (h: any) => this.applyIncoming(h));
    s.on("round_result", (r: any) => this.endRound(r));
    s.on("next_round", ({ round }: any) => this.startRound(round));
    s.on("match_over", ({ winner }: any) => this.showMatchOver(winner));
    s.on("opponent_left", () => this.showOpponentLeft());

    // round timer
    this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      if (!this.active) return;
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      this.timerText.setText(String(this.timeLeft).padStart(2, "0"));
      this.timerText.setColor(this.timeLeft <= 10 ? "#ff3030" : "#ffd700");
      if (this.timeLeft === 0 && matchState.slot === 1) this.reportRoundEnd("timeout");
    }});

    this.startRound(matchState.round);
  }

  private drawHud() {
    const { width } = this.scale;
    const F = '"Press Start 2P", monospace';
    this.add.text(20, 16, matchState.slot === 1 ? matchState.myName : matchState.oppName, { fontFamily: F, fontSize: "12px", color: "#ff3030" });
    this.add.text(width - 20, 16, matchState.slot === 2 ? matchState.myName : matchState.oppName, { fontFamily: F, fontSize: "12px", color: "#3080ff" }).setOrigin(1, 0);
    this.myHpBar = this.add.graphics();
    this.oppHpBar = this.add.graphics();
    this.timerText = this.add.text(width / 2, 30, "99", { fontFamily: F, fontSize: "24px", color: "#ffd700" }).setOrigin(0.5);
    this.roundText = this.add.text(width / 2, 60, `ROUND ${matchState.round}`, { fontFamily: F, fontSize: "10px", color: "#fff" }).setOrigin(0.5);
    this.refreshHp();
  }

  private refreshHp() {
    const { width } = this.scale;
    const W = 240, H = 24;
    // P1 left, P2 right — but always show "me" on the side matching slot
    const p1Hp = matchState.slot === 1 ? this.myHp : this.oppHp;
    const p2Hp = matchState.slot === 2 ? this.myHp : this.oppHp;
    this.myHpBar.clear();
    this.myHpBar.fillStyle(0x1a0000, 1).fillRect(20, 36, W, H).lineStyle(3, 0x222, 1).strokeRect(20, 36, W, H);
    this.myHpBar.fillStyle(0xff3030, 1).fillRect(20, 36, W * (p1Hp / 100), H);
    this.oppHpBar.clear();
    this.oppHpBar.fillStyle(0x000a1a, 1).fillRect(width - 20 - W, 36, W, H).lineStyle(3, 0x222, 1).strokeRect(width - 20 - W, 36, W, H);
    const fill = W * (p2Hp / 100);
    this.oppHpBar.fillStyle(0x3080ff, 1).fillRect(width - 20 - fill, 36, fill, H);
    // wins
    const drawWins = (x: number, n: number) => {
      for (let i = 0; i < 2; i++) {
        this.add.circle(x + i * 18, 76, 6, i < n ? 0xffd700 : 0x333333).setScrollFactor(0);
      }
    };
    drawWins(20, matchState.wins[0]); drawWins(this.scale.width - 56, matchState.wins[1]);
  }

  private bindMobile() {
    const bus = this.mobileBus!;
    const onJoy = (e: any) => { this.joyVec = e.detail || { x: 0, y: 0 }; };
    window.addEventListener("rz-joy", onJoy as any);
    this.mobileHandlers.push(["__joy" as any, () => window.removeEventListener("rz-joy", onJoy as any)]);
    const map: Array<[string, () => void]> = [
      ["punch", () => this.tryAttack("punch")],
      ["kick", () => this.tryAttack("kick")],
      ["jump", () => this.tryJump()],
      ["block-down", () => { this.isBlocking = true; }],
      ["block-up", () => { this.isBlocking = false; }],
    ];
    map.forEach(([e, cb]) => { bus.on(e, cb); this.mobileHandlers.push([e, cb]); });
  }

  shutdown() {
    this.mobileHandlers.forEach(([e, cb]) => this.mobileBus?.off(e, cb));
    this.mobileHandlers = [];
  }

  private startRound(round: number) {
    matchState.round = round;
    this.myHp = 100; this.oppHp = 100; this.timeLeft = 99; this.active = false;
    this.refreshHp();
    this.roundText.setText(`ROUND ${round}`);
    const { width, height } = this.scale;
    const F = '"Press Start 2P", monospace';
    const seq = ["3", "2", "1", "FIGHT!"];
    let i = 0;
    const showNext = () => {
      if (i >= seq.length) { this.active = true; return; }
      const txt = this.add.text(width / 2, height / 2, seq[i], {
        fontFamily: F, fontSize: "80px", color: i === 3 ? "#ffd700" : "#fff",
      }).setOrigin(0.5);
      if (i === 3) sfx.fight(); else sfx.beep();
      this.tweens.add({ targets: txt, scale: { from: 2, to: 1 }, duration: 300, ease: "Back.easeOut" });
      this.time.delayedCall(700, () => { txt.destroy(); i++; showNext(); });
    };
    showNext();
  }

  private tryAttack(kind: "punch" | "kick") {
    if (!this.active) return;
    const now = this.time.now;
    if (now - this.lastAttack < ATTACK_COOLDOWN) return;
    this.lastAttack = now;
    let attackType: string, dmg: number;
    if (kind === "punch") {
      if (Math.random() < 0.7) { attackType = "punch"; dmg = 8 + Math.floor(Math.random() * 5); }
      else { attackType = "uppercut"; dmg = 15 + Math.floor(Math.random() * 6); }
      sfx.punch();
    } else {
      if (Math.random() < 0.6) { attackType = "kick"; dmg = 10 + Math.floor(Math.random() * 5); }
      else { attackType = "roundhouse"; dmg = 18 + Math.floor(Math.random() * 7); }
      sfx.kick();
    }
    const isCritical = Math.random() < 0.05;
    if (isCritical) dmg = Math.round(dmg * 1.5);
    this.currentAnim = attackType as Anim;
    this.flashAttack();
    // hit detect: AABB overlap with opponent
    const dist = Math.abs(this.me.x - this.opp.x);
    if (dist < 110 && Math.abs(this.me.y - this.opp.y) < 90) {
      const finalDmg = this.oppState.isBlocking ? Math.round(dmg * 0.3) : dmg;
      getSocket().emit("attack_hit", { damage: finalDmg, attackType, isCritical });
      // local prediction: opponent HP
      this.oppHp = Math.max(0, this.oppHp - finalDmg);
      this.refreshHp();
      this.spawnHitFx(this.opp.x, this.opp.y, isCritical);
      if (matchState.slot === 1 && this.oppHp <= 0) this.reportRoundEnd("ko");
    }
    this.time.delayedCall(300, () => { if (this.currentAnim === attackType) this.currentAnim = "idle"; });
  }

  private tryJump() {
    if (this.me.body && (this.me.body as Phaser.Physics.Arcade.Body).blocked.down) {
      this.me.setVelocityY(JUMP_V);
    }
  }

  private flashAttack() {
    this.me.setTint(0xffeecc);
    this.time.delayedCall(120, () => this.me.clearTint());
  }

  private spawnHitFx(x: number, y: number, crit: boolean) {
    const p = this.add.particles(x, y, "dot", {
      speed: { min: 80, max: 220 }, lifespan: 350, quantity: 8,
      scale: { start: 1.2, end: 0 }, tint: crit ? 0xffd700 : 0xffaa33,
    });
    this.time.delayedCall(400, () => p.destroy());
    this.opp.setTint(0xffffff);
    this.time.delayedCall(100, () => this.opp.clearTint());
    if (crit) {
      const t = this.add.text(x, y - 80, "CRITICAL!", { fontFamily: '"Press Start 2P", monospace', fontSize: "16px", color: "#ffd700" }).setOrigin(0.5);
      this.tweens.add({ targets: t, y: y - 140, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    }
  }

  private applyIncoming({ damage, isCritical }: any) {
    const final = this.isBlocking ? Math.round(damage * 0.3) : damage;
    this.myHp = Math.max(0, this.myHp - final);
    this.refreshHp();
    this.spawnHitFx(this.me.x, this.me.y, isCritical);
    sfx.hit();
    if (matchState.slot === 1 && this.myHp <= 0) this.reportRoundEnd("ko");
  }

  private reportRoundEnd(reason: "ko" | "timeout") {
    if (!this.active) return;
    this.active = false;
    let winner: 0 | 1 | 2;
    if (reason === "timeout") {
      const my = this.myHp, opp = this.oppHp;
      if (my === opp) winner = 0;
      else winner = (matchState.slot === 1 ? (my > opp ? 1 : 2) : (my > opp ? 2 : 1));
    } else {
      winner = (this.myHp <= 0 ? (matchState.slot === 1 ? 2 : 1) : (matchState.slot === 1 ? 1 : 2));
    }
    const p1hp = matchState.slot === 1 ? this.myHp : this.oppHp;
    const p2hp = matchState.slot === 2 ? this.myHp : this.oppHp;
    getSocket().emit("round_end", { winner, reason, p1hp, p2hp });
  }

  private endRound(r: any) {
    this.active = false;
    matchState.wins = r.wins;
    sfx.ko();
    const { width, height } = this.scale;
    const F = '"Press Start 2P", monospace';
    const ko = this.add.text(width / 2, height / 2 - 40, "K.O.!", { fontFamily: F, fontSize: "80px", color: "#ff3030" }).setOrigin(0.5);
    this.tweens.add({ targets: ko, scale: { from: 3, to: 1 }, duration: 500, ease: "Bounce.easeOut" });
    const winnerName = r.winner === 0 ? "DRAW" : (r.winner === matchState.slot ? "YOU WIN!" : "YOU LOSE");
    this.add.text(width / 2, height / 2 + 40, winnerName, { fontFamily: F, fontSize: "20px", color: "#ffd700" }).setOrigin(0.5);
    this.refreshHp();
  }

  private showMatchOver(winner: 1 | 2) {
    const { width, height } = this.scale;
    const F = '"Press Start 2P", monospace';
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    void overlay;
    const won = winner === matchState.slot;
    this.add.text(width / 2, height / 2 - 60, won ? "YOU WIN!" : "YOU LOSE", {
      fontFamily: F, fontSize: "40px", color: won ? "#ffd700" : "#888888",
    }).setOrigin(0.5);
    const btn = this.add.text(width / 2, height / 2 + 60, "▶ REMATCH", {
      fontFamily: F, fontSize: "14px", color: "#fff", backgroundColor: "#222", padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on("pointerdown", () => {
      getSocket().emit("rematch_request");
      btn.setText("WAITING...");
    });
    getSocket().once("rematch_ready", ({ stage }: any) => {
      matchState.stage = stage; matchState.wins = [0, 0]; matchState.round = 1;
      this.scene.start("CharSelect");
    });
    const menu = this.add.text(width / 2, height / 2 + 110, "MAIN MENU", {
      fontFamily: F, fontSize: "10px", color: "#888",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menu.on("pointerdown", () => location.reload());
  }

  private showOpponentLeft() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
    this.add.text(width / 2, height / 2, "OPPONENT LEFT", { fontFamily: '"Press Start 2P", monospace', fontSize: "20px", color: "#ff3030" }).setOrigin(0.5);
  }

  update(_t: number, dt: number) {
    if (!this.me || !this.active) return;
    const body = this.me.body as Phaser.Physics.Arcade.Body;
    let vx = 0;
    // keyboard
    if (this.keys.left.isDown) vx -= WALK;
    if (this.keys.right.isDown) vx += WALK;
    if (Phaser.Input.Keyboard.JustDown(this.keys.up)) this.tryJump();
    this.isCrouching = this.keys.down.isDown;
    this.isBlocking = this.keys.block.isDown || this.isBlocking;
    if (Phaser.Input.Keyboard.JustDown(this.keys.punch)) this.tryAttack("punch");
    if (Phaser.Input.Keyboard.JustDown(this.keys.kick)) this.tryAttack("kick");
    // mobile joystick
    vx += this.joyVec.x * WALK;
    if (this.joyVec.y < -0.6) this.tryJump();
    this.me.setVelocityX(vx);
    // face opponent
    this.me.setFlipX(this.opp.x < this.me.x);
    // send state
    if (this.time.now - this.lastSent > 50) {
      this.lastSent = this.time.now;
      getSocket().emit("player_state", {
        x: this.me.x, y: this.me.y, velY: body.velocity.y,
        anim: this.currentAnim, flipX: this.me.flipX, hp: this.myHp,
        isBlocking: this.isBlocking, isAir: !body.blocked.down,
      });
    }
    void dt;
  }
}