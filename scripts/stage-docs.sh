#!/usr/bin/env bash
set -euo pipefail

# Builds each tool's documentation from its own repository and assembles the
# rendered HTML under the unified site at site/azure-functions-python/<tool>/.
#
# Each tool ships its own mkdocs.yml with plugins (mkdocstrings, snippets) that
# require the tool's package to be importable, so every tool is installed and
# built from its own checkout. A single shared virtualenv is reused across tools
# because they share compatible doc toolchains (mkdocs<2, material<10,
# mkdocstrings<2); only each tool's own package is (re)installed per iteration.
# The ephemeral clone's site_url is rewritten to the unified path so canonical
# links and sitemaps are correct; source repos are never mutated.

BASE_URL="${BASE_URL:-https://yeongseon.dev}"
SUBROOT="azure-functions-python"
SITE_ROOT="${SITE_ROOT:-site}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# name|repo|branch  — repo is the canonical GitHub slug under yeongseon/.
TOOLS=(
  "openapi|azure-functions-openapi-python|main"
  "validation|azure-functions-validation-python|main"
  "scaffold|azure-functions-scaffold-python|main"
  "logging|azure-functions-logging-python|main"
  "doctor|azure-functions-doctor-python|main"
  "langgraph|azure-functions-langgraph-python|main"
  "durable-graph|azure-functions-durable-graph-python|main"
  "knowledge|azure-functions-knowledge-python|main"
  "db|azure-functions-db-python|main"
  "cookbook|azure-functions-cookbook-python|main"
  "practical-guide|azure-functions-practical-guide|main"
)

if [[ ! -d "$SITE_ROOT" ]]; then
  echo "stage-docs: '$SITE_ROOT' not found -- run 'mkdocs build' first." >&2
  exit 1
fi

VENV="$WORK/.shared-venv"
python3 -m venv "$VENV"
PIP="$VENV/bin/pip"
MKDOCS="$VENV/bin/mkdocs"
"$PIP" install --quiet --upgrade pip
"$PIP" install --quiet "mkdocs<2" "mkdocs-material<10" "mkdocstrings[python]<2" pymdown-extensions

for entry in "${TOOLS[@]}"; do
  IFS='|' read -r name repo branch <<<"$entry"
  echo "stage-docs: building '$name' from $repo@$branch"

  src="$WORK/$name"
  dest="$SITE_ROOT/$SUBROOT/$name"
  git clone --depth 1 --branch "$branch" "https://github.com/yeongseon/${repo}.git" "$src"

  # Install each tool's own doc toolchain: packaged tools expose a 'docs'
  # extra, while guide-style repos ship no package and pin doc deps in
  # requirements-docs.txt (macros modules, redirects, etc.).
  if [[ -f "$src/pyproject.toml" ]]; then
    "$PIP" install --quiet -e "${src}[docs]"
  elif [[ -f "$src/requirements-docs.txt" ]]; then
    "$PIP" install --quiet -r "$src/requirements-docs.txt"
  fi

  python3 - "$src/mkdocs.yml" "${BASE_URL}/${SUBROOT}/${name}/" <<'PY'
import re, sys
path, url = sys.argv[1], sys.argv[2]
text = open(path, encoding="utf-8").read()
if re.search(r"(?m)^site_url:", text):
    text = re.sub(r"(?m)^site_url:.*$", f"site_url: {url}", text)
else:
    text = f"site_url: {url}\n" + text
open(path, "w", encoding="utf-8").write(text)
PY

  mkdir -p "$dest"
  (cd "$src" && "$MKDOCS" build --site-dir "$OLDPWD/$dest")
  echo "stage-docs: '$name' -> $dest"
done

# Emit a sitemap index tying the central sitemap and every tool sitemap together
# so search engines discover all sub-site URLs from one entry point.
{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  echo "  <sitemap><loc>${BASE_URL}/sitemap.xml</loc></sitemap>"
  for entry in "${TOOLS[@]}"; do
    IFS='|' read -r name _ _ <<<"$entry"
    echo "  <sitemap><loc>${BASE_URL}/${SUBROOT}/${name}/sitemap.xml</loc></sitemap>"
  done
  echo '</sitemapindex>'
} >"$SITE_ROOT/sitemap-index.xml"
echo "stage-docs: wrote $SITE_ROOT/sitemap-index.xml"

echo "stage-docs: done"
