# RezKhan — static personal site for dr.rezkhan.net (GitHub Pages, main branch)

port := "8000"
live := "https://dr.rezkhan.net/"
chrome := "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
shots := "/tmp/rezkhan-shots"

# List available recipes.
default:
	@just --list --unsorted

# Serve the site locally (foreground).
serve port=port:
	@if lsof -iTCP:{{port}} -sTCP:LISTEN -P >/dev/null 2>&1; then \
		echo "Something is already listening on :{{port}} — use 'just open' or pick another port."; \
	else \
		echo "Serving on http://127.0.0.1:{{port}}"; \
		python3 -m http.server {{port}} --bind 127.0.0.1; \
	fi

alias run := preview

# Preview locally: serve in the background and open in the browser ('just stop' to end).
preview port=port:
	@if lsof -iTCP:{{port}} -sTCP:LISTEN -P >/dev/null 2>&1; then \
		echo "Server already running on :{{port}}"; \
	else \
		python3 -m http.server {{port}} --bind 127.0.0.1 >/dev/null 2>&1 & echo $! > /tmp/rez-khan-http-server-{{port}}.pid; \
		echo "Serving on http://127.0.0.1:{{port}}"; \
	fi
	@sleep 0.3
	@open http://127.0.0.1:{{port}}

# Open the local preview in the default browser.
open port=port:
	@open http://127.0.0.1:{{port}}

# Stop a background server started by 'just run'.
stop port=port:
	@pidfile=/tmp/rez-khan-http-server-{{port}}.pid; \
	if [ -f "$pidfile" ]; then \
		pid=$(cat "$pidfile"); \
		kill "$pid" 2>/dev/null && echo "Stopped PID $pid on :{{port}}" || echo "PID $pid not running."; \
		rm -f "$pidfile"; \
	else \
		echo "No recorded PID for :{{port}}."; \
	fi

# Desktop + mobile screenshots of the local site (into /tmp/rezkhan-shots).
shots:
	#!/usr/bin/env bash
	set -euo pipefail
	mkdir -p {{shots}}
	p=8799
	python3 -m http.server $p --bind 127.0.0.1 >/dev/null 2>&1 & srv=$!
	trap 'kill $srv 2>/dev/null' EXIT
	sleep 0.5
	for size in 1440,900 390,900; do
		prof=$(mktemp -d)
		"{{chrome}}" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$prof" \
			--window-size=$size --screenshot={{shots}}/home-${size/,/x}.png http://127.0.0.1:$p/ 2>/dev/null
		rm -rf "$prof"
	done
	echo "Screenshots in {{shots}}"; open {{shots}}

# Sanity checks: local files referenced by index.html exist, no stale booking links.
check:
	#!/usr/bin/env bash
	set -uo pipefail
	fail=0
	for f in $(grep -oE '(src|href)="\./[^"#?]+' index.html | sed -E 's/^(src|href)="\.\///' | sort -u); do
		path=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.unquote(sys.argv[1]))' "$f")
		[ -e "$path" ] || { echo "✗ missing: $path"; fail=1; }
	done
	if grep -q 'cal\.com/serenus-one' index.html; then echo "✗ stale cal.com/serenus-one link"; fail=1; fi
	[ $fail -eq 0 ] && echo "✓ checks passed"
	exit $fail

# Bump the ?v= cache-buster on common.css/common.js to the current date+time.
bust:
	@v=$(date +%Y%m%d%H%M); sed -i '' -E "s/(common\.(css|js))\?v=[0-9]+/\1?v=$v/g" index.html; echo "Cache-buster set to v=$v"

# Check, auto-bust cache if CSS/JS changed, commit tracked changes, and push to main.
release msg="Update site":
	#!/usr/bin/env bash
	set -euo pipefail
	just check
	if ! git diff --quiet HEAD -- common.css common.js; then just bust; fi
	git add -u
	if git diff --cached --quiet; then echo "Nothing to release."; exit 0; fi
	untracked=$(git ls-files --others --exclude-standard)
	[ -n "$untracked" ] && printf 'Note: untracked files not included:\n%s\n' "$untracked"
	git commit -m "{{msg}}"
	git push origin main
	echo "Pushed. GitHub Pages will update {{live}} shortly."

# Open the live site.
live:
	@open {{live}}

# Show what's changed and recent commits.
status:
	@git status --short; echo; git log -5 --format='%h %ad %s' --date=short

# Show the file tree (excluding .git).
tree:
	@find . -not -path './.git/*' -not -path './.git' | sort

# Remove leftover server PID files.
clean:
	@rm -f /tmp/rez-khan-http-server-*.pid
