// Romulus pane header for the `romulus` layout, built from Herdr's `pane` mod via lcars-pane and bunker-pane:
//   [⌜ CLAUDE CODE ⌟] ~/dev/herdr-config ───────── WORKING █ █ █  [ZOOM] [✕]
// Focused: the program sits on a cream tab with corner brackets; otherwise amber on black.
// Blocked: red, pulsing. Props from the app: { pane, terminal }. Click: focus the pane.

import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { panes, props, run, home } from "herdr";

const C = { amber: "#f2c14e", dim: "#c9a447", label: "#a88a3e", faint: "#6b5520", line: "#4a3a14",
  screen: "#0a0906", cream: "#efe3b4", ink: "#1a1408", red: "#ff8a70", edge: "#3a362d" };
const WORD = { working: "WORKING", blocked: "REQUESTING INPUT", done: "DONE", idle: "IDLE" };
const PULSE = { from: 0.3, to: 1, period: 1000 };
// A hatched bar that slides back and forth natively: 3 px stripes, 3 px apart.
const hatch = (w, h, color) => div().relative().w(w).h(h).flex_none().overflow_hidden()
  .child(h_flex().absolute().top(0).left(0).h(h).gap(3).loop("left", { from: 0, to: -6, period: 600 })
    .children(Array.from({ length: Math.ceil(w / 6) + 2 }, () => div().w(3).h(h).flex_none().bg(color))));

function folder(cwd) {
  if (!cwd) return "";
  const h = home();
  return cwd === h ? "~" : cwd.startsWith(h + "/") ? "~" + cwd.slice(h.length) : cwd;
}

export default class RomulusPane extends View {
  init() { this.width = 0; }

  me() {
    return panes().find((p) => p.pane === props()?.pane);
  }

  render() {
    const p = this.me();
    if (!p) return div();
    const name = ((p.program?.agent || p.program?.shell) && p.program.name) || p.title || p.program?.name || "shell";
    const st = p.status;
    const pane = p.pane;
    const lit = p.focused;
    const roomy = this.width === 0 || this.width > 520;
    const key = (id, label, command, args) => h_flex().id(id).h(22).px(8).flex_none().items_center().border(1)
      .border_color(C.faint).text_color(C.dim).text_size(12)
      .cursor_pointer().hover((s) => s.border_color(C.amber))
      .on_click((_e, cx) => { cx.stop_propagation(); run(command, args); })
      .child(label);
    const title = lit
      ? h_flex().h_full().flex_none().px(12).gap(8).items_center().bg(C.cream).text_color(C.ink)
        .child("⌜").child(div().max_w(240).truncate().child(name.toUpperCase())).child("⌟")
      : h_flex().h_full().flex_none().pl(12).items_center().text_color(C.dim).child(div().max_w(240).truncate().child(name.toUpperCase()));
    return h_flex().id(`pane-head-${pane}`).size_full().pr(6).gap(12).items_center().bg(C.screen)
      .border_b(1).border_color(C.edge).text_size(14)
      .on_size_change((size, cx) => { if (Math.abs(size.width - this.width) > 1) { this.width = size.width; cx.notify(); } })
      .on_click(() => run("pane.focus", { pane }))
      .child(title)
      .child(div().flex_shrink(1).min_w(0).max_w(360).truncate().text_color(lit ? C.dim : C.label).child(folder(p.cwd)))
      .child(div().flex_1().min_w(10).h(0).border_t(1).border_color(C.line))
      .when(Boolean(WORD[st]), (el) => el.child(h_flex().flex_none().gap(8).items_center()
        .text_color(st === "blocked" ? C.red : lit ? C.amber : C.dim)
        .when(st === "blocked", (e) => e.loop("opacity", PULSE))
        .child(WORD[st])
        .when(st === "working", (e) => e.child(hatch(40, 10, lit ? C.amber : C.dim)))))
      .when(roomy, (el) => el
        .child(key(`ph-z-${pane}`, p.zoomed ? "UNZOOM" : "ZOOM", "pane.zoom", { pane }))
        .child(key(`ph-x-${pane}`, "✕", "pane.close", { pane })));
  }
}
