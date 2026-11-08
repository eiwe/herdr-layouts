#!/bin/sh
# Install one layout folder from this repo into the Herdr app's home:
#   ./install.sh bridge
# Copies <layout>/layouts/* and <layout>/mods/* into ~/.config/herdr-app
# (or $HERDR_APP_HOME), then checks each mod. Herdr picks the files up live.
# Files with the same names are replaced; nothing else is touched.
set -eu

here=$(cd "$(dirname "$0")" && pwd)
home=${HERDR_APP_HOME:-"$HOME/.config/herdr-app"}
name=${1:-}

if [ -z "$name" ] || [ ! -d "$here/$name/layouts" ]; then
  echo "usage: $0 <layout>" >&2
  echo "layouts in this repo:" >&2
  for d in "$here"/*/layouts; do echo "  $(basename "$(dirname "$d")")" >&2; done
  exit 2
fi
if [ ! -d "$home" ]; then
  echo "Herdr app home not found: $home (start Herdr once, or set HERDR_APP_HOME)" >&2
  exit 1
fi

src="$here/$name"
mkdir -p "$home/layouts" "$home/mods"
cp "$src"/layouts/* "$home/layouts/"
if [ -d "$src/mods" ]; then
  for mod in "$src"/mods/*/; do
    mod_name=$(basename "$mod")
    mkdir -p "$home/mods/$mod_name"
    cp -R "$mod". "$home/mods/$mod_name/"
    herdr-app check "$home/mods/$mod_name"
  done
fi

echo "Installed $name. Switch to it with: herdr-app do layout.switch '{\"name\":\"$name\"}'"
