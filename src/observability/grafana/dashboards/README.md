# Grafana Dashboards

This directory contains JSON dashboard definitions that will be automatically loaded into Grafana.

## Available Dashboards

Dashboards will be created in Phase 2 of the observability implementation:

1. **api-gateway.json** - API Gateway Overview
   - Request rate
   - Error rate
   - Response times
   - Status code distribution

2. **circuit-breaker.json** - Circuit Breaker Monitoring
   - Circuit states timeline
   - Failure rates
   - State transitions
   - Recovery metrics

3. **service-health.json** - Service Health Overview
   - Service availability
   - Resource usage
   - Request queue depth

## Creating Custom Dashboards

1. Create dashboard in Grafana UI
2. Export as JSON (Share → Export)
3. Save to this directory
4. Restart Grafana or wait for auto-reload (10s interval)

## Dashboard IDs

Use consistent dashboard UIDs for linking:
- API Gateway: `api-gateway`
- Circuit Breaker: `circuit-breaker`
- Service Health: `service-health`
