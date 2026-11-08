# herdr-layouts

Layouts for the [Herdr](https://herdr.dev) desktop app. In Herdr a **layout**
is the whole window and its look: `layouts/<name>.json` plus the **mods**
(panels written in JavaScript) it uses. A Herdr **theme** is narrower: only the
terminal and panel colors (`themes/<name>.json`).

Each folder here is one layout, laid out the way Herdr's gallery expects
(`layouts/`, `mods/`, `RECIPE.md`), so it can be installed on its own.

Built with [Claude Code](https://claude.com/claude-code) as co-developer:
mockups, layouts and mods were designed and written together.

## Layouts

| Folder | What it is | State |
|---|---|---|
| [`bridge/`](bridge/RECIPE.md) | Star Trek Bridge - LCARS: starship-console look: colored elbows, rails and pill buttons | Built |
| [`bunker/`](bunker/RECIPE.md) | Bunker-terminal look: grey-green housing, green phosphor screens, DOS menus | Built |

## Install

```sh
./install.sh bridge
herdr-app do layout.switch '{"name":"bridge"}'
```

`install.sh <layout>` copies that folder's `layouts/` and `mods/` into
`~/.config/herdr-app` (or `$HERDR_APP_HOME`) and runs `herdr-app check` on
each mod. Run it with no argument to list the layouts. Switch back to Herdr's
own layout with Cmd-Shift-L, or `layout.switch {"name":"main"}`.

## Adding a layout

1. Make `<name>/layouts/<name>.json` and `<name>/mods/<name>-*/`. Prefix
   mod names with the layout name so layouts never share or overwrite a mod.
2. Write `<name>/RECIPE.md` (Herdr's format: what you see, how it behaves,
   built from, watch out, done when).
3. Add a row to the table above.

## Terminal look

The layouts leave the terminal font, size and theme to `settings.json`.
The look they were designed with:

```json
{
  "theme": "graphite",
  "colors": { "background": "#000000" },
  "font": "Hack Nerd Font Mono",
  "font_size": 13
}
```

## Licences

- Mods named `<layout>-tabs` (or `-header`), `-spaces`, `-agents`, `-pane`
  and `-status`
  are modified copies of mods shipped with the Herdr app (version 0.1.13),
  which is open source under the Apache License 2.0.
- Antonio (`bridge/mods/bridge-frame/fonts/`) and VT323
  (`bunker/mods/bunker-frame/fonts/`) are licensed under the SIL Open Font
  License 1.1; see the `OFL.txt` beside each.
- Barlow Semi Condensed (`bridge/mods/bridge-frame/fonts/`) is licensed under
  the SIL Open Font License 1.1; see `OFL-Barlow.txt` beside it.
- The bridge look is inspired by LCARS, the console style from Star Trek; the bunker look is inspired
  by the screens in the TV series Silo. These are unofficial
  fan-styled layouts with original artwork and no affiliation.
