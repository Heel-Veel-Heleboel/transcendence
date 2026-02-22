# Observability Stack

This directory contains the configuration for the complete observability stack for Transcendence microservices.

## Stack Components

### Monitoring (Prometheus + Grafana)
- **Prometheus** (`:9090`) - Metrics collection and alerting
- **Grafana** (`:3001`) - Metrics visualization and dashboards

### Logging (ELK Stack)
- **Elasticsearch** (`:9200`) - Log storage and search
- **Logstash** (`:5000`) - Log processing pipeline
- **Kibana** (`:5601`) - Log visualization and analysis

## Directory Structure

```
observability/
├── prometheus/
│   ├── prometheus.yml    # Prometheus configuration
│   └── alerts.yml        # Alert rules
├── grafana/
│   ├── dashboards/       # Dashboard JSON files (Phase 2)
│   └── provisioning/     # Auto-provisioning config
│       ├── datasources/
│       │   └── prometheus.yml
│       └── dashboards/
│           └── dashboards.yml
└── logstash/
    ├── config/
    │   └── logstash.yml  # Logstash configuration
    └── pipeline/
        └── logstash.conf # Log processing pipeline
```

## Quick Start

### 1. Start the Stack

```bash
# Start all observability services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f prometheus grafana elasticsearch logstash kibana
```

### 2. Access Dashboards

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Kibana**: http://localhost:5601
- **Elasticsearch**: http://localhost:9200

### 3. Verify Setup

**Check Prometheus targets:**
```bash
curl http://localhost:9090/api/v1/targets
```

**Check Elasticsearch health:**
```bash
curl http://localhost:9200/_cluster/health
```

**Check Grafana datasource:**
```bash
curl -u admin:admin http://localhost:3001/api/datasources
```

## Configuration

### Prometheus

**Scrape Interval**: 15s (10s for application services)
**Retention**: 15 days
**Alert Evaluation**: 30s

**Service Discovery**: Docker (automatic container discovery)

**Targets**:
- Prometheus itself (`:9090`)
- All Docker containers with `prometheus.scrape=true` label

#### Enabling Metrics for Your Services

To enable Prometheus scraping for your Docker containers, add these labels:

```yaml
services:
  your-service:
    image: your-image
    labels:
      - "prometheus.scrape=true"        # Required: Enable scraping
      - "prometheus.port=3000"           # Required: Metrics port
      - "prometheus.path=/metrics"       # Optional: Metrics path (defaults to /metrics)
```

Example for API Gateway:
```yaml
api-gateway:
  build: ./src/api-gateway
  container_name: transcendence-api-gateway-1
  labels:
    - "prometheus.scrape=true"
    - "prometheus.port=3000"
    - "prometheus.path=/metrics"
```

Prometheus will automatically discover and scrape these containers!

### Grafana

**Admin Credentials**: admin/admin (change in production)
**Data Source**: Prometheus (auto-provisioned)
**Dashboards**: Auto-loaded from `dashboards/` directory

### Logstash

**Input**: TCP/UDP port 5000
**Output**: Elasticsearch
**Index Pattern**: `logs-{service}-{YYYY.MM.dd}`

**Parsed Fields**:
- `correlationId` → `trace_id`
- Circuit breaker events tagged
- HTTP request/response details extracted
- Error stack traces captured

### Elasticsearch

**Heap Size**: 1GB
**Retention**: 7 days (managed by ILM policy)
**Indices**: `logs-*`

## Alert Rules

Configured in `prometheus/alerts.yml`:

| Alert | Threshold | Duration | Severity |
|-------|-----------|----------|----------|
| HighErrorRate | >5% 5xx errors | 2min | warning |
| CircuitBreakerOpened | Circuit state = OPEN | 1min | critical |
| HighResponseTime | p95 > 1s | 5min | warning |
| ServiceDown | Service unreachable | 1min | critical |
| HighAuthFailureRate | >30% auth failures | 3min | warning |

