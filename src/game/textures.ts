import * as Phaser from "phaser";

// Procedural fighter texture generator — used as fallback when sprite sheets
// aren't present in /public/assets/sprites/<char>/. Each "anim" is just a
// recoloured rectangle frame; gameplay/hitboxes don't care.
export const CHAR_COLORS: Record<string, number> = {
  warrior: 0xff5544,
  hero: 0x44aaff,
  wizard: 0xaa55ff,
  huntress: 0x55cc88,
};

export function makeFighterTexture(scene: Phaser.Scene, key: string, color: number, accent = 0xffffff) {
  if (scene.textures.exists(key)) return;
  const w = 80, h = 120;
  const g = scene.add.graphics({ x: 0, y: 0 });
  // body
  g.fillStyle(color, 1).fillRect(20, 30, 40, 70);
  // head
  g.fillStyle(0xffd9b3, 1).fillRect(28, 8, 24, 24);
  // belt
  g.fillStyle(0x222222, 1).fillRect(20, 70, 40, 6);
  // accent stripe
  g.fillStyle(accent, 1).fillRect(38, 30, 4, 40);
  // outline
  g.lineStyle(2, 0x000000, 1).strokeRect(20, 30, 40, 70).strokeRect(28, 8, 24, 24);
  g.generateTexture(key, w, h);
  g.destroy();
}

export function makeStageTextures(scene: Phaser.Scene, stage: number) {
  const palettes: Array<[number, number, number]> = [
    [0x1a0a3a, 0x6a1a8a, 0xff3088], // synth city
    [0x0a0a1a, 0x3a3a4a, 0x88aacc], // industrial
    [0xff8855, 0x884422, 0x442211], // mountain dusk
    [0x0a0a0a, 0x2a1a1a, 0x553322], // cave
    [0x88ccee, 0x445577, 0x223344], // street
  ];
  const [sky, mid, fg] = palettes[(stage - 1) % palettes.length];
  const W = 1280, H = 540;
  const mk = (key: string, fill: number, draw?: (g: Phaser.GameObjects.Graphics) => void) => {
    if (scene.textures.exists(key)) return;
    const g = scene.add.graphics();
    g.fillStyle(fill, 1).fillRect(0, 0, W, H);
    draw?.(g);
    g.generateTexture(key, W, H);
    g.destroy();
  };
  mk(`stage${stage}_sky`, sky, (g) => {
    // gradient bands
    for (let i = 0; i < 12; i++) {
      g.fillStyle(Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(sky),
        Phaser.Display.Color.IntegerToColor(mid), 12, i).color, 0.4);
      g.fillRect(0, (H / 12) * i, W, H / 12);
    }
  });
  mk(`stage${stage}_mid`, 0x000000);
  // mid as transparent silhouettes
  if (!scene.textures.exists(`stage${stage}_mid2`)) {
    const g = scene.add.graphics();
    for (let i = 0; i < 14; i++) {
      const x = i * (W / 14), bh = 80 + Math.floor(Math.random() * 180);
      g.fillStyle(mid, 0.85).fillRect(x, H - bh - 80, W / 14 - 8, bh);
    }
    g.generateTexture(`stage${stage}_mid2`, W, H);
    g.destroy();
  }
  mk(`stage${stage}_fg`, 0x000000);
  if (!scene.textures.exists(`stage${stage}_fg2`)) {
    const g = scene.add.graphics();
    g.fillStyle(fg, 1).fillRect(0, H - 80, W, 80);
    g.lineStyle(2, 0x000000, 0.4);
    for (let i = 0; i < 40; i++) g.lineBetween(i * 32, H - 80, i * 32, H);
    g.generateTexture(`stage${stage}_fg2`, W, H);
    g.destroy();
  }
}

export function makeParticleDot(scene: Phaser.Scene) {
  if (scene.textures.exists("dot")) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1).fillCircle(4, 4, 4);
  g.generateTexture("dot", 8, 8);
  g.destroy();
}