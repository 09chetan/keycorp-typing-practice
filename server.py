import http.server
import socketserver
import json
import csv
import os
import datetime
import urllib.parse
import urllib.request

PORT = int(os.environ.get("PORT", 8080))
CSV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Typing_Practice_Daily_Log.csv")

# Initialize CSV with headers if it does not exist
def init_csv():
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                "Date", "Time", "Category", "Mode", "Duration (sec)", 
                "Net WPM", "Raw WPM", "Accuracy (%)", "Words Typed", 
                "Errors", "Misspelled Words"
            ])

init_csv()

class TypingAppHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and disable browser caching
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/get-log":
            if os.path.exists(CSV_FILE):
                with open(CSV_FILE, 'r', encoding='utf-8') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/csv; charset=utf-8')
                self.send_header('Content-Disposition', 'attachment; filename="Typing_Practice_Daily_Log.csv"')
                self.end_headers()
                self.wfile.write(content.encode('utf-8'))
                return
            else:
                self.send_response(404)
                self.end_headers()
                return

        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/save-session":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                date_str = data.get('date', datetime.date.today().strftime('%Y-%m-%d'))
                time_str = data.get('time', datetime.datetime.now().strftime('%H:%M:%S'))
                category = data.get('category', 'Corporate')
                mode = data.get('mode', 'Time')
                duration = data.get('durationSeconds', data.get('duration', 60))
                net_wpm = data.get('wpm', data.get('netWpm', 0))
                raw_wpm = data.get('rawWpm', net_wpm)
                accuracy = data.get('accuracy', 100)
                words_typed = data.get('wordsTyped', 0)
                errors = data.get('errorChars', data.get('errors', 0))
                
                misspelled = data.get('misspelledWords', [])
                if isinstance(misspelled, list):
                    misspelled_str = ", ".join(misspelled) if misspelled else "None"
                else:
                    misspelled_str = str(misspelled)

                session_text = data.get('sessionText', '')
                words_typed_list = data.get('wordsTypedList', session_text)

                # Write to CSV Excel spreadsheet
                with open(CSV_FILE, mode='a', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow([
                        date_str, time_str, category, mode, duration,
                        net_wpm, raw_wpm, accuracy, words_typed,
                        errors, misspelled_str, words_typed_list
                    ])

                print(f"[LOGGED TO EXCEL/CSV] {date_str} {time_str} - {category} - {net_wpm} WPM - {accuracy}% Acc")

                response = {"status": "success", "file": CSV_FILE, "message": "Saved to Excel sheet successfully!"}
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return

            except Exception as e:
                print(f"Error saving session: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "error": str(e)}).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), TypingAppHandler) as httpd:
        print(f"🚀 KeyCorp Server running on http://localhost:{PORT}")
        print(f"📊 Auto-logging sessions to Excel file: {CSV_FILE}")
        httpd.serve_forever()