## Metrics Available

### HTTP Metrics
- `http_requests_total` - Total requests by method, route, status
- `http_request_duration_seconds` - Request latency histogram
- `http_request_size_bytes` - Request body size
- `http_response_size_bytes` - Response body size

### Circuit Breaker Metrics
- `circuit_breaker_state` - Current state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)
- `circuit_breaker_failures_total` - Total failures by service
- `circuit_breaker_successes_total` - Total successes by service
- `circuit_breaker_state_changes` - State transitions

### Custom Metrics
- `active_websocket_connections` - WebSocket connection count
- `auth_attempts_total` - Authentication attempts by result
- `correlation_id_requests` - Requests with correlation IDs

## Log Fields

### Standard Fields
- `@timestamp` - Log timestamp
- `level` - Log level (10-60)
- `severity` - Severity keyword (debug, info, warning, error)
- `service` - Service name
- `correlationId` - Correlation ID for tracing
- `trace_id` - Same as correlationId (easier searching)

### HTTP Fields
- `http_method` - HTTP method (GET, POST, etc.)
- `http_url` - Request URL
- `http_status` - Response status code
- `responseTime` - Request duration (ms)

### Error Fields
- `error_message` - Error message
- `error_type` - Error type/name
- `error_stack` - Stack trace

### User Fields
- `user_id` - Authenticated user ID
- `user_email` - User email

## Common Operations

### Search Logs by Correlation ID

**Kibana**:
```
correlationId: "your-correlation-id-here"
```

**Elasticsearch**:
```bash
curl -X GET "localhost:9200/logs-*/_search?q=correlationId:your-id"
```

### Query Metrics

**Circuit breaker state**:
```promql
circuit_breaker_state{service="user-service"}
```

**Request rate**:
```promql
rate(http_requests_total[5m])
```

**Error rate**:
```promql
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
```

**p95 latency**:
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### View Active Alerts

**Prometheus UI**: http://localhost:9090/alerts
**Grafana**: Create alert panel in dashboards

## Troubleshooting

### Elasticsearch won't start

**Error**: "max virtual memory areas too small"

**Solution**:
```bash
sudo sysctl -w vm.max_map_count=262144
```

Make permanent:
```bash
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

### Logstash not receiving logs

1. Check Logstash is running:
   ```bash
   docker logs logstash
   ```

2. Test TCP connection:
   ```bash
   echo '{"test":"message"}' | nc localhost 5000
   ```

3. Check pipeline configuration:
   ```bash
   curl http://localhost:9600/_node/pipelines
   ```

### Prometheus not scraping services

1. Check targets status: http://localhost:9090/targets

2. Verify service is exposing metrics:
   ```bash
   curl http://localhost:3000/metrics
   ```

3. Check Prometheus logs:
   ```bash
   docker logs prometheus
   ```

### Grafana dashboard empty

1. Verify Prometheus datasource:
   - Grafana → Configuration → Data Sources
   - Test connection

2. Check Prometheus has data:
   - Prometheus UI → Graph
   - Query: `up`

3. Verify time range in Grafana dashboard

### Kibana index pattern not found

1. Check logs are flowing to Elasticsearch:
   ```bash
   curl http://localhost:9200/_cat/indices?v
   ```

2. Create index pattern in Kibana:
   - Kibana → Management → Index Patterns
   - Pattern: `logs-*`
   - Time field: `@timestamp`

## Next Steps

- **Phase 2**: Add metrics to services (prom-client)
- **Phase 3**: Create Grafana dashboards
- **Phase 4**: Configure log shipping from services
- **Phase 5**: Set up alerts and notifications

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Elasticsearch Guide](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Logstash Reference](https://www.elastic.co/guide/en/logstash/current/index.html)
- [Kibana Guide](https://www.elastic.co/guide/en/kibana/current/index.html)
