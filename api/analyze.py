import json
from http.server import BaseHTTPRequestHandler
from api.stats_engine import handle_analyze


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            payload = json.loads(body)
            result = handle_analyze(payload)
            status = 200
        except Exception as exc:
            result = {"error": str(exc)}
            status = 400

        out = json.dumps(result).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)
