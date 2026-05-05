import { createFileRoute } from "@tanstack/react-router";
import { RizFightersGame } from "@/components/RizFightersGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Riz'Fighters — Online 2D Arcade Brawler" },
      { name: "description", content: "Pixel-art Street Fighter-style multiplayer brawler. Best of 3, random stages, online rooms." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" },
    ],
  }),
  component: Index,
});

function Index() {
  return <RizFightersGame />;
}
