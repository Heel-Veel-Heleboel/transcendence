# Observability Guide

## Stack Overview

```
Services (pino-socket TCP)
        │
        ▼
   Logstash :5044          ← parses & enriches JSON logs
        │
        ▼
Elasticsearch :9200        ← stores logs in daily indices
        │
        ▼
   Kibana :5601            ← search, filter, visualise logs


Services (/metrics endpoint)
        │
        ▼
  Prometheus :9090         ← scrapes & stores metrics
        │
        ▼
   Grafana :3001           ← dashboards & alerts UI
```

### Component descriptions

| Component | What it is | What it does here |
|-----------|-----------|-------------------|
| **Logstash** | Data processing pipeline | Receives raw JSON logs from services over TCP (pino-socket). Parses Pino fields (`level`, `time`, `name`), maps numeric levels to `severity` strings, overrides severity based on HTTP status codes, and writes each event to a per-service daily index in Elasticsearch (`logs-<service>-YYYY.MM.dd`). |
| **Elasticsearch** | Distributed search & analytics engine | Stores every log event in a daily index named `logs-<service>-YYYY.MM.dd` (e.g. `logs-api-gateway-2026.04.11`). Provides full-text search and field filtering via its REST API. TLS + xpack security are enabled — all internal traffic is encrypted with auto-generated certificates. |
| **Kibana** | UI for Elasticsearch | The main interface for browsing, filtering, and visualising logs. Connects to Elasticsearch with the `kibana_system` internal user. You log in as `elastic` to use it. |
| **Prometheus** | Metrics collection engine | Scrapes `/metrics` endpoints on a 15 s interval. Uses Docker service discovery via docker-proxy — any container with the label `prometheus.scrape=true` is picked up automatically. |
| **Grafana** | Metrics visualisation UI | Connects to Prometheus as its default datasource (auto-provisioned). Used for dashboards and alert visualisation. |
| **docker-proxy** | Safe Docker API gateway | Exposes a read-only subset of the Docker API to Prometheus so it can discover containers without full daemon access. |

---

## Prerequisites

Create a `.env` file at the project root and set your credentials before starting using the values below:

```env
ELASTIC_USER=elastic
ELASTIC_PASSWORD=<your-password>

KIBANA_USER=kibana_system
KIBANA_PASSWORD=<your-password>

GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<your-password>
```

---

## Starting the stack

```bash
docker compose -f docker-compose.yml -f docker-compose.observability.yml up -d
```

The `setup` service runs the one-time ELK initialization steps: it generates TLS certificates for Elasticsearch, Kibana, and Logstash, then sets the `kibana_system` password. The setup container stays running, so Elasticsearch and Kibana readiness is driven by the Compose dependency and healthcheck flow rather than by `setup` exiting. Allow roughly 60–120 seconds for the stack to become healthy.

Check readiness:

```bash
# setup logs should include "ELK setup completed successfully!"
docker compose logs setup

# Elasticsearch cluster health (green or yellow = ready)
docker compose -f docker-compose.yml -f docker-compose.observability.yml exec elk-setup \
  curl -u elastic:<ELASTIC_PASSWORD> --cacert config/certs/ca/ca.crt \
  https://elasticsearch:9200/_cluster/health
```

---

## Logging in to Kibana

