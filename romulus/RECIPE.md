# Alien: Romulus - Ship Console

A full-window layout for the Herdr desktop app styled after the cassette-futurist
ship consoles in the film Alien: Romulus: a dark housing, amber phosphor screens with
thick amber bars, a cream title bar, square backlit orange keys, digits in separate
boxes, and a four-stage wake-up sequence when the layout opens. Terminals keep the
person's own font, size and colors.

## What you see

- **Housing:** the window background is a vertical gradient `#211f1a` to `#141310`,
  16 px padding, 12 px gaps. No system title bar; the macOS window buttons sit on a
  68 px plate at the top left (`traffic_lights` `[24, 28]`), with a slowly blinking
  orange PWR lamp at its foot.
- **Screens:** each region is a screen node: background `#0a0906` (spaces `#07110d`),
  3 px border `#3a362d`, radius 8. Text is Share Tech Mono; headings are Barlow Semi
  Condensed Bold. Amber `#f2c14e`, dim `#c9a447`, labels `#a88a3e`, faint `#6b5520`,
  cream `#efe3b4`, teal `#9fd6b0` (spaces), alert red `#ff8a70`, keys `#fd7702`.
- **Header screen** (104 px tall): a 6 px amber bar with a short tail; the space name
  on a cream bar; LOCATION and TABS as label-value pairs; an ident box (ROMULUS, the
  logo). Then the tabs as amber keys: the shown tab filled, a working tab with a
  sliding hatch, a done one with ✓, a blocked one red with ! and pulsing. A + key,
  a rule, FILES and CHANGES (filled when open).
- **Key column** (68 px): square orange keys that run commands: SPLIT R, SPLIT D,
  ZOOM (lit while zoomed), FILES and DIFF (lit while that panel shows), CMD (the
  palette); four knobs; SET (settings, `*` when an update is ready).
- **Spaces screen** (teal): SPACES with the count of spaces and machines, a +; spaces
  grouped by machine as cards: a planet ring (filled for the shown space), the name,
  where it is (repo, branch, ahead/behind), its number.
- **Agents screen** (amber): ACTIVE OPERATIONS under a 5 px bar; each agent
  is a checkbox (✓ done, ✕ idle, ! blocked) with its name and age, then a bar: hatched
  and sliding while working, full when done, red while blocked, empty when idle.
- **Panes:** black terminals, radius 8, 2 px border `#3a362d`, focused `#9fd6b0`. A
  32 px header: the focused pane's program on a cream tab with corner brackets,
  the folder, a rule, the state (WORKING with a hatch), ZOOM and ✕.
- **Status screen** (60 px): ACTUAL TIME and the date; SPACES, AGENTS, WORKING,
  BLOCKED and MACHINES as two boxed digits each (BLOCKED red and pulsing above zero);
  the palette key; the clock as four boxed digits.
- **Alert:** while any agent is blocked, a red screen floats at the top of the work
  area: ATTENTION!, `<SPACE>/<PROGRAM> REQUESTING INPUT` in brackets, an orange OPEN key.
- **Wake-up:** the first time the layout shows in an app run, a full-window sequence
  plays for about 4 seconds: (1) dark, only the PWR lamp; (2) a red card with the
  outlined logo, WEYLAND CORP and the Herdr version; (3) `HC/CORE 0813 WAKING UP...`
  typing in between two thick amber bars; (4) COMPUTER READY with the actual time,
  location and machines in range, then ✓ RESTORING n SPACES, ✓ REATTACHING n AGENTS,
  ▸ OPENING LAYOUT ROMULUS. A click or Esc skips it.

## How it behaves

- Tabs: click selects, drag reorders, double-click renames, right-click opens the tab
  menu, scrolling switches. Space rows drag to reorder.
- OPEN on the alert focuses the blocked agent's pane. The alert renders nothing when
  no agent is blocked, so it hides.
- The wake-up is a dialog (`frame: "none"`, the whole window) that `romulus-frame`'s
  plate opens once per app run. A flag in the mod runtime's memory (`globalThis`) keeps a
  file save from replaying it; a restart clears it. Not `shared()`: Herdr saves those across restarts.
  Its four stage changes are one-shot timers; the typing (`.frames()`), blinks and
  lamp (`.loop("opacity")`) are native.
- Hatched bars are rows of 3 px stripes that slide with `.loop("left")`. No redraw
  timers; the clock checks every 10 s and redraws when the minute changes.

## Built from

- `layouts/romulus.json`: root `column` (gradient, `ui_font` Share Tech Mono, `colors`
  for canvas, chrome, surface, popover, accent, border, input, selected, hover). Rows:
  `top` (`plate`, `tabs`), `middle` (`keys`; `sidebar` column with `spaces` and
  `agents`; `work-body` with the `main` tab block, the hidden `panel` stack and a
  floating `alert`), `status`.
- `mods/romulus-frame`: new; parts `plate` and `keys`. Carries the fonts in `fonts/`
  and the logo (`mark.svg`, `mark-outline.svg`), redrawn as vector paths.
- `mods/romulus-boot`, `mods/romulus-alert`: new.
- `mods/romulus-header` (from `tabs`), `romulus-spaces` (from `spaces`),
  `romulus-agents` (from `agents`), `romulus-pane` (from `pane`), `romulus-status`
  (from `workspace-status`), each by way of the LCARS and bunker copies.

## Watch out

- The logo is the film's fictional company mark (a studio trademark), redrawn as
  vector paths for this fan layout. To use an original mark, replace `mark.svg` and
  `mark-outline.svg` (764 × 174, single colour; the mods tint them).
- No glow, scanlines or screen curvature: Herdr can't draw them.
- `theme.foreground` and `background` are left alone on purpose: overriding them
  would recolor the terminals.
- Herdr's own screens (Settings, palette, dialogs, toasts) keep their shape and only
  take the colors.

## Done when

- `herdr-app check` passes for every `mods/romulus-*` folder.
- After `layout.switch {"name":"romulus"}`, the wake-up plays through its four stages
  and closes, and `herdr-app status` shows no errors.
- A working agent's tab, pane header and checklist bar show a sliding hatch; a blocked
  one turns red, pulses, and raises the alert with a working OPEN.
