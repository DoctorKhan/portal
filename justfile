# RezKhan — simple static site

# Serve the site with a local static server using Python's built-in http.server.
# Pass a port like: `just serve 3000`
serve *args='8000':
    # macOS: check if something is already on that port.
    # If so, just tell the user; otherwise start the server.
    @if lsof -iTCP:{{args}} -sTCP:LISTEN -P >/dev/null 2>&1; then \
      echo "Server already running on :{{args}} — use `just open`."; \
    else \
      echo "Serving on http://127.0.0.1:{{args}}"; \
      python3 -m http.server {{args}} --bind 127.0.0.1; \
    fi

# Open the preview in your default browser (macOS).
# If the server isn't running, it'll still open the URL (browser will show an error).
open:
    @open http://127.0.0.1:8000

# Serve and open the site in the browser in one go.
# If already serving on the requested port, just opens the browser.
run *args='8000':
    # Try to start the server; if already running, just open the browser.
    # The & backgrounds the server so this recipe continues to `open`.
    @python3 -m http.server {{args}} --bind 127.0.0.1 >/dev/null 2>&1 & \
      echo $! > /tmp/rez-khan-http-server-{{args}}.pid || true; \
      echo "Serving on http://127.0.0.1:{{args}}"
    @open http://127.0.0.1:{{args}}

# Show a plain tree of the project files.
tree:
    @find . -not -path './.git/*' -not -path './.git' | sort