1. Open [http://localhost:5601](http://localhost:5601).
2. Log in with:
   - **Username**: `elastic`
   - **Password**: the value of `ELASTIC_PASSWORD` in your `.env`

> The `kibana_system` user is an internal service account — do not log in with it directly.

---

## Creating the `logs-*` data view (index pattern)

Kibana needs a **data view** that matches the indices Logstash creates before you can search logs in Discover.

1. In Kibana, open the main menu (top-left hamburger) → **Stack Management**.
2. Under **Kibana**, click **Data Views**.
3. Click **Create data view**.
4. Fill in:
   - **Name**: `logs-*`
   - **Index pattern**: `logs-*`
   - **Timestamp field**: `@timestamp`
5. Click **Save data view to Kibana**.

> If no indices appear in the dropdown, logs have not reached Elasticsearch yet. Check Logstash is running and that at least one service is shipping logs.

You only need to do this once. The data view covers all per-service indices (`logs-api-gateway-*`, `logs-auth-*`, etc.) automatically.

---

## Browsing logs in Kibana Discover

1. Open the main menu → **Discover**.
2. Select the **`logs-*`** data view from the dropdown at the top-left.
3. Set the time range using the date picker in the top-right corner (e.g. **Last 15 minutes**).

### Useful fields to add as columns

Click **+ Add** next to a field name in the left sidebar:

| Field | Description |
|-------|-------------|
| `service_name` | Which service emitted the log |
| `severity` | `debug`, `info`, `warn`, or `error` |
| `msg` | The log message |
| `req.method` / `req.url` | HTTP method and path |
| `res.statusCode` | HTTP response status |
| `responseTime` | Request duration in ms |

### Filtering logs

**KQL (Kibana Query Language) examples:**

```kql
# All errors from api-gateway
service_name: "api-gateway" and severity: "error"

# All HTTP 5xx responses
res.statusCode >= 500

# All HTTP 4xx responses from a specific service
service_name: "auth" and res.statusCode >= 400 and res.statusCode < 500

# Keyword search in log messages
msg: "timeout"

# Specific request path
req.url: "/api/game*"
```

Type filters directly into the search bar at the top of Discover. Press **Enter** to apply.

You can also click any field value in a log entry and choose **Filter for value** or **Filter out value** to add filters without typing.

---

## Checking Prometheus targets

Open [http://localhost:9090/targets](http://localhost:9090/targets).

Each container with the `prometheus.scrape=true` label appears here. **State** should be `UP`. If it shows `DOWN` or `UNKNOWN`, the service is not exposing a `/metrics` endpoint yet.

Prometheus discovers containers automatically every 15 s via docker-proxy — no config restart needed when new services are added.

---

## Accessing Grafana

1. Open [http://localhost:3001](http://localhost:3001).
2. Log in with `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` from `.env`.
3. The **Prometheus** datasource is pre-provisioned — no manual setup needed.

Dashboards are loaded from `src/observability/grafana/dashboards/`. Currently no dashboards exist — this is pending implementation.

---

## Quick reference

| Service | URL | Login |
|---------|-----|-------|
| Kibana | http://localhost:5601 | `elastic` / `ELASTIC_PASSWORD` |
| Grafana | http://localhost:3001 | `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` |
| Prometheus | http://localhost:9090 | none |
| Prometheus targets | http://localhost:9090/targets | none |
| Elasticsearch API | https://localhost:9200 | `elastic` / `ELASTIC_PASSWORD` |
| Logstash API | http://localhost:9600 | none |

---

## Troubleshooting

### Kibana shows "No indices match logs-*"

Logs have not reached Elasticsearch yet.

1. Check Logstash is running: `docker logs transcendence-logstash-1`
2. Verify at least one service is connecting to Logstash on port 5044.
3. Set `LOGSTASH_DEBUG=true` in `.env` and restart Logstash to see parsed events printed to stdout.

### Elasticsearch health is `red`

```bash
curl -u elastic:<ELASTIC_PASSWORD> --cacert certs/ca/ca.crt \
  https://localhost:9200/_cluster/health?pretty
```

Common cause: `elk-setup` has not finished yet. Wait until its logs show `ELK setup completed successfully!`.

### Prometheus targets are DOWN

The service is not exposing `GET /metrics`. Implement `prom-client` in the service and expose the endpoint — see the implementation plan for the per-service steps.

### pino-socket logs stop after Logstash restart

pino-socket does not auto-reconnect. Restart the affected service after restarting Logstash:

```bash
docker restart transcendence-api-gateway-1
```

### Severity mapping reference

| Pino `level` | `severity` field | Override condition |
|-------------|------------------|--------------------|
| 10–29 | `debug` | — |
| 30–39 | `info` | — |
| 40–49 | `warn` | — |
| 50+ | `error` | — |
| any | `warn` | HTTP 4xx response |
| any | `error` | HTTP 5xx response |
