#!/usr/bin/env python3
"""
Dynamic Media Sorter - Remote Backend Server

This backend handles JIT hashing, directory scanning, and media streaming
(with partial-range bytes support for video seeking) for remote clients.

To run this backend on a Raspberry Pi (e.g., Pi 5) and connect your phone:

1. ENABLE PHONE HOTSPOT:
   Turn on your phone's Portable/Mobile Hotspot and note the SSID/Password.

2. CONNECT PI TO HOTSPOT:
   Connect your Raspberry Pi 5 to the phone's hotspot Wi-Fi.
   Command-line connection:
     sudo nmcli dev wifi connect "YOUR_HOTSPOT_SSID" password "YOUR_HOTSPOT_PASSWORD"

3. GET PI LOCAL IP:
   Run `hostname -I` in the Raspberry Pi terminal to get its Wi-Fi network IP.
   (Typically looks like 192.168.43.x on Android, or 172.20.10.x on iOS).

4. LAUNCH THE SERVER:
   Execute [server.py](file:///storage/emulated/0/Documents/Antigravity/Dynamic%20Media%20Sorter/server.py) from your terminal:
     python3 server.py /path/to/external/hdd/media
   By default, it serves from './media' and binds to all network interfaces on port 8000.

5. CONNECT IN FRONTEND:
   Open the frontend [index.html](file:///storage/emulated/0/Documents/Antigravity/Dynamic%20Media%20Sorter/index.html) in your phone's browser, and enter:
     http://<PI_IP>:8000
   into the 'Connect Remote Pi' input.
"""

import os
import sys
import json
import socket
import urllib.parse
import hashlib
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# Default media directory. Can also be overridden by passing a path as the first argument:
# python3 server.py /path/to/my/media
MEDIA_DIR = os.path.abspath("./media")

# Add video MIME types just in case they aren't registered in the OS
mimetypes.add_type('video/mp4', '.mp4')
mimetypes.add_type('video/webm', '.webm')
mimetypes.add_type('video/quicktime', '.mov')
mimetypes.add_type('video/mp4', '.m4v')

class RemoteMediaHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and Private Network Access for local HTML file origins
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD")
        self.send_header("Access-Control-Allow-Headers", "Range, Content-Type, Access-Control-Allow-Private-Network")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = urllib.parse.unquote(parsed_url.path)

        if path in ("/", "/index.html"):
            self.handle_serve_frontend()
        elif path == "/api/files":
            self.handle_list_files()
        elif path.startswith("/api/hash/"):
            rel_path = path[len("/api/hash/"):]
            self.handle_get_hash(rel_path)
        elif path.startswith("/api/media/"):
            rel_path = path[len("/api/media/"):]
            self.handle_serve_media(rel_path)
        else:
            self.send_error(404, "Not Found")

    def handle_serve_frontend(self):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        frontend_path = os.path.join(script_dir, "index.html")
        if not os.path.exists(frontend_path):
            self.send_error(404, "index.html not found. Please copy index.html alongside server.py.")
            return

        file_size = os.path.getsize(frontend_path)
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.send_header("Content-Length", str(file_size))
        self.end_headers()
        try:
            with open(frontend_path, "rb") as f:
                self.copy_file_range(f, self.wfile, 0, file_size)
        except Exception as e:
            print(f"Error serving frontend: {e}")

    def handle_list_files(self):
        if not os.path.exists(MEDIA_DIR):
            self.send_error(404, f"Media directory '{MEDIA_DIR}' does not exist.")
            return

        files = []
        valid_extensions = ('.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm', '.mov', '.m4v')
        for root, _, filenames in os.walk(MEDIA_DIR):
            for f in filenames:
                if f.lower().endswith(valid_extensions):
                    full_path = os.path.join(root, f)
                    rel_path = os.path.relpath(full_path, MEDIA_DIR)
                    files.append(rel_path)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(files).encode('utf-8'))

    def handle_get_hash(self, rel_path):
        full_path = os.path.join(MEDIA_DIR, rel_path)
        # Prevent Directory Traversal
        abs_media_dir = os.path.abspath(MEDIA_DIR)
        abs_full_path = os.path.abspath(full_path)
        try:
            if os.path.commonpath([abs_media_dir, abs_full_path]) != abs_media_dir:
                self.send_error(403, "Access Denied")
                return
        except ValueError:
            self.send_error(403, "Access Denied")
            return

        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            self.send_error(404, "File Not Found")
            return

        file_hash = self.calculate_jit_hash(full_path)
        if not file_hash:
            self.send_error(500, "Hashing failed")
            return

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"hash": file_hash}).encode('utf-8'))

    def handle_serve_media(self, rel_path):
        full_path = os.path.join(MEDIA_DIR, rel_path)
        # Prevent Directory Traversal
        abs_media_dir = os.path.abspath(MEDIA_DIR)
        abs_full_path = os.path.abspath(full_path)
        try:
            if os.path.commonpath([abs_media_dir, abs_full_path]) != abs_media_dir:
                self.send_error(403, "Access Denied")
                return
        except ValueError:
            self.send_error(403, "Access Denied")
            return

        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            self.send_error(404, "File Not Found")
            return

        file_size = os.path.getsize(full_path)
        mime_type, _ = mimetypes.guess_type(full_path)
        if not mime_type:
            mime_type = "application/octet-stream"

        range_header = self.headers.get("Range")
        if range_header and range_header.startswith("bytes="):
            self.handle_range_request(full_path, range_header, file_size, mime_type)
        else:
            self.handle_full_request(full_path, file_size, mime_type)

    def handle_full_request(self, full_path, file_size, mime_type):
        self.send_response(200)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Length", str(file_size))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        try:
            with open(full_path, "rb") as f:
                self.copy_file_range(f, self.wfile, 0, file_size)
        except Exception as e:
            print(f"Error serving full file: {e}")

    def handle_range_request(self, full_path, range_header, file_size, mime_type):
        # Format: bytes=start-end
        try:
            range_str = range_header.split("=")[1]
            parts = range_str.split("-")
            
            start = 0
            if parts[0]:
                start = int(parts[0])
                
            end = file_size - 1
            if len(parts) > 1 and parts[1]:
                end = int(parts[1])
        except (IndexError, ValueError):
            self.handle_full_request(full_path, file_size, mime_type)
            return

        if start >= file_size or end >= file_size or start > end:
            self.send_response(416) # Range Not Satisfiable
            self.send_header("Content-Range", f"bytes */{file_size}")
            self.end_headers()
            return

        chunk_length = end - start + 1

        self.send_response(206) # Partial Content
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
        self.send_header("Content-Length", str(chunk_length))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()

        try:
            with open(full_path, "rb") as f:
                self.copy_file_range(f, self.wfile, start, chunk_length)
        except Exception as e:
            print(f"Error serving range bytes {start}-{end}: {e}")

    def copy_file_range(self, source, destination, start_offset, length):
        source.seek(start_offset)
        remaining = length
        buffer_size = 64 * 1024  # 64KB chunks
        while remaining > 0:
            chunk = source.read(min(buffer_size, remaining))
            if not chunk:
                break
            destination.write(chunk)
            remaining -= len(chunk)

    def calculate_jit_hash(self, filepath):
        try:
            size = os.path.getsize(filepath)
            if size == 0:
                return "0-empty"
            with open(filepath, 'rb') as f:
                start = f.read(1024)
                f.seek(max(0, size // 2))
                middle = f.read(1024)
            h1 = hashlib.sha1(start).hexdigest()
            h2 = hashlib.sha1(middle).hexdigest()
            return f"{size}-{h1}{h2}"
        except Exception as e:
            print(f"Error hashing {filepath}: {e}")
            return None

def get_local_ips():
    ips = ["127.0.0.1"]
    try:
        # Resolve routing to external internet to find active network interface IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        if local_ip not in ips:
            ips.append(local_ip)
        s.close()
    except Exception:
        pass
        
    try:
        # Fallback using getaddrinfo
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None):
            ip = info[4][0]
            if ":" not in ip and ip not in ips: # IPv4 only
                ips.append(ip)
    except Exception:
        pass
    return ips

def main():
    global MEDIA_DIR
    if len(sys.argv) > 1:
        MEDIA_DIR = os.path.abspath(sys.argv[1])

    print("=========================================")
    print("      Dynamic Media Sorter Server        ")
    print("=========================================")
    print(f"Target Directory : {MEDIA_DIR}")
    
    if not os.path.exists(MEDIA_DIR):
        print(f"Creating directory: {MEDIA_DIR}")
        os.makedirs(MEDIA_DIR, exist_ok=True)
        
    port = 8000
    server_address = ('', port)
    
    # Use ThreadingHTTPServer to handle concurrent video/image streaming requests smoothly on the Pi 5
    httpd = ThreadingHTTPServer(server_address, RemoteMediaHandler)
    
    print("Server running at:")
    for ip in get_local_ips():
        if ip == "127.0.0.1":
            print(f"  - Local: http://localhost:{port}")
        else:
            print(f"  - Network: http://{ip}:{port} (Type this into your phone browser)")
            
    print(f"Press Ctrl+C to stop.")
    print("=========================================")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()
        print("Server stopped.")

if __name__ == '__main__':
    main()
