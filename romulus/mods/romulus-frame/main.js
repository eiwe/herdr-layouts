// Romulus console pieces for the `romulus` layout, chosen by props().part:
//   plate  the housing plate under the macOS window buttons, with a blinking PWR lamp.
//          It also starts the wake-up sequence (romulus-boot) once per app run (not per reload).
//   keys   the column of square, backlit orange keys beside the work area. They run real
//          commands; a lit key is on (zoomed, panel shown) or always available (splits).
// Fonts: Share Tech Mono and Barlow Semi Condensed (SIL OFL 1.1) in ./fonts load for the
// whole layout. mark.svg / mark-outline.svg: the logo, tinted per screen.

import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { props, run, panes, layout, shared, setShared, openOverlay, updates } from "herdr";

const C = { housing: "#2a2721", edge: "#3a362d", key: "#fd7702", keyOff: "#4a1d08", keyInk: "#2a1000",
  keyText: "#e08a4a", keyEdge: "#17130d", knob: "#3d3930", label: "#d8cdb0", pale: "#b9ab8a" };

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

export default class RomulusFrame extends View {
  init(_props, cx) {
    // The wake-up plays the first time this layout shows in an app run, not on every reload.
    // The flag lives in the mod runtime's memory (globalThis), which a file save keeps and an
    // app restart clears. Not shared(): Herdr saves shared values across restarts, so a
    // shared flag stopped the wake-up after its very first run.
    if (props()?.part !== "plate") return;
    if (shared("romulus.booted") != null) setShared("romulus.booted", null); // the old saved flag
    if (globalThis.romulusBooted) return;
    globalThis.romulusBooted = true;
    cx.timer.after(60, () => {
      openOverlay({ mod: "romulus-boot", kind: "dialog", modal: true, frame: "none", width: 1, height: 1 });
    });
  }

  plate() {
    return v_flex().size_full().items_center().justify_end().pb(10).gap(4)
      .child(div().w(12).h(12).rounded(2).bg(C.key).loop("opacity", { from: 0.35, to: 1, period: 2000 }))
      .child(div().text_size(10).text_color(C.pale).child("PWR"));
  }

  keys() {
    const root = layout();
    const panel = find(root, "panel"), body = find(root, "panel-body");
    const focused = panes().find((p) => p.focused);
    const shown = (id) => Boolean(panel && !panel.hidden && body?.active === id);
    const togglePanel = (id) => {
      if (shown(id)) run("layout.hide", { id: "panel" });
      else { run("layout.select", { stack: "panel-body", child: id }); run("layout.show", { id: "panel" }); }
    };
    const key = (id, top, bottom, lit, action) => v_flex().id(id).w(46).h(42).flex_none().items_center().justify_center()
      .rounded(3).border(2).border_color(C.keyEdge).bg(lit ? C.key : C.keyOff).text_color(lit ? C.keyInk : C.keyText)
      .text_size(10).cursor_pointer().hover((s) => s.opacity(0.85))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_click(action)
      .child(top).when(Boolean(bottom), (el) => el.child(bottom));
    const knob = (i) => div().id(`knob-${i}`).w(18).h(18).rounded(9).bg(C.knob).border(2).border_color(C.keyEdge);
    const ready = Boolean(updates()?.app?.ready);
    return v_flex().size_full().items_center().py(10).gap(10)
      .child(key("k-split-r", "SPLIT", "R", true, () => run("pane.split", { direction: "right" })))
      .child(key("k-split-d", "SPLIT", "D", true, () => run("pane.split", { direction: "down" })))
      .child(key("k-zoom", focused?.zoomed ? "UNZOOM" : "ZOOM", null, Boolean(focused?.zoomed), () => run("pane.zoom", focused ? { pane: focused.pane } : {})))
      .child(div().w(40).h(0).border_t(1).border_color(C.edge))
      .child(key("k-files", "FILES", null, shown("files"), () => togglePanel("files")))
      .child(key("k-diff", "DIFF", null, shown("changes"), () => togglePanel("changes")))
      .child(key("k-cmd", "CMD", null, false, () => run("app.palette")))
      .child(div().flex_1())
      .child(h_flex().gap(6).child(knob(0)).child(knob(1)))
      .child(h_flex().gap(6).child(knob(2)).child(knob(3)))
      .child(h_flex().id("k-set").w(46).h(30).flex_none().items_center().justify_center().rounded(3).border(2).border_color(C.keyEdge)
        .bg(C.knob).text_size(10).text_color(C.label).cursor_pointer().hover((s) => s.opacity(0.85))
        .on_click(() => run("app.settings")).child(ready ? "SET *" : "SET"));
  }

  render() {
    return props()?.part === "keys" ? this.keys() : this.plate();
  }
}

