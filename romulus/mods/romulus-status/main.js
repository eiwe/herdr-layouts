// Romulus status bar for the `romulus` layout, built from Herdr's `workspace-status` via lcars- and bunker-status.
// Counts as digits in separate boxes, the way the ship's work-contract screen shows hours:
//   ACTUAL TIME 10 NOV 2026 | SPACES [0][3]  AGENTS [0][2]  WORKING [0][1]  BLOCKED [0][0]  MACHINES [0][3]   ⌘⇧P COMMANDS  [1][4]:[2][2]
// BLOCKED turns red and pulses when above zero.

import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { spaces, agents, machines, run, window, keys } from "herdr";

const C = { amber: "#f2c14e", dim: "#c9a447", label: "#a88a3e", faint: "#6b5520", edge: "#3a362d", red: "#ff8a70" };
const PULSE = { from: 0.3, to: 1, period: 1000 };
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const two = (n) => String(n).padStart(2, "0");
const clock = () => { const d = new Date(); return `${two(d.getHours())}${two(d.getMinutes())}`; };
const today = () => { const d = new Date(); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

const digit = (ch, color) => h_flex().w(18).h(26).flex_none().items_center().justify_center().border(1).border_color(color)
  .text_size(18).text_color(color).child(ch);

export default class RomulusStatus extends View {
  init(_props, cx) {
    this.time = clock();
    this.date = today();
    cx.timer.every(10000, (cx) => {
      const now = clock();
      if (now !== this.time) { this.time = now; this.date = today(); cx.notify(); }
    });
  }

  // The palette key as actually bound, not a hardcoded one.
  hint() {
    const mac = window()?.platform === "macos";
    const mod = { cmd: mac ? "⌘" : "Ctrl+", ctrl: mac ? "⌃" : "Ctrl+", shift: mac ? "⇧" : "Shift+", alt: mac ? "⌥" : "Alt+", option: mac ? "⌥" : "Alt+" };
    const b = keys().find((k) => k.section === "global" && k.action === "app.palette");
    const parts = b && b.keys.endsWith("--") ? [...b.keys.slice(0, -2).split("-"), "-"] : b?.keys.split("-");
    const key = parts && parts.map((p) => mod[p.toLowerCase()] ?? p.toUpperCase()).join("");
    return key ? `${key} COMMANDS` : "COMMANDS";
  }

  counter(label, n, color, pulse = false) {
    const s = two(Math.min(n, 99));
    return h_flex().flex_none().gap(8).items_center().text_color(color)
      .when(pulse, (el) => el.loop("opacity", PULSE))
      .child(div().text_size(12).child(label))
      .child(h_flex().gap(2).child(digit(s[0], color)).child(digit(s[1], color)));
  }

  render() {
    const list = agents();
    const blocked = list.filter((a) => a.status === "blocked").length;
    const working = list.filter((a) => a.status === "working").length;
    const machineCount = (machines() ?? []).filter((m) => !m.temporary).length || 1;
    return h_flex().size_full().gap(22).items_center().whitespace_nowrap().text_color(C.amber)
      .child(v_flex().flex_none()
        .child(div().text_size(10).text_color(C.label).child("ACTUAL TIME"))
        .child(div().text_size(14).child(this.date)))
      .child(div().w(0).h(34).flex_none().border_l(1).border_color(C.edge))
      .child(this.counter("SPACES", spaces().length, C.amber))
      .child(this.counter("AGENTS", list.length, C.amber))
      .child(this.counter("WORKING", working, C.amber))
      .child(this.counter("BLOCKED", blocked, blocked ? C.red : C.amber, blocked > 0))
      .child(this.counter("MACHINES", machineCount, C.amber))
      .child(div().flex_1())
      .child(h_flex().id("palette").h(26).px(10).flex_none().items_center().border(1).border_color(C.faint)
        .text_size(13).text_color(C.dim).cursor_pointer().hover((s) => s.border_color(C.amber))
        .on_click(() => run("app.palette")).child(this.hint()))
      .child(h_flex().flex_none().gap(2).items_center()
        .child(digit(this.time[0], C.amber)).child(digit(this.time[1], C.amber))
        .child(div().w(10).text_size(18).text_center().child(":"))
        .child(digit(this.time[2], C.amber)).child(digit(this.time[3], C.amber)));
  }
}
