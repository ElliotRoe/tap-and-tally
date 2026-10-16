import { newId } from "./ids";
import type { Behavior, Menu } from "./types";

/** Soft background colours that sit well on the paper. */
export const COLORS = [
  { name: "Sky", value: "#cfe1e6" },
  { name: "Straw", value: "#f3e2a6" },
  { name: "Peach", value: "#f5d3bd" },
  { name: "Sage", value: "#d6e3c1" },
  { name: "Rose", value: "#f1cccc" },
  { name: "Lilac", value: "#e0d4ea" },
  { name: "Denim", value: "#cdd6e8" },
  { name: "Sand", value: "#e8dcc6" },
];

export const EMOJIS = [
  "🙋",
  "⭐",
  "🔁",
  "💬",
  "✋",
  "📚",
  "🎯",
  "🤝",
  "💡",
  "👏",
  "❓",
  "✏️",
  "🧠",
  "🎉",
  "👀",
  "🔇",
  "📱",
  "⏰",
  "🚶",
  "🧹",
  "💪",
  "🌵",
  "🤠",
  "🐎",
];

export function newBehavior(index = 0): Behavior {
  return {
    id: newId(),
    name: "",
    emoji: EMOJIS[index % EMOJIS.length],
    color: COLORS[index % COLORS.length].value,
    mode: "count",
  };
}

export function defaultMenu(): Menu {
  return {
    id: newId(),
    name: "Participation",
    behaviors: [
      {
        id: newId(),
        name: "Participation",
        emoji: "🙋",
        color: COLORS[0].value,
        mode: "count",
      },
      {
        id: newId(),
        name: "Positive behavior",
        emoji: "⭐",
        color: COLORS[1].value,
        mode: "count",
      },
      {
        id: newId(),
        name: "Redirect",
        emoji: "🔁",
        color: COLORS[2].value,
        mode: "count",
      },
      {
        id: newId(),
        name: "Prepared",
        emoji: "🎒",
        color: COLORS[3].value,
        mode: "toggle",
      },
    ],
  };
}

/** The Behaviors that show on the Menu's popup. */
export function activeBehaviors(menu: Menu | undefined): Behavior[] {
  return menu?.behaviors.filter((b) => !b.removed) ?? [];
}
