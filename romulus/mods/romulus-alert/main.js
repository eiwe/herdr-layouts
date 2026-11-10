// Romulus alert for the `romulus` layout: a red screen floating over the work area,
// shown only while an agent is blocked, after the film's bracketed takeover banner:
//   ──────────── ATTENTION! ────────────
//   ▏ NAV-COMPUTER/CODEX REQUESTING INPUT   [OPEN] ▕
//   OPEN FOCUSES THE AGENT
// OPEN focuses that agent's pane. Renders nothing (and so hides) when no agent needs the person.

import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { agents, run } from "herdr";

const C = { bg: "#1c0604", panel: "#2e0905", rim: "#962c0d", text: "#ffb39e", bright: "#ffd9cc", note: "#e08a70",
  key: "#fd7702", keyInk: "#2a1000", keyEdge: "#17130d" };
const HEAD = "Barlow Semi Condensed";
const PULSE = { from: 0.3, to: 1, period: 1000 };

export default class RomulusAlert extends View {
  render() {
    const blocked = agents().filter((a) => a.status === "blocked");
    if (!blocked.length) return div();
    const a = blocked[0];
    const n = blocked.length;
    const who = [a.space_name, a.program?.name].filter(Boolean).join("/").toUpperCase();
    return v_flex().w(560).px(16).pt(10).pb(12).gap(8).items_center().bg(C.bg).border(3).border_color(C.rim).text_color(C.text)
      .child(h_flex().w_full().gap(10).items_center()
        .child(div().flex_1().h(0).border_t(1).border_color(C.rim))
        .child(div().text_size(12).loop("opacity", PULSE).child("ATTENTION!"))
        .child(div().flex_1().h(0).border_t(1).border_color(C.rim)))
      .child(h_flex().w_full().px(14).py(8).gap(12).items_center().justify_between().bg(C.panel)
        .border_l(2).border_r(2).border_color(C.text)
        .child(div().flex_1().min_w(0).truncate().font_family(HEAD).font_weight(700).text_size(20).text_color(C.bright)
          .child(`${who} REQUESTING INPUT`))
        .child(h_flex().id("alert-open").h(30).px(16).flex_none().items_center().bg(C.key).border(2).border_color(C.keyEdge)
          .rounded(3).text_size(14).text_color(C.keyInk).cursor_pointer().hover((s) => s.opacity(0.85))
          .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
          .on_click(() => run("pane.focus", { pane: a.pane }))
          .child("OPEN")))
      .child(div().text_size(12).text_color(C.note).child(n > 1 ? `${n} AGENTS BLOCKED · OPEN GOES TO THE FIRST` : "OPEN FOCUSES THE AGENT"));
  }
}
