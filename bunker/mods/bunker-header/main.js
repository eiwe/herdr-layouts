// Bunker header for the `bunker` layout, built from Herdr's `tabs` mod via bridge-tabs.
// Two rows on a green phosphor screen:
//   DEVICE NAME: [machine]  SPACE: [name]  TABS: [nn]  AGENTS: [nn]   [NEW TAB] [FILES] [CHANGES]
//   [⌘1 CLAUDE CODE /] [⌘2 ZSH] [⌘3 REVIEW ✓] ──────────────  LAYOUT = BUNKER
// The shown tab is inverted; a blocked tab turns amber and pulses; a working one spins.
// Behavior kept from `tabs`: drag to reorder, double-click to rename, right-click
// menu, scroll to switch, per-space side panel memory.

import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { spaces, panes, agents, run, openOverlay, window, shared, layout } from "herdr";

const C = { text: "#4dffb0", dim: "#2fb07e", faint: "#145038", screen: "#03140d", alert: "#ffd84d" };
const PULSE = { from: 0.3, to: 1, period: 1000 };
const SPIN = ["|", "/", "-", "\\"];
const two = (n) => String(n).padStart(2, "0");

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

export default class BunkerHeader extends View {
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
    return h_flex().id(id).h(26).px(10).flex_none().items_center().border(1).border_color(C.text)
      .bg(on ? C.text : C.screen).text_color(on ? C.screen : C.text)
      .cursor_pointer().hover((s) => s.opacity(0.8))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(action).child(label);
  }

  field(label, value) {
    return h_flex().flex_none().gap(6).items_center()
      .child(div().text_color(C.dim).child(label))
      .child(div().px(8).border(1).border_color(C.faint).text_color(C.text).max_w(240).truncate().child(value));
  }

  render() {
    const space = spaces().find((p) => p.active);
    const shown = space?.tabs ?? [];
    const w = window();
    const mac = w?.platform === "macos";

    const item = (c, i) => {
      const program = panes().find((p) => p.tab === c.id && p.program?.agent)?.program ?? panes().find((p) => p.tab === c.id)?.program;
      const name = /^(tb)?\d+$/.test(c.name) ? program?.name ?? "Terminal" : c.name;
      const blocked = c.status === "blocked";
      const color = blocked ? C.alert : c.active ? C.screen : C.dim;
      const label = `${i < 9 ? (mac ? `⌘${i + 1}` : two(i + 1)) : two(i + 1)} ${(c.zoomed ? `${name} (zoom)` : name).toUpperCase()}`;
      return h_flex().id(`tab-${c.id}`).h(26).px(10).gap(8).flex_none().items_center().border(1)
        .border_color(blocked ? C.alert : c.active ? C.text : C.faint).bg(c.active && !blocked ? C.text : C.screen)
        .text_color(color).cursor_pointer().hover((s) => s.opacity(0.85))
        .when(blocked, (el) => el.loop("opacity", PULSE))
        .on_mouse_down("left", (e, cx) => { cx.stop_propagation(); this.pressed = i; if (e.click_count === 2) run("tab.rename", { id: c.id }); })
        .on_mouse_up("left", () => {
          const from = this.pressed; this.pressed = null;
          if (from !== null && from !== i) run("tab.move", { id: shown[from].id, index: space.tabs.findIndex((x) => x.id === c.id) + 1 });
          else run("tab.select", { id: c.id });
        })
        .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); openOverlay({ mod: "menu", kind: "popup", width: 200, props: { tab: "tab", target: { id: c.id, space: space.id } } }); })
        .child(div().max_w(220).truncate().child(label))
        .when(c.status === "working", (el) => el.child(div().w(10).frames(SPIN, 150)))
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

    return v_flex().size_full().min_w(0).justify_center().gap(8).text_size(20)
      .on_mouse_up("left", () => { this.pressed = null; })
      .on_scroll_wheel((e) => { if (Math.abs(e.delta.y) >= 1) run(e.delta.y > 0 ? "tab.prev" : "tab.next"); })
      .child(h_flex().gap(18).items_center().min_w(0)
        .child(this.field("DEVICE NAME:", (space?.machine ?? "this computer").toUpperCase()))
        .child(this.field("SPACE:", (space?.name ?? "—").toUpperCase()))
        .child(this.field("TABS:", two(shown.length)))
        .child(this.field("AGENTS:", two(agents().length)))
        .child(div().flex_1())
        .child(this.key("tab-new", "NEW TAB", () => openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 })))
        .when(enabled.includes("files"), (el) => el.child(panelKey("files", "FILES")))
        .when(enabled.includes("changes"), (el) => el.child(panelKey("changes", "CHANGES")))
        .when(Boolean(w?.buttons), (el) => el
          .child(this.key("minimize", "MIN", () => run("window.minimize")))
          .child(this.key("maximize", w.maximized ? "RESTORE" : "MAX", () => run("window.maximize")))
          .child(this.key("close-window", "(X)", () => run("window.close")))))
      .child(h_flex().gap(8).items_center().min_w(0)
        // Tabs and the rule share one scrolling row: the rule takes what the tabs leave.
        .child(h_flex().id("tab-scroll").flex_1().min_w(0).items_center().gap(8).overflow_x_scrollbar()
          .children(shown.map(item))
          .child(div().flex_1().min_w(20).h(0).border_t(1).border_color(C.faint)))
        .child(div().flex_none().text_color(C.dim).child("LAYOUT = BUNKER")));
  }
}
