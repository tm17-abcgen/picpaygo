#!/bin/bash
# Script to generate htpasswd file for pgAdmin authentication
# Usage: ./generate-htpasswd.sh [username] [password]

USERNAME=${1:-admin}
PASSWORD=${2}

if [ -z "$PASSWORD" ]; then
    echo "Usage: $0 <username> <password>"
    echo "Example: $0 admin mySecurePassword123"
    exit 1
fi

# Check if htpasswd is available
if command -v htpasswd &> /dev/null; then
    # Create or update htpasswd file
    htpasswd -bc nginx/.htpasswd "$USERNAME" "$PASSWORD"
    echo "Password file created at nginx/.htpasswd"
    echo "Username: $USERNAME"
    echo "Password: [hidden]"
elif command -v docker &> /dev/null; then
    # Use docker to run htpasswd if not available locally
    echo "htpasswd not found locally, using Docker..."
    docker run --rm -v "$(pwd)/nginx:/output" httpd:alpine htpasswd -bc /output/.htpasswd "$USERNAME" "$PASSWORD"
    echo "Password file created at nginx/.htpasswd"
    echo "Username: $USERNAME"
    echo "Password: [hidden]"
else
    echo "Error: htpasswd not found and Docker is not available."
    echo "Please install htpasswd (apache2-utils on Ubuntu/Debian) or Docker."
    exit 1
fi

