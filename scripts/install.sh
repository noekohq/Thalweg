#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_dir=$(dirname -- "$script_dir")
install_dir=${THALWEG_INSTALL_DIR:-"$HOME/.local/bin"}

if ! command -v go >/dev/null 2>&1; then
  echo "Thalweg requires Go to install from source." >&2
  exit 1
fi

mkdir -p "$install_dir"
temporary_binary=$(mktemp "${TMPDIR:-/tmp}/thalweg.XXXXXX")
trap 'rm -f "$temporary_binary"' EXIT HUP INT TERM

(
  cd "$repo_dir"
  go build -trimpath -o "$temporary_binary" .
)
chmod 0755 "$temporary_binary"
mv "$temporary_binary" "$install_dir/thalweg"
trap - EXIT HUP INT TERM

echo "Installed thalweg to $install_dir/thalweg"
case ":${PATH:-}:" in
  *":$install_dir:"*) ;;
  *)
    echo "Add $install_dir to PATH, then run: thalweg init"
    ;;
esac
