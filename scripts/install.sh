#!/bin/sh
set -eu
umask 077

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_dir=$(dirname -- "$script_dir")
install_dir=${THALWEG_INSTALL_DIR:-"$HOME/.local/bin"}
source_dir=${THALWEG_INSTALL_SOURCE_DIR:-"$repo_dir"}

data_root=${XDG_DATA_HOME:-"$HOME/.local/share"}
record_path=${THALWEG_INSTALL_RECORD_PATH:-"$data_root/thalweg/install.json"}

if ! command -v go >/dev/null 2>&1; then
  echo "Thalweg requires Go to install from source." >&2
  exit 1
fi

mkdir -p "$install_dir"
install_dir=$(CDPATH= cd -- "$install_dir" && pwd)
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

printf '\nInstalled Thalweg.\n'
printf '  Binary: %s/thalweg\n' "$install_dir"
printf '  Upgrade record: %s\n' "$record_path"

case ":${PATH:-}:" in
  *":$install_dir:"*)
    printf '\nNext, initialize this device:\n\n'
    printf '  thalweg init\n'
    ;;
  *)
    printf '\nThe install directory is not currently in PATH.\n'
    printf 'To use Thalweg in this shell, run:\n\n'
    printf '  export PATH='
    shell_quote "$install_dir"
    printf ':$PATH\n'
    printf '\nTo keep it available in new terminals, add that export line to your\n'
    printf 'shell profile (for example, ~/.zshrc or ~/.bashrc).\n'
    printf '\nThen initialize this device:\n\n'
    printf '  thalweg init\n'
    ;;
esac
