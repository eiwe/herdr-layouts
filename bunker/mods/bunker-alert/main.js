// Bunker alert bar for the `bunker` layout: a pale inverted bar, floating over the
// work area, shown only while an agent is blocked. OPEN focuses that agent's pane.
// Renders nothing (and so hides) when no agent needs the person.

import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { agents, run } from "herdr";

const C = { pale: "#d6ece8", pale2: "#b9d3ce", ink: "#0b1a18" };

export default class BunkerAlert extends View {
  render() {
    const blocked = agents().filter((a) => a.status === "blocked");
    if (!blocked.length) return div();
    const a = blocked[0];
    const n = blocked.length;
    const who = [a.space_name, a.program?.name].filter(Boolean).join("/").toUpperCase();
    return v_flex().w(600).gap(3).text_size(22)
      .child(h_flex().h(52).px(18).gap(16).items_center().bg(C.pale).text_color(C.ink)
        .child(div().flex_none().child(`${n} AGENT${n === 1 ? "" : "S"} NEED${n === 1 ? "S" : ""} YOU`))
        .child(div().flex_1())
        .child(h_flex().id("alert-open").h(30).px(28).flex_none().items_center().border(1).border_color(C.ink)
          .cursor_pointer().hover((s) => s.bg(C.pale2))
          .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
          .on_click(() => run("pane.focus", { pane: a.pane }))
          .child("OPEN"))
        .child(div().flex_1())
        .child(div().flex_none().max_w(200).truncate().child(who)))
      .child(h_flex().h(20).px(18).items_center().justify_between().bg(C.pale2).text_size(16).text_color(C.ink)
        .child("OPEN FOCUSES THE AGENT")
        .child(n > 1 ? `+${n - 1} MORE` : "BLOCKED"));
  }
}
