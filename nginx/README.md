# Nginx Configuration for Admin Dashboards

This directory contains the nginx configuration for routing admin dashboards.

## Admin Endpoints

- **MinIO Console**: `/admin/mno-dash`
- **pgAdmin**: `/admin/pstr-dash` (password protected)

## Setting Up pgAdmin Password Protection

Before starting the services, you need to generate the password file for pgAdmin authentication.

### Option 1: Using the provided script (recommended)

```bash
cd /path/to/Picpaygo
./nginx/generate-htpasswd.sh admin your-secure-password
```

Replace `admin` with your desired username and `your-secure-password` with a strong password.

### Option 2: Using htpasswd directly

If you have `htpasswd` installed (part of `apache2-utils` on Ubuntu/Debian):

```bash
htpasswd -bc nginx/.htpasswd admin your-secure-password
```

### Option 3: Using Docker

If you don't have `htpasswd` installed:

```bash
docker run --rm -v "$(pwd)/nginx:/output" httpd:alpine htpasswd -bc /output/.htpasswd admin your-secure-password
```

## Security Notes

- The `.htpasswd` file is in `.gitignore` and should never be committed to version control
- Use a strong password for pgAdmin access
- Consider changing the password regularly
- The password file is mounted as read-only in the nginx container

## Troubleshooting

### MinIO Console shows 404 or broken assets

The MinIO console uses `sub_filter` to rewrite asset paths. If you see broken assets:
1. Ensure nginx:alpine includes the http_sub_module (it should by default)
2. Check nginx logs: `docker compose logs nginx`
3. Try accessing MinIO directly on port 9001 to verify it's working

### pgAdmin asks for password but you haven't set it up

1. Generate the password file using one of the methods above
2. Restart nginx: `docker compose restart nginx`

### pgAdmin still accessible without password

1. Verify the `.htpasswd` file exists: `ls -la nginx/.htpasswd`
2. Check that docker-compose is mounting it correctly
3. Check nginx logs for errors: `docker compose logs nginx`
4. Verify nginx configuration: `docker compose exec nginx nginx -t`

