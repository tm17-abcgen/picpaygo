# Fixes for MinIO Console and pgAdmin Configuration

## Issue 1: MinIO Console White Screen

The MinIO console shows a white screen because the sub_filter patterns aren't catching all dynamically generated URLs. 

### Solution: Add these lines to nginx.conf

In the `/admin/mno-dash` location block, after the existing sub_filter lines (around line 117), add:

```nginx
        # Additional patterns for MinIO console dynamic URLs
        sub_filter '"/' '"/admin/mno-dash/';
        sub_filter "'/" "'/admin/mno-dash/";
        sub_filter "url('/" "url('/admin/mno-dash/";
        sub_filter 'url(/' 'url(/admin/mno-dash/';
        sub_filter '/api/' '/admin/mno-dash/api/';
        sub_filter '/login' '/admin/mno-dash/login';
        sub_filter '/logout' '/admin/mno-dash/logout';
        sub_filter '/static/' '/admin/mno-dash/static/';
        sub_filter '/assets/' '/admin/mno-dash/assets/';
        sub_filter_last_modified on;
```

The location block should end with:
```nginx
        sub_filter_once off;
        sub_filter_last_modified on;
    }
```

### Alternative: Configure MinIO with Base Path

If sub_filter still doesn't work, you can try configuring MinIO to use a base path by updating docker-compose.yml:

```yaml
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001" --console-subnet-path "/admin/mno-dash"
    # ... rest of config
```

However, this option may not be available in all MinIO versions.

## Issue 2: Pre-configure pgAdmin with PostgreSQL Connection

### Solution: Run the setup script

A script has been created to automatically configure pgAdmin with your PostgreSQL server connection.

**On your server, run:**

```bash
cd ~/pictopay

# Make sure the script is executable
chmod +x nginx/setup-pgadmin-servers.sh

# Run the script (it will detect your container name automatically)
./nginx/setup-pgadmin-servers.sh

# Or specify the container name explicitly
./nginx/setup-pgadmin-servers.sh pictopay-pgadmin-1
```

The script will:
1. Find your pgAdmin container
2. Create the server configuration file
3. Pre-configure the PostgreSQL connection with:
   - Host: `postgres` (Docker service name)
   - Port: From your `POSTGRES_PORT` env var (default: 5432)
   - Database: From your `POSTGRES_DB` env var (default: picpaygo)
   - Username: From your `POSTGRES_USER` env var (default: picpaygo)
   - Password: From your `POSTGRES_PASSWORD` env var

### Manual Configuration

If you prefer to configure it manually through the pgAdmin UI:
1. Access pgAdmin at `/admin/pstr-dash`
2. Right-click "Servers" → "Register" → "Server"
3. Fill in:
   - **Name**: PostgreSQL - picpaygo (or your DB name)
   - **Host**: `postgres` (Docker service name)
   - **Port**: `5432`
   - **Maintenance database**: `picpaygo` (or your DB name)
   - **Username**: `picpaygo` (or your POSTGRES_USER)
   - **Password**: Your POSTGRES_PASSWORD
   - **Save password**: ✓ (optional but recommended)

## After Making Changes

1. **For nginx changes:**
   ```bash
   sudo docker compose restart nginx
   ```

2. **For pgAdmin setup:**
   ```bash
   # Run the setup script
   ./nginx/setup-pgadmin-servers.sh
   
   # Or restart pgAdmin if needed
   sudo docker compose restart pgadmin
   ```

3. **Test the endpoints:**
   - MinIO: `https://picpaygo.com/admin/mno-dash`
   - pgAdmin: `https://picpaygo.com/admin/pstr-dash`

## Troubleshooting

### MinIO still shows white screen

1. Check browser console for JavaScript errors
2. Check nginx logs: `sudo docker compose logs nginx`
3. Try accessing MinIO directly (if you expose port 9001 temporarily)
4. The issue might be that MinIO console doesn't fully support subpaths - consider accessing it via a subdomain instead

### pgAdmin server not showing

1. Check if the script ran successfully
2. Verify the container name: `sudo docker compose ps | grep pgadmin`
3. Check pgAdmin logs: `sudo docker compose logs pgadmin`
4. The server should appear after logging into pgAdmin

