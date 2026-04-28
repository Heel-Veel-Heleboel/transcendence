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

if [ -z "${ELASTIC_USER:-}" ]; then
  echo "ERROR: Set the ELASTIC_USER environment variable in the .env file"
  exit 1
fi

if [ -z "${KIBANA_PASSWORD:-}" ]; then
  echo "ERROR: Set the KIBANA_PASSWORD environment variable in the .env file"
  exit 1
fi

if [ -z "${KIBANA_USER:-}" ]; then
  echo "ERROR: Set the KIBANA_USER environment variable in the .env file"
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

# Set kibana user password
echo "Configuring ${KIBANA_USER} user..."
until curl -s -X POST \
  --cacert config/certs/ca/ca.crt \
  -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  "https://elasticsearch:9200/_security/user/${KIBANA_USER}/_password" \
  -d "{\"password\":\"${KIBANA_PASSWORD}\"}" | grep -q "^{}"; do
  echo "  Failed to set ${KIBANA_USER} password, retrying..."
  sleep 10
done


# ---------------------------------------------------------------------------
# ILM retention policy — delete indices after 7 days
# Straight deletion is appropriate for a single-node basic-license cluster.
# Archive (cold/frozen tier) would require a multi-tier cluster setup.
# Instead, use SLM snapshots below for longer-term archiving.
# ---------------------------------------------------------------------------
echo "Configuring ILM retention policy (delete after 7 days)..."
until curl -s -X PUT \
  --cacert config/certs/ca/ca.crt \
  -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  "https://elasticsearch:9200/_ilm/policy/pong-logs-policy" \
  -d '{
    "policy": {
      "phases": {
        "delete": {
          "min_age": "7d",
          "actions": { "delete": {} }
        }
      }
    }
  }' | grep -q '"acknowledged":true'; do
  echo "  Failed to configure ILM policy, retrying..."
  sleep 10
done
echo "ILM policy configured."

# Apply ILM policy to all logs-* indices via an index template.
# number_of_replicas=0 prevents yellow cluster health on a single node.
echo "Configuring index template for logs-*..."
until curl -s -X PUT \
  --cacert config/certs/ca/ca.crt \
  -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  "https://elasticsearch:9200/_index_template/pong-logs-template" \
  -d '{
    "index_patterns": ["logs-*"],
    "template": {
      "settings": {
        "index.lifecycle.name": "pong-logs-policy",
        "number_of_replicas": 0
      }
    }
  }' | grep -q '"acknowledged":true'; do
  echo "  Failed to configure index template, retrying..."
  sleep 10
done
echo "Index template configured."

# ---------------------------------------------------------------------------
# SLM snapshot policy — archive logs-* daily, retain 30 days
# This gives a 30-day restorable archive even after ILM removes the live
# index.  Snapshots are stored in the /snapshots repository volume mounted
# into the elasticsearch container via docker-compose.
# ---------------------------------------------------------------------------
echo "Registering snapshot repository..."
until curl -s -X PUT \
  --cacert config/certs/ca/ca.crt \
  -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  "https://elasticsearch:9200/_snapshot/pong-logs-archive" \
  -d '{
    "type": "fs",
    "settings": {
      "location": "/snapshots",
      "compress": true
    }
  }' | grep -q '"acknowledged":true'; do
  echo "  Failed to register snapshot repository, retrying..."
  sleep 10
done
echo "Snapshot repository registered."

echo "Configuring SLM snapshot policy (daily, retain 30 days)..."
until curl -s -X PUT \
  --cacert config/certs/ca/ca.crt \
  -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  "https://elasticsearch:9200/_slm/policy/pong-logs-snapshot" \
  -d '{
    "schedule": "0 30 1 * * ?",
    "name": "<pong-logs-{now/d}>",
    "repository": "pong-logs-archive",
    "config": {
      "indices": ["logs-*"],
      "ignore_unavailable": true,
      "include_global_state": false
    },
    "retention": {
      "expire_after": "30d",
      "min_count": 1,
      "max_count": 30
    }
  }' | grep -q '"acknowledged":true'; do
  echo "  Failed to configure SLM policy, retrying..."
  sleep 10
done
echo "SLM snapshot policy configured."

echo "ELK setup completed successfully!"

# Keep container running for health checks
echo "Setup complete, keeping container alive for dependencies..."
tail -f /dev/null
