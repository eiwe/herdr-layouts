// Romulus header for the `romulus` layout, built from Herdr's `tabs` mod via lcars-tabs and bunker-header.
// An amber ship console screen:
//   ████████████████████████████████████████████████  ███     (thick amber bar)
//   [ HERDR-CONFIG ]  LOCATION  TABS                    [ROMULUS | mark]
//   [⌘1 CLAUDE CODE █ █] [⌘2 ZSH] [⌘3 REVIEW ✓] [+] - - - - - - -  FILES CHANGES
// The cream bar names the space. The shown tab is filled amber; a working tab's hatch
// marches; a done one shows ✓; a blocked one turns red with ! and pulses.
// Behavior kept from `tabs`: drag to reorder, double-click to rename, right-click
// menu, scroll to switch, per-space side panel memory.

import { View, div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { spaces, panes, run, openOverlay, window, shared, layout } from "herdr";

const C = { amber: "#f2c14e", dim: "#c9a447", label: "#a88a3e", faint: "#6b5520", line: "#4a3a14",
  screen: "#0a0906", cream: "#efe3b4", ink: "#1a1408", red: "#ff8a70", redBg: "#3a0b05" };
const HEAD = "Barlow Semi Condensed";
const PULSE = { from: 0.3, to: 1, period: 1000 };
// A hatched bar that slides back and forth natively: 3 px stripes, 3 px apart.
const hatch = (w, h, color) => div().relative().w(w).h(h).flex_none().overflow_hidden()
  .child(h_flex().absolute().top(0).left(0).h(h).gap(3).loop("left", { from: 0, to: -6, period: 600 })
    .children(Array.from({ length: Math.ceil(w / 6) + 2 }, () => div().w(3).h(h).flex_none().bg(color))));
const two = (n) => String(n).padStart(2, "0");

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

export default class RomulusHeader extends View {
  init() {
    this.pressed = null;
    this.panels = JSON.parse(localStorage.getItem("panels") ?? "{}");
  }

  // The side panel is remembered per space, as in Herdr's tab bar.
  syncPanel(space, panel, body, enabled) {
    if (!space || !panel) return;
    const now = panel.hidden ? null : body?.active ?? null;
    if (space.id !== this.space) {
      const first = this.space === undefined;
      this.space = space.id; this.pending = null;
      if (!(first && !(space.id in this.panels))) {
        const stored = this.panels[space.id] ?? null, want = enabled.includes(stored) ? stored : null;
        if (want !== now) {
          this.pending = { want, until: Date.now() + 1000 };
          if (want) { run("layout.select", { stack: "panel-body", child: want }); run("layout.show", { id: "panel" }); }
          else run("layout.hide", { id: "panel" });
          return;
        }
      }
    }
    if (this.pending) {
      if (this.pending.want !== now && Date.now() < this.pending.until) return;
      this.pending = null;
    }
    if (this.panels[space.id] === now) return;
    this.panels[space.id] = now;
    localStorage.setItem("panels", JSON.stringify(this.panels));
  }

  key(id, label, action, on = false) {
    return h_flex().id(id).h(26).px(10).flex_none().items_center().border(1).border_color(on ? C.amber : C.faint)
      .bg(on ? C.amber : C.screen).text_color(on ? C.ink : C.dim).text_size(13)
      .cursor_pointer().hover((s) => s.border_color(C.amber))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(action).child(label);
  }

  field(label, value) {
    return v_flex().flex_none().min_w(0)
      .child(div().text_size(10).text_color(C.label).child(label))
      .child(div().text_size(14).text_color(C.amber).max_w(200).truncate().child(value));
  }

  render() {
    const space = spaces().find((p) => p.active);
    const shown = space?.tabs ?? [];
    const w = window();
    const mac = w?.platform === "macos";
    const ps = panes();

    const item = (c, i) => {
      const program = ps.find((p) => p.tab === c.id && p.program?.agent)?.program ?? ps.find((p) => p.tab === c.id)?.program;
      const name = /^(tb)?\d+$/.test(c.name) ? program?.name ?? "Terminal" : c.name;
      const blocked = c.status === "blocked";
      const on = c.active && !blocked;
      const ink = blocked ? C.red : on ? C.ink : C.dim;
      const label = `${i < 9 ? (mac ? `⌘${i + 1}` : two(i + 1)) : two(i + 1)} ${(c.zoomed ? `${name} (zoom)` : name).toUpperCase()}`;
      return h_flex().id(`tab-${c.id}`).h(26).px(12).gap(10).flex_none().items_center().border(1)
        .border_color(blocked ? C.red : c.active ? C.amber : C.faint).bg(blocked ? C.redBg : on ? C.amber : C.screen)
        .text_color(ink).text_size(14).cursor_pointer().hover((s) => s.border_color(blocked ? C.red : C.amber))
        .when(blocked, (el) => el.loop("opacity", PULSE))
        .on_mouse_down("left", (e, cx) => { cx.stop_propagation(); this.pressed = i; if (e.click_count === 2) run("tab.rename", { id: c.id }); })
        .on_mouse_up("left", () => {
          const from = this.pressed; this.pressed = null;
          if (from !== null && from !== i) run("tab.move", { id: shown[from].id, index: space.tabs.findIndex((x) => x.id === c.id) + 1 });
          else run("tab.select", { id: c.id });
        })
        .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); openOverlay({ mod: "menu", kind: "popup", width: 200, props: { tab: "tab", target: { id: c.id, space: space.id } } }); })
        .child(div().max_w(220).truncate().child(label))
        .when(c.status === "working", (el) => el.child(hatch(30, 8, ink)))
        .when(c.status === "done", (el) => el.child("✓"))
        .when(blocked, (el) => el.child("!"));
    };

    const root = layout();
    const panel = find(root, "panel"), body = find(root, "panel-body");
    const enabled = shared("workspace.panels") ?? ["files", "changes"];
    this.syncPanel(space, panel, body, enabled);
    const panelKey = (id, label) => {
      const on = panel && !panel.hidden && body?.active === id;
      return this.key(`panel-${id}`, label, () => {
        if (on) run("layout.hide", { id: "panel" });
        else { run("layout.select", { stack: "panel-body", child: id }); run("layout.show", { id: "panel" }); }
      }, on);
    };

    return v_flex().size_full().min_w(0).gap(8)
      .on_mouse_up("left", () => { this.pressed = null; })
      .on_scroll_wheel((e) => { if (Math.abs(e.delta.y) >= 1) run(e.delta.y > 0 ? "tab.prev" : "tab.next"); })
      // The thick amber bar from the ship's screens, with its short tail.
      .child(h_flex().flex_none().gap(8).child(div().flex_1().h(6).bg(C.amber)).child(div().w(34).h(6).bg(C.amber)))
      .child(h_flex().gap(20).items_center().min_w(0)
        .child(h_flex().w(300).h(26).flex_none().px(10).items_center().bg(C.cream).text_color(C.ink).text_size(16)
          .child(div().truncate().child((space?.name ?? "—").toUpperCase())))
        .child(this.field("LOCATION", (space?.machine ?? "this computer").toUpperCase()))
        .child(this.field("TABS", two(shown.length)))
        .child(div().flex_1())
        // The ident box: 34 px is what the header row has (bar 6 + gaps 16 + tabs 26 in 82).
        // Both halves fill its height, so the divider stops at the box's edges.
        .child(h_flex().h(34).flex_none().items_stretch().border(1).border_color(C.amber).overflow_hidden()
          .child(v_flex().h_full().px(10).justify_center().border_r(1).border_color(C.amber)
            .child(div().font_family(HEAD).font_weight(700).text_size(14).text_color(C.amber).child("ROMULUS"))
            .child(div().mt(-3).text_size(9).text_color(C.label).child("HERDR LAYOUT")))
          .child(h_flex().h_full().w(76).items_center().justify_center()
            .child(svg("mods/romulus-frame/mark.svg").w(58).h(13).text_color(C.amber))))
        .when(Boolean(w?.buttons), (el) => el
          .child(this.key("minimize", "MIN", () => run("window.minimize")))
          .child(this.key("maximize", w.maximized ? "RESTORE" : "MAX", () => run("window.maximize")))
          .child(this.key("close-window", "✕", () => run("window.close")))))
      .child(h_flex().gap(8).items_center().min_w(0)
        // Tabs, the + key and the dashed rule share one scrolling row: the rule takes what the tabs leave.
        .child(h_flex().id("tab-scroll").flex_1().min_w(0).items_center().gap(8).overflow_x_scrollbar()
          .children(shown.map(item))
          .child(h_flex().id("tab-new").h(26).w(30).flex_none().items_center().justify_center().border(1).border_color(C.faint)
            .text_color(C.dim).text_size(16).cursor_pointer().hover((s) => s.border_color(C.amber))
            .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
            .on_click(() => openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 })).child("+"))
          .child(div().flex_1().min_w(20).h(0).border_t(1).border_color(C.line)))
        .when(enabled.includes("files"), (el) => el.child(panelKey("files", "FILES")))
        .when(enabled.includes("changes"), (el) => el.child(panelKey("changes", "CHANGES"))));
  }
}
