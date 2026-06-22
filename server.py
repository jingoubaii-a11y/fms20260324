#!/usr/bin/env python3
"""本地开发服务器，带缓存控制头"""
import http.server
import functools

PORT = 8080

class CacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 对common目录设置缓存
        if '/common/' in self.path:
            self.send_header('Cache-Control', 'public, max-age=3600')
        # HTML文件不缓存，确保总是最新
        elif self.path.endswith('.html') or self.path == '/':
            self.send_header('Cache-Control', 'no-cache')
        else:
            self.send_header('Cache-Control', 'public, max-age=3600')
        super().end_headers()

handler = functools.partial(CacheHandler, directory='.')
with http.server.HTTPServer(('', PORT), handler) as httpd:
    print(f'Serving on http://localhost:{PORT} with cache headers...')
    httpd.serve_forever()