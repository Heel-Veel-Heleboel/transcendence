#!/usr/bin/env bash
set -eu

# ELK Stack Setup Script
# Generates SSL certificates and configures initial Elasticsearch setup

echo "Starting ELK setup..."

# Validate required environment variables
if [ -z "${ELASTIC_PASSWORD:-}" ]; then
  echo "ERROR: Set the ELASTIC_PASSWORD environment variable in the .env file"
  exit 1
fi

if [ -z "${KIBANA_PASSWORD:-}" ]; then
  echo "ERROR: Set the KIBANA_PASSWORD environment variable in the .env file"
  exit 1
fi

# Generate CA certificate if it doesn't exist
if [ ! -f config/certs/ca.zip ]; then
  echo "Creating CA certificate..."
  bin/elasticsearch-certutil ca --silent --pem -out config/certs/ca.zip
  unzip config/certs/ca.zip -d config/certs
fi

# Generate service certificates if they don't exist
if [ ! -f config/certs/certs.zip ]; then
  echo "Creating service certificates..."

  # Create instances configuration file
  cat > config/certs/instances.yml <<EOF
instances:
  - name: elasticsearch
    dns:
      - elasticsearch
      - localhost
    ip:
      - 127.0.0.1
  - name: kibana
    dns:
      - kibana
      - localhost
    ip:
      - 127.0.0.1
  - name: logstash
    dns:
      - logstash
      - localhost
    ip:
      - 127.0.0.1
EOF

  # Generate certificates for all instances
  bin/elasticsearch-certutil cert --silent --pem \
    -out config/certs/certs.zip \
    --in config/certs/instances.yml \
    --ca-cert config/certs/ca/ca.crt \
    --ca-key config/certs/ca/ca.key

  unzip config/certs/certs.zip -d config/certs
fi

# Set proper permissions
echo "Setting file permissions..."
chown -R root:root config/certs
find config/certs -type d -exec chmod 750 {} \;
find config/certs -type f -exec chmod 640 {} \;

# Wait for Elasticsearch to be available
echo "Waiting for Elasticsearch availability..."
until curl -s --cacert config/certs/ca/ca.crt https://elasticsearch:9200 | grep -q "missing authentication credentials"; do
  echo "  Elasticsearch not ready yet, waiting..."
  sleep 30
done
echo "Elasticsearch is available!"

# Set kibana_system user password
echo "Configuring kibana_system user..."
until curl -s -X POST \
  --cacert config/certs/ca/ca.crt \
  -u "elastic:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  https://elasticsearch:9200/_security/user/kibana_system/_password \
  -d "{\"password\":\"${KIBANA_PASSWORD}\"}" | grep -q "^{}"; do
  echo "  Failed to set kibana_system password, retrying..."
  sleep 10
done

echo "ELK setup completed successfully!"

# Keep container running for health checks
echo "Setup complete, keeping container alive for dependencies..."
tail -f /dev/null
