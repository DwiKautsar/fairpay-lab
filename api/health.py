import json
from http.server import BaseHTTPRequestHandler
from api.stats_engine import engine_name


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        payload = {"status": "ok", "engineSource": engine_name()}
        out = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)
