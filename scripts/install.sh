#!/bin/sh
set -eu
umask 077

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_dir=$(dirname -- "$script_dir")
install_dir=${THALWEG_INSTALL_DIR:-"$HOME/.local/bin"}
source_dir=${THALWEG_INSTALL_SOURCE_DIR:-"$repo_dir"}

data_root=${XDG_DATA_HOME:-"$HOME/.local/share"}
record_path=${THALWEG_INSTALL_RECORD_PATH:-"$data_root/thalweg/install.json"}
config_root=${XDG_CONFIG_HOME:-"$HOME/.config"}
config_path=${THALWEG_CONFIG_PATH:-"$config_root/thalweg/config.json"}

if ! command -v go >/dev/null 2>&1; then
  echo "Thalweg requires Go to install from source." >&2
  exit 1
fi

mkdir -p "$install_dir"
install_dir=$(CDPATH= cd -- "$install_dir" && pwd)

existing_install=false
existing_version=
if [ -e "$install_dir/thalweg" ]; then
  existing_install=true
  if [ -x "$install_dir/thalweg" ]; then
    existing_version=$("$install_dir/thalweg" version 2>/dev/null || true)
  fi
fi

initialized=false
if [ -f "$config_path" ]; then
  initialized=true
fi

temporary_binary=$(mktemp "$install_dir/.thalweg.XXXXXX")
temporary_record=
trap 'rm -f "${temporary_binary:-}" "${temporary_record:-}"' EXIT HUP INT TERM

(
  cd "$repo_dir"
  go build -trimpath -o "$temporary_binary" .
)
chmod 0755 "$temporary_binary"
mv "$temporary_binary" "$install_dir/thalweg"

commit=unknown
dirty=false
if command -v git >/dev/null 2>&1 && git -C "$source_dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  commit=$(git -C "$source_dir" rev-parse HEAD)
  if [ -n "$(git -C "$source_dir" status --porcelain)" ]; then
    dirty=true
  fi
fi
installed_version=$("$install_dir/thalweg" version)
installed_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

shell_quote() {
  printf "'"
  printf '%s' "$1" | sed "s/'/'\\\\''/g"
  printf "'"
}

record_dir=$(dirname -- "$record_path")
mkdir -p "$record_dir"
chmod 0700 "$record_dir"
temporary_record=$(mktemp "$record_dir/.install.XXXXXX")
cat >"$temporary_record" <<EOF
{
  "version": 1,
  "channel": "source",
  "sourcePath": "$(json_escape "$source_dir")",
  "binaryPath": "$(json_escape "$install_dir/thalweg")",
  "commit": "$(json_escape "$commit")",
  "dirty": $dirty,
  "installedVersion": "$(json_escape "$installed_version")",
  "installedAt": "$(json_escape "$installed_at")"
}
EOF
chmod 0600 "$temporary_record"
mv "$temporary_record" "$record_path"
trap - EXIT HUP INT TERM

case "$existing_install:$existing_version" in
  "false:")
    printf '\nInstalled Thalweg.\n'
    printf '  Version: %s\n' "$installed_version"
    ;;
  "true:$installed_version")
    printf '\nReinstalled Thalweg.\n'
    printf '  Version: %s\n' "$installed_version"
    ;;
  "true:")
    printf '\nReplaced an existing Thalweg installation.\n'
    printf '  Installed version: %s\n' "$installed_version"
    ;;
  *)
    printf '\nUpdated Thalweg.\n'
    printf '  Previous version: %s\n' "$existing_version"
    printf '  Installed version: %s\n' "$installed_version"
    ;;
esac
printf '  Binary: %s/thalweg\n' "$install_dir"
printf '  Upgrade record: %s\n' "$record_path"

case ":${PATH:-}:" in
  *":$install_dir:"*) ;;
  *)
    printf '\nThe install directory is not currently in PATH.\n'
    printf 'To use Thalweg in this shell, run:\n\n'
    printf '  export PATH='
    shell_quote "$install_dir"
    printf ':$PATH\n'
    printf '\nTo keep it available in new terminals, add that export line to your\n'
    printf 'shell profile (for example, ~/.zshrc or ~/.bashrc).\n'
    ;;
esac

if [ "$initialized" = true ]; then
  printf '\nKept the existing device configuration:\n'
  printf '  %s\n' "$config_path"
  printf '\nStart or restart the daemon to use this build:\n\n'
  printf '  thalweg daemon restart\n'
else
  case "$existing_install" in
    true) printf '\nNo device configuration was found at %s.\n' "$config_path" ;;
  esac
  printf '\nNext, initialize this device:\n\n'
  printf '  thalweg init\n'
fi
