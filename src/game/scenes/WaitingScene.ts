import * as Phaser from "phaser";
import { getSocket, matchState } from "../net";

export class WaitingScene extends Phaser.Scene {
  constructor() { super("Waiting"); }
  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#0a0a0a");
    const F = '"Press Start 2P", monospace';

    this.add.text(width / 2, 60, `ROOM: ${matchState.roomId}`, {
      fontFamily: F, fontSize: "28px", color: "#ffd700",
    }).setOrigin(0.5);

    const share = this.add.text(width / 2, 110, "SHARE THIS CODE WITH YOUR FRIEND", {
      fontFamily: F, fontSize: "10px", color: "#ffaa00",
    }).setOrigin(0.5);
    this.tweens.add({ targets: share, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    const drawSlot = (x: number, name: string, color: string) => {
      const g = this.add.graphics();
      g.lineStyle(3, Phaser.Display.Color.HexStringToColor(color).color, 1).strokeRect(x - 80, height / 2 - 100, 160, 200);
      g.fillStyle(0x111111, 1).fillRect(x - 80, height / 2 - 100, 160, 200);
      g.lineStyle(3, Phaser.Display.Color.HexStringToColor(color).color, 1).strokeRect(x - 80, height / 2 - 100, 160, 200);
      // silhouette
      g.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.4).fillRect(x - 30, height / 2 - 60, 60, 120);
      const t = this.add.text(x, height / 2 + 130, name, {
        fontFamily: F, fontSize: "12px", color,
      }).setOrigin(0.5);
      return t;
    };

    drawSlot(width / 2 - 140, matchState.slot === 1 ? matchState.myName : "???", matchState.slot === 1 ? "#ff3030" : "#3080ff");
    const oppText = drawSlot(width / 2 + 140, matchState.slot === 2 ? matchState.myName : "???", matchState.slot === 2 ? "#3080ff" : "#ff3030");
    if (matchState.slot === 2) {
      // already two players; opponent shown
    } else {
      this.tweens.add({ targets: oppText, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
    }

    const s = getSocket();
    s.on("player_joined", ({ p1Name, p2Name }: any) => {
      const opp = matchState.slot === 1 ? p2Name : p1Name;
      matchState.oppName = opp;
      oppText.setText(opp).setAlpha(1);
      this.tweens.killTweensOf(oppText);
      this.add.text(width / 2, height - 80, "FIGHTER JOINED!", {
        fontFamily: F, fontSize: "16px", color: "#ffd700",
      }).setOrigin(0.5);
    });
    s.on("match_ready", ({ p1Name, p2Name }: any) => {
      matchState.oppName = matchState.slot === 1 ? p2Name : p1Name;
      this.time.delayedCall(800, () => this.scene.start("CharSelect"));
    });

    const back = this.add.text(20, 20, "← LEAVE", {
      fontFamily: F, fontSize: "10px", color: "#fff", backgroundColor: "#222", padding: { x: 8, y: 6 },
    }).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => location.reload());
  }
}