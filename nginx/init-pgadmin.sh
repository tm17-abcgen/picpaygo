#!/bin/bash
# Script to pre-configure pgAdmin with PostgreSQL server connection
# This script runs inside the pgAdmin container

set -e

PGADMIN_EMAIL="${PGADMIN_EMAIL:-admin@picpaygo.com}"
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-picpaygo}"
POSTGRES_USER="${POSTGRES_USER:-picpaygo}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-picpaygo_dev}"

# Wait for pgAdmin to be ready
echo "Waiting for pgAdmin to initialize..."
sleep 10

# Get the user directory (email encoded)
USER_DIR=$(echo -n "$PGADMIN_EMAIL" | md5sum | cut -d' ' -f1)
STORAGE_DIR="/var/lib/pgadmin/storage/${USER_DIR}"
SERVERS_FILE="${STORAGE_DIR}/servers.json"

# Create directory if it doesn't exist
mkdir -p "$STORAGE_DIR"

# Check if servers.json already exists and has content
if [ -f "$SERVERS_FILE" ] && [ -s "$SERVERS_FILE" ]; then
    echo "pgAdmin servers.json already exists, skipping configuration"
    exit 0
fi

# Create servers.json with PostgreSQL connection
echo "Creating pgAdmin server configuration..."
cat > "$SERVERS_FILE" <<EOF
{
    "1": {
        "Name": "PostgreSQL - ${POSTGRES_DB}",
        "Group": "Servers",
        "Host": "${POSTGRES_HOST}",
        "Port": ${POSTGRES_PORT},
        "MaintenanceDB": "${POSTGRES_DB}",
        "Username": "${POSTGRES_USER}",
        "Password": "${POSTGRES_PASSWORD}",
        "SSLMode": "prefer",
        "Comment": "Auto-configured PostgreSQL server",
        "PassFile": "",
        "Shared": false,
        "BGColor": "",
        "FGColor": "",
        "Service": "",
        "UseSSHTunnel": 0,
        "TunnelPort": "22",
        "TunnelAuthentication": 0
    }
}

EOF

# Set proper permissions
chown -R pgadmin:pgadmin "$STORAGE_DIR"
chmod 600 "$SERVERS_FILE"

echo "pgAdmin server configuration created successfully!"
echo "Server: ${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
echo "Username: ${POSTGRES_USER}"

