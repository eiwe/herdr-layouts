// Romulus wake-up sequence: a full-window dialog the plate opens once per app run.
// Four stages, after the ship's wake-up in the film, 6.5 seconds in all:
//   1 LAMP          0.0–0.8 s  everything dark but the PWR lamp
//   2 IDENT         0.8–2.2 s  a red card with the outlined logo
//   3 WAKING UP     2.2–4.6 s  "HC/CORE WAKING UP..." types in (about 1.5 s) between two thick amber bars
//   4 COMPUTER READY 4.6–6.5 s live values (time, location, machines), then a checklist
// Then it closes itself. A click or Esc skips it. The stage changes are four one-shot
// timers; the typing, the blink and the lamp are native animations.

import { View, div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { props, closeOverlay, spaces, agents, machines, updates } from "herdr";

const C = { black: "#050403", amber: "#f2c14e", dim: "#c9a447", red: "#962c0d", cream: "#fff1e8", key: "#fd7702", pale: "#b9ab8a" };
const HEAD = "Barlow Semi Condensed";
const STAGES = [800, 2200, 4600, 6500];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const two = (n) => String(n).padStart(2, "0");
const BLINK = { from: 0.15, to: 1, period: 700 };

// The typed line as .frames(): one more letter every 70 ms, then held (the list is long
// enough that it never loops while the stage shows).
function typed(text) {
  const out = [];
  for (let i = 1; i <= text.length; i++) out.push(text.slice(0, i));
  for (let i = 0; i < 60; i++) out.push(text);
  return out;
}

export default class RomulusBoot extends View {
  init(_props, cx) {
    this.stage = 0;
    STAGES.forEach((ms, i) => cx.timer.after(ms, (cx) => {
      if (i === STAGES.length - 1) return this.close();
      this.stage = i + 1;
      cx.notify();
    }));
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    closeOverlay(props().overlay);
  }

  // Where the plate's PWR lamp sits in the layout: root padding 16, plate 68 wide and 104 tall,
// the lamp centred, 10 px up from the plate's foot under its PWR label.
  lamp() {
    return div().size_full().relative()
      .child(div().absolute().left(44).top(82).w(12).h(12).rounded(2).bg(C.key).loop("opacity", { from: 0.2, to: 1, period: 500 }))
      .child(div().absolute().left(40).top(98).text_size(10).text_color(C.pale).child("PWR"));
  }

  ident() {
    return v_flex().size_full().items_center().justify_center().bg(C.red).gap(18)
      .child(svg("mods/romulus-frame/mark-outline.svg").w(388).h(93).text_color(C.cream))
      .child(div().font_family(HEAD).font_weight(500).text_size(30).text_color(C.cream).child("WEYLAND CORP"))
      .child(div().px(14).py(2).border(2).border_color(C.cream).text_size(16).text_color(C.cream)
        .child(`HERDR ${updates()?.app?.version ?? ""}`.trim()));
  }

  bars(children) {
    return v_flex().size_full().px(48).pt(48)
      .child(h_flex().gap(12).child(div().flex_1().h(10).bg(C.amber)).child(div().w(40).h(10).bg(C.amber)))
      .children(children);
  }

  waking() {
    return this.bars([
      h_flex().mt(140).font_family(HEAD).font_weight(700).text_size(34).text_color(C.amber)
        .child(div().frames(typed("HC/CORE 0813 WAKING UP"), 70))
        .child(div().loop("opacity", BLINK).child("...")),
      div().flex_1(),
      div().h(120).border_2().border_t(14).border_b(0).border_color(C.amber),
    ]);
  }

  ready() {
    const d = new Date();
    const time = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}  ${two(d.getHours())}:${two(d.getMinutes())}`;
    const remote = (machines() ?? []).filter((m) => !m.temporary).length;
    const sp = spaces().length, ag = agents().length;
    const row = (label, value) => h_flex().gap(24)
      .child(div().w(220).text_size(18).text_color(C.dim).child(label))
      .child(div().font_family(HEAD).font_weight(700).text_size(24).text_color(C.amber).child(value));
    const check = (text) => div().text_size(16).text_color(C.amber).child(`✓ ${text}`);
    return v_flex().size_full().px(48).pt(48)
      .child(div().w(260).h(10).bg(C.amber))
      .child(h_flex().mt(8).justify_between().text_size(18).text_color(C.amber)
        .child("COMPUTER READY")
        .child(`CORE ${updates()?.core?.version ?? "ONLINE"}`))
      .child(v_flex().mt(60).gap(6)
        .child(row("ACTUAL TIME", time))
        .child(row("LOCATION", "THIS COMPUTER"))
        .child(row("MACHINES", `${two(Math.max(remote, 1))} IN RANGE`)))
      .child(div().flex_1())
      .child(v_flex().px(18).py(14).gap(6).border_2().border_t(14).border_b(0).border_color(C.amber)
        .child(check(`RESTORING ${sp} SPACE${sp === 1 ? "" : "S"}`))
        .child(check(`REATTACHING ${ag} AGENT${ag === 1 ? "" : "S"}`))
        .child(div().text_size(16).text_color(C.amber).loop("opacity", BLINK).child("▸ OPENING LAYOUT ROMULUS")));
  }

  render() {
    const screen = [() => this.lamp(), () => this.ident(), () => this.waking(), () => this.ready()][this.stage]();
    return div().id("romulus-boot").size_full().bg(C.black).cursor_pointer()
      .on_click(() => this.close())
      .child(screen);
  }
}
