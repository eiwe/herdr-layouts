// Bunker pane header for the `bunker` layout, built from Herdr's `pane` mod via bridge-pane:
//   CLAUDE CODE  ~/dev/herdr-config ──────── STATUS = WORKING ▓▓▓░░  [SPLIT R] [SPLIT D] [ZOOM] [(X)]
// Focused: bright phosphor; otherwise dim. Blocked: amber, pulsing.
// Props from the app: { pane, terminal }. Click: focus the pane.

import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { panes, props, run, home } from "herdr";

const C = { text: "#4dffb0", dim: "#2fb07e", faint: "#145038", screen: "#03140d", alert: "#ffd84d" };
const WORD = { working: "WORKING", blocked: "NEEDS INPUT", done: "DONE", idle: "IDLE" };
const PULSE = { from: 0.3, to: 1, period: 1000 };
const BAR = ["▓░░░░░", "▓▓░░░░", "▓▓▓░░░", "▓▓▓▓░░", "▓▓▓▓▓░", "▓▓▓▓▓▓", "░▓▓▓▓▓", "░░▓▓▓▓", "░░░▓▓▓", "░░░░▓▓", "░░░░░▓", "░░░░░░"];

function folder(cwd) {
  if (!cwd) return "";
  const h = home();
  return cwd === h ? "~" : cwd.startsWith(h + "/") ? "~" + cwd.slice(h.length) : cwd;
}

export default class BunkerPane extends View {
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
    const roomy = this.width === 0 || this.width > 560;
    const key = (id, label, command, args) => h_flex().id(id).h(24).px(8).flex_none().items_center().border(1)
      .border_color(C.faint).text_color(lit ? C.text : C.dim).text_size(18)
      .cursor_pointer().hover((s) => s.opacity(0.8))
      .on_click((_e, cx) => { cx.stop_propagation(); run(command, args); })
      .child(label);
    return h_flex().id(`pane-head-${pane}`).size_full().px(14).gap(12).items_center().bg(C.screen)
      .border_b(1).border_color(C.faint).text_size(20)
      .on_size_change((size, cx) => { if (Math.abs(size.width - this.width) > 1) { this.width = size.width; cx.notify(); } })
      .on_click(() => run("pane.focus", { pane }))
      .child(div().flex_none().max_w(260).truncate().text_color(lit ? C.text : C.dim).child(name.toUpperCase()))
      .child(div().flex_shrink(1).min_w(0).max_w(360).truncate().text_color(C.dim).child(folder(p.cwd)))
      .child(div().flex_1().min_w(10).h(0).border_t(1).border_color(C.faint))
      .when(Boolean(WORD[st]), (el) => el.child(h_flex().flex_none().gap(8).items_center()
        .text_color(st === "blocked" ? C.alert : lit ? C.text : C.dim)
        .when(st === "blocked", (e) => e.loop("opacity", PULSE))
        .child(`STATUS = ${WORD[st]}`)
        .when(st === "working", (e) => e.child(div().frames(BAR, 160)))))
      .when(roomy, (el) => el
        .child(key(`ph-r-${pane}`, "SPLIT R", "pane.split", { direction: "right", pane }))
        .child(key(`ph-d-${pane}`, "SPLIT D", "pane.split", { direction: "down", pane }))
        .child(key(`ph-z-${pane}`, p.zoomed ? "UNZOOM" : "ZOOM", "pane.zoom", { pane }))
        .child(key(`ph-x-${pane}`, "(X)", "pane.close", { pane })));
  }
}
