# RezKhan — static link portal for dr.rezkhan.net
set working-directory := "/Users/khan/Projects/DrRezKhan"

# Prepare build-only demo artifacts without embedding secrets.
build-demo command="./scripts/build-demo.sh":
	@bash {{command}}

# Serve the site with a local static server.
serve port='8000':
	@if lsof -iTCP:{{port}} -sTCP:LISTEN -P >/dev/null 2>&1; then \
		echo "Server already running on :{{port}} — use `just open` or `just run`."; \
	else \
		echo "Serving on http://127.0.0.1:{{port}}"; \
		python3 -m http.server {{port}} --bind 127.0.0.1; \
	fi

# Open the preview in your default browser (macOS).
open:
	@open http://127.0.0.1:8000

# Serve and open in one go.
run port='8000':
	@if lsof -iTCP:{{port}} -sTCP:LISTEN -P >/dev/null 2>&1; then \
		echo "Server already running on :{{port}}"; \
	else \
		echo "Serving on http://127.0.0.1:{{port}}"; \
		python3 -m http.server {{port}} --bind 127.0.0.1 >/dev/null 2>&1 & echo $$! > /tmp/rez-khan-http-server-{{port}}.pid; \
	fi
	@sleep 0.3
	@open http://127.0.0.1:{{port}}

# Stop a background server started by `just run`.
stop port='8000':
	@if [ -f /tmp/rez-khan-http-server-{{port}}.pid ]; then \
		pid=`cat /tmp/rez-khan-http-server-{{port}}.pid`; \
		if kill -0 "$$pid" >/dev/null 2>&1; then \
			kill "$$pid" && rm -f /tmp/rez-khan-http-server-{{port}}.pid && echo "Stopped PID $$pid on :{{port}}"; \
		else \
			rm -f /tmp/rez-khan-http-server-{{port}}.pid; \
			echo "PID $$pid not running; cleaned bookkeeping."; \
		fi; \
	else \
		echo "No recorded PID for :{{port}}. Kill manually if needed."; \
	fi

tree:
	@find . -not -path './.git/*' -not -path './.git' | sort

clean:
	@rm -f /tmp/rez-khan-http-server-*.pid
