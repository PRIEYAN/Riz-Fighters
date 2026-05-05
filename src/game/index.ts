import * as Phaser from "phaser";
import { OnboardScene } from "./scenes/OnboardScene";
import { WaitingScene } from "./scenes/WaitingScene";
import { CharSelectScene } from "./scenes/CharSelectScene";
import { FightScene } from "./scenes/FightScene";

export function createGame(parent: HTMLElement) {
  const isMobile = window.innerWidth < 768 || "ontouchstart" in window;
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#0a0a0a",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: isMobile ? Math.min(window.innerWidth, 1280) : 960,
      height: isMobile ? Math.min(window.innerHeight, 720) : 540,
      min: { width: 320, height: 240 },
      max: { width: 1280, height: 720 },
    },
    physics: { default: "arcade", arcade: { gravity: { x: 0, y: 1200 }, debug: false } },
    dom: { createContainer: true },
    scene: [OnboardScene, WaitingScene, CharSelectScene, FightScene],
  };
  return new Phaser.Game(config);
}