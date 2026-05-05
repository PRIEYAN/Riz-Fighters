import { useEffect, useRef } from "react";

// Tiny event bus the FightScene listens to.
type Cb = () => void;
const listeners = new Map<string, Set<Cb>>();
const bus = {
  on(e: string, cb: Cb) { if (!listeners.has(e)) listeners.set(e, new Set()); listeners.get(e)!.add(cb); },
  off(e: string, cb: Cb) { listeners.get(e)?.delete(cb); },
  emit(e: string) { listeners.get(e)?.forEach((c) => c()); },
};
if (typeof window !== "undefined") (window as any).__mobileBus = bus;

export function MobileControls() {
  const joyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let manager: any;
    (async () => {
      const nipplejs = (await import("nipplejs")).default;
      if (!joyRef.current) return;
      manager = nipplejs.create({
        zone: joyRef.current, mode: "static", position: { left: "60px", bottom: "60px" },
        color: "#ffd700", size: 120,
      });
      manager.on("move", (_: any, data: any) => {
        const v = data.vector || { x: 0, y: 0 };
        window.dispatchEvent(new CustomEvent("rz-joy", { detail: { x: v.x, y: -v.y } }));
      });
      manager.on("end", () => window.dispatchEvent(new CustomEvent("rz-joy", { detail: { x: 0, y: 0 } })));
    })();
    return () => { try { manager?.destroy(); } catch {} };
  }, []);

  const btn = (label: string, color: string, onDown: () => void, onUp?: () => void, style?: React.CSSProperties) => (
    <button
      onTouchStart={(e) => { e.preventDefault(); onDown(); }}
      onTouchEnd={(e) => { e.preventDefault(); onUp?.(); }}
      onMouseDown={onDown}
      onMouseUp={onUp}
      style={{
        position: "absolute", width: 70, height: 70, borderRadius: "50%",
        background: "rgba(0,0,0,0.6)", border: `3px solid ${color}`, color: "#fff",
        fontFamily: '"Press Start 2P", monospace', fontSize: 9, letterSpacing: 1,
        touchAction: "none", userSelect: "none", ...style,
      }}
    >{label}</button>
  );

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1000 }}>
      <div ref={joyRef} style={{ position: "absolute", left: 0, bottom: 0, width: 200, height: 200, pointerEvents: "auto" }} />
      <div style={{ position: "absolute", right: 20, bottom: 20, width: 200, height: 200, pointerEvents: "auto" }}>
        {btn("PUNCH", "#ff3030", () => bus.emit("punch"), undefined, { right: 65, top: 0 })}
        {btn("BLOCK", "#ffd700", () => bus.emit("block-down"), () => bus.emit("block-up"), { left: 0, top: 65 })}
        {btn("KICK", "#3080ff", () => bus.emit("kick"), undefined, { right: 0, top: 65 })}
        {btn("JUMP", "#55cc88", () => bus.emit("jump"), undefined, { right: 65, bottom: 0 })}
      </div>
    </div>
  );
}