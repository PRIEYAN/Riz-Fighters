import { useEffect, useRef, useState } from "react";
import { MobileControls } from "./MobileControls";

export function RizFightersGame() {
  const ref = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    let cancelled = false;
    (async () => {
      const { createGame } = await import("@/game");
      if (cancelled || !ref.current) return;
      gameRef.current = createGame(ref.current);
    })();
    return () => { cancelled = true; try { gameRef.current?.destroy(true); } catch {} };
  }, []);

  return (
    <div
      id="game-container"
      style={{
        position: "fixed", inset: 0, background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
      }}
    >
      <div ref={ref} style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 8px rgba(255,200,0,0.3))" }} />
      {/* scanline overlay */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50,
          background: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.04) 0 1px, transparent 1px 3px)",
          mixBlendMode: "overlay",
        }}
      />
      {!isMobile && (
        <div style={{
          position: "fixed", bottom: 8, left: "50%", transform: "translateX(-50%)",
          fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: "#888", zIndex: 60,
          background: "rgba(0,0,0,0.6)", padding: "6px 12px", border: "1px solid #333",
        }}>
          A/D MOVE · W JUMP · S CROUCH · J PUNCH · L KICK · F BLOCK
        </div>
      )}
      {isMobile && <MobileControls />}
    </div>
  );
}