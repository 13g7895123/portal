#!/bin/bash

# Define container name
CONTAINER_NAME="entry-backend"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: Container ${CONTAINER_NAME} is not running."
    echo "Please run 'docker-compose up -d' first."
    exit 1
fi

echo "Running migration script inside ${CONTAINER_NAME}..."

# Execute the python script inside the container using pipe
# This avoids needing to copy the file into the container
cat migrate_json_to_db.py | docker exec -i ${CONTAINER_NAME} python3 -

if [ $? -eq 0 ]; then
    echo "Migration executed successfully."
else
    echo "Migration failed."
    exit 1
fi
