# MinIO Console White Screen Fix

## Problem
MinIO console shows a white screen when accessed at `/admin/mno-dash` because:
1. MinIO needs the `MINIO_BROWSER_REDIRECT_URL` environment variable
2. Nginx configuration needs to use trailing slashes and proper headers

## Solution

### 1. Update docker-compose.yml
The `MINIO_BROWSER_REDIRECT_URL` has been added. Make sure to set it in your `.env` file:

```bash
MINIO_BROWSER_REDIRECT_URL=http://your-domain.com/admin/mno-dash/
```

Or it will default to `http://localhost:8080/admin/mno-dash/`

### 2. Update nginx.conf
Replace the `/admin/mno-dash` location block with:

```nginx
# Route /admin/mno-dash to MinIO console
# Handle trailing slash redirect first
location = /admin/mno-dash {
    return 301 /admin/mno-dash/;
}

# Main MinIO console location with trailing slash
location /admin/mno-dash/ {
    rewrite ^/admin/mno-dash/(.*) /$1 break;
    proxy_pass http://minio:9001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Script-Name /admin/mno-dash;
    
    # WebSocket support for MinIO console
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # Connection settings
    proxy_connect_timeout 10s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Enable buffering for sub_filter (required!)
    proxy_buffering on;
    proxy_buffer_size 8k;
    proxy_buffers 16 8k;
    proxy_busy_buffers_size 16k;
    
    # Comprehensive content rewriting for MinIO console
    sub_filter_types text/html text/css text/javascript application/javascript application/json;
    sub_filter 'href="/' 'href="/admin/mno-dash/';
    sub_filter 'src="/' 'src="/admin/mno-dash/';
    sub_filter 'action="/' 'action="/admin/mno-dash/';
    sub_filter 'url("/' 'url("/admin/mno-dash/';
    sub_filter '"/' '"/admin/mno-dash/';
    sub_filter_once off;
    sub_filter_last_modified on;
}
```

### 3. Restart Services

```bash
# Restart MinIO to pick up the new environment variable
sudo docker compose restart minio

# Restart nginx to apply the new configuration
sudo docker compose restart nginx
```

### 4. Test

Visit: `http://your-domain/admin/mno-dash` (it will redirect to `/admin/mno-dash/`)

## Key Changes

1. **MINIO_BROWSER_REDIRECT_URL**: Tells MinIO where it's being accessed from
2. **Trailing slash**: MinIO console works better with trailing slashes
3. **X-Script-Name header**: Helps MinIO understand the subpath
4. **proxy_pass with trailing slash**: Ensures proper path rewriting

