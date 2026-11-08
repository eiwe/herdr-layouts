// Bunker index bar for the `bunker` layout, built from Herdr's `workspace-status` via bridge-status.
// A bright rule, then a keyword index in the style of the terminals it copies:
//   SPACES (3), AGENTS (2), WORKING (1), BLOCKED (0), MACHINES (3), ⌘⇧P COMMANDS (X)      14:22

import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { spaces, agents, machines, run, window, keys } from "herdr";

const C = { text: "#4dffb0", dim: "#2fb07e", rule: "#8affd0", alert: "#ffd84d" };
const PULSE = { from: 0.3, to: 1, period: 1000 };

const clock = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default class BunkerStatus extends View {
  init(_props, cx) {
    this.time = clock();
    cx.timer.every(10000, (cx) => {
      const now = clock();
      if (now !== this.time) { this.time = now; cx.notify(); }
    });
  }

  // The palette key as actually bound, not a hardcoded one.
  hint() {
    const mac = window()?.platform === "macos";
    const mod = { cmd: mac ? "⌘" : "Ctrl+", ctrl: mac ? "⌃" : "Ctrl+", shift: mac ? "⇧" : "Shift+", alt: mac ? "⌥" : "Alt+", option: mac ? "⌥" : "Alt+" };
    const b = keys().find((k) => k.section === "global" && k.action === "app.palette");
    const parts = b && b.keys.endsWith("--") ? [...b.keys.slice(0, -2).split("-"), "-"] : b?.keys.split("-");
    const key = parts && parts.map((p) => mod[p.toLowerCase()] ?? p.toUpperCase()).join("");
    return key ? `${key} COMMANDS (X)` : "COMMANDS (X)";
  }

  render() {
    const list = agents();
    const blocked = list.filter((a) => a.status === "blocked").length;
    const working = list.filter((a) => a.status === "working").length;
    const machineCount = (machines() ?? []).filter((m) => !m.temporary).length || 1;
    return v_flex().size_full().gap(5).text_size(20)
      .child(div().h(2).flex_none().bg(C.rule))
      .child(h_flex().items_center().whitespace_nowrap().text_color(C.text)
        .child(`SPACES (${spaces().length}), AGENTS (${list.length}), WORKING (${working}), `)
        .child(div().text_color(blocked ? C.alert : C.text).when(blocked > 0, (el) => el.loop("opacity", PULSE)).child(`BLOCKED (${blocked})`))
        .child(`, MACHINES (${machineCount}), `)
        .child(div().id("palette").cursor_pointer().hover((s) => s.opacity(0.75)).on_click(() => run("app.palette")).child(this.hint()))
        .child(div().flex_1())
        .child(div().text_color(C.dim).child(this.time)));
  }
}
