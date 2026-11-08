// Bunker console pieces for the `bunker` layout, chosen by props().part:
//   plate   the housing plate under the macOS window buttons: a vent grille
//   footer  SETTINGS and ADD MACHINE as boxed keys, under the sidebar lists
// Fonts: VT323 (SIL OFL 1.1) in ./fonts loads for the whole layout (ui_font).

import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { props, run, updates } from "herdr";

const C = { text: "#4dffb0", screen: "#03140d", slot: "#252b23" };

export default class BunkerFrame extends View {
  plate() {
    return v_flex().size_full().justify_end().pb(8).px(8)
      .child(v_flex().gap(3).children([0, 1, 2, 3, 4, 5, 6].map((i) => div().id(`vent-${i}`).h(3).rounded(2).bg(C.slot))));
  }

  footer() {
    const key = (id, label, action) => h_flex().id(id).flex_1().h(30).items_center().justify_center().border(1)
      .border_color(C.text).text_color(C.text).text_size(20).cursor_pointer().hover((s) => s.opacity(0.8))
      .on_click(action).child(label);
    const ready = Boolean(updates()?.app?.ready);
    return h_flex().size_full().gap(8).items_center()
      .child(key("settings", ready ? "SETTINGS *" : "SETTINGS", () => run("app.settings")))
      .child(key("machine", "ADD MACHINE", () => run("mod.open", { name: "machine-add" })));
  }

  render() {
    return props()?.part === "plate" ? this.plate() : this.footer();
  }
}
