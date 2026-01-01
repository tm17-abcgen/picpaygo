#!/bin/bash
# Script to configure pgAdmin with PostgreSQL server connection
# Run this after pgAdmin container has started
# Usage: ./setup-pgadmin-servers.sh

set -e

CONTAINER_NAME="${1:-pictopay-pgadmin-1}"
PGADMIN_EMAIL="${PGADMIN_EMAIL:-admin@picpaygo.com}"
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-picpaygo}"
POSTGRES_USER="${POSTGRES_USER:-picpaygo}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-picpaygo_dev}"

echo "Configuring pgAdmin server connection..."
echo "Container: $CONTAINER_NAME"
echo "Email: $PGADMIN_EMAIL"
echo "PostgreSQL: $POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"

# Get the user directory (email MD5 hash)
USER_DIR=$(docker exec "$CONTAINER_NAME" sh -c "echo -n '$PGADMIN_EMAIL' | md5sum | cut -d' ' -f1")
STORAGE_DIR="/var/lib/pgadmin/storage/${USER_DIR}"
SERVERS_FILE="${STORAGE_DIR}/servers.json"

# Wait a bit for pgAdmin to initialize
echo "Waiting for pgAdmin to be ready..."
sleep 5

# Check if file already exists
if docker exec "$CONTAINER_NAME" test -f "$SERVERS_FILE"; then
    echo "servers.json already exists. Checking if server is configured..."
    if docker exec "$CONTAINER_NAME" grep -q "\"Name\": \"PostgreSQL" "$SERVERS_FILE" 2>/dev/null; then
        echo "PostgreSQL server already configured!"
        exit 0
    fi
fi

# Create directory if needed
docker exec "$CONTAINER_NAME" mkdir -p "$STORAGE_DIR"

# Create servers.json
echo "Creating server configuration..."
docker exec "$CONTAINER_NAME" sh -c "cat > $SERVERS_FILE <<'EOF'
{
    \"1\": {
        \"Name\": \"PostgreSQL - ${POSTGRES_DB}\",
        \"Group\": \"Servers\",
        \"Host\": \"${POSTGRES_HOST}\",
        \"Port\": ${POSTGRES_PORT},
        \"MaintenanceDB\": \"${POSTGRES_DB}\",
        \"Username\": \"${POSTGRES_USER}\",
        \"Password\": \"${POSTGRES_PASSWORD}\",
        \"SSLMode\": \"prefer\",
        \"Comment\": \"Auto-configured PostgreSQL server\",
        \"PassFile\": \"\",
        \"Shared\": false,
        \"BGColor\": \"\",
        \"FGColor\": \"\",
        \"Service\": \"\",
        \"UseSSHTunnel\": 0,
        \"TunnelPort\": \"22\",
        \"TunnelAuthentication\": 0
    }
}
EOF
"

# Set proper permissions
docker exec "$CONTAINER_NAME" chown -R pgadmin:pgadmin "$STORAGE_DIR"
docker exec "$CONTAINER_NAME" chmod 600 "$SERVERS_FILE"

echo "✅ pgAdmin server configuration created successfully!"
echo ""
echo "Server details:"
echo "  Name: PostgreSQL - ${POSTGRES_DB}"
echo "  Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
echo "  Database: ${POSTGRES_DB}"
echo "  Username: ${POSTGRES_USER}"
echo ""
echo "You can now access pgAdmin at /admin/pstr-dash and the server should be pre-configured!"

