# Observability Guide

Comprehensive monitoring, logging, tracing, and error tracking for the Fenod Stack on Cloudflare.

**Last Updated:** November 2025

---

## Table of Contents

- [Overview](#overview)
- [Logging Strategy](#logging-strategy)
- [Monitoring & Metrics](#monitoring--metrics)
- [Error Tracking](#error-tracking)
- [Performance Monitoring](#performance-monitoring)
- [Distributed Tracing](#distributed-tracing)
- [Alerting](#alerting)
- [Dashboards](#dashboards)

---

## Overview

### Observability Pillars

| Pillar | Purpose | Tools |
|--------|---------|-------|
| **Logs** | What happened? | Wrangler tail, Axiom, Datadog |
| **Metrics** | How much/how often? | Cloudflare Analytics, Prometheus |
| **Traces** | Where did request go? | OpenTelemetry, Honeycomb |
| **Errors** | What went wrong? | Sentry, Cloudflare Workers errors |

### Recommended Stack

```
Logs:      Cloudflare Logpush + Axiom
Metrics:   Cloudflare Analytics + Custom metrics
Traces:    OpenTelemetry + Honeycomb
Errors:    Sentry
Uptime:    Checkly or Better Uptime
```

---

## Logging Strategy

### Built-in Cloudflare Logs

#### Wrangler Tail (Development)

```bash
# Stream real-time logs
wrangler tail

# Filter by status
wrangler tail --status error

# Filter by method
wrangler tail --method POST

# Format output
wrangler tail --format pretty

# Save to file
wrangler tail > logs.txt
```

#### Console Logging

```typescript
// app/lib/logger.ts
export const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }))
  },

  error: (message: string, error?: Error, meta?: object) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
      timestamp: new Date().toISOString(),
      ...meta
    }))
  },

  warn: (message: string, meta?: object) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }))
  },

  debug: (message: string, meta?: object) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify({
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        ...meta
      }))
    }
  }
}
```

#### Usage in Application

```typescript
// api/index.ts
import { logger } from './lib/logger'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const start = Date.now()

    try {
      logger.info('Request received', {
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent')
      })

      const response = await handleRequest(request, env)

      logger.info('Request completed', {
        method: request.method,
        url: request.url,
        status: response.status,
        duration: Date.now() - start
      })

      return response

    } catch (error) {
      logger.error('Request failed', error as Error, {
        method: request.method,
        url: request.url,
        duration: Date.now() - start
      })

      throw error
    }
  }
}
```

### Cloudflare Logpush

Enable structured log shipping to external services:

```bash
# Enable Logpush to S3
wrangler logpush create \
  --destination-conf "s3://my-bucket/logs?region=us-east-1" \
  --dataset workers_trace_events \
  --frequency high

# Enable Logpush to Axiom
wrangler logpush create \
  --destination-conf "axiom://api.axiom.co/v1/datasets/my-dataset" \
  --dataset workers_trace_events
```

### Structured Logging

```typescript
// app/lib/structured-logger.ts
interface LogContext {
  requestId?: string
  userId?: string
  traceId?: string
  spanId?: string
}

class StructuredLogger {
  private context: LogContext = {}

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context }
  }

  log(level: string, message: string, meta?: object) {
    const log = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...meta
    }

    console[level === 'error' ? 'error' : 'log'](JSON.stringify(log))
  }

  info(message: string, meta?: object) {
    this.log('info', message, meta)
  }

  error(message: string, error?: Error, meta?: object) {
    this.log('error', message, {
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      },
      ...meta
    })
  }
}

export const logger = new StructuredLogger()
```

---

## Monitoring & Metrics

### Cloudflare Analytics

**Built-in metrics** (free):
- Requests per second
- Bandwidth usage
- Status codes (2xx, 4xx, 5xx)
- Response time percentiles
- Cache hit ratio

**Access via:**
- Cloudflare Dashboard
- GraphQL API
- Workers Analytics Engine

### Custom Metrics with Analytics Engine

```typescript
// Track custom metrics
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const start = Date.now()

    try {
      const response = await handleRequest(request, env)

      // Write custom metrics
      ctx.waitUntil(
        env.ANALYTICS.writeDataPoint({
          indexes: [request.method], // Dimensions
          blobs: [request.url],
          doubles: [
            Date.now() - start,       // Response time
            response.status,          // Status code
          ],
        })
      )

      return response
    } catch (error) {
      // Track errors
      ctx.waitUntil(
        env.ANALYTICS.writeDataPoint({
          indexes: ['ERROR'],
          blobs: [(error as Error).message],
          doubles: [Date.now() - start],
        })
      )

      throw error
    }
  }
}
```

### Query Analytics

```graphql
# GraphQL query for analytics
query {
  viewer {
    accounts(filter: { accountTag: "YOUR_ACCOUNT_ID" }) {
      httpRequestsAdaptiveGroups(
        filter: {
          datetime_geq: "2025-11-01T00:00:00Z"
          datetime_leq: "2025-11-08T00:00:00Z"
        }
        limit: 10000
      ) {
        sum {
          requests
          bytes
        }
        dimensions {
          datetime
          clientCountryName
          clientRequestHTTPProtocol
        }
      }
    }
  }
}
```

### Prometheus Integration

```typescript
// Export metrics in Prometheus format
export async function metricsHandler(request: Request, env: Env): Promise<Response> {
  const metrics = await getMetricsFromAnalytics(env)

  const prometheus = `
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} ${metrics.get200}
http_requests_total{method="GET",status="404"} ${metrics.get404}
http_requests_total{method="GET",status="500"} ${metrics.get500}

# HELP http_request_duration_seconds HTTP request latency
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} ${metrics.p50}
http_request_duration_seconds_bucket{le="0.5"} ${metrics.p95}
http_request_duration_seconds_bucket{le="1.0"} ${metrics.p99}
  `.trim()

  return new Response(prometheus, {
    headers: { 'Content-Type': 'text/plain' }
  })
}
```

---

## Error Tracking

### Sentry Integration

#### Setup

```bash
npm install @sentry/browser @sentry/cli
```

```typescript
// app/lib/sentry.ts
import * as Sentry from '@sentry/browser'

export function initSentry() {
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    environment: process.env.ENVIRONMENT || 'production',
    tracesSampleRate: 0.1,  // 10% of transactions

    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers['Authorization']
        delete event.request.headers['Cookie']
      }
      return event
    }
  })
}
```

#### Usage

```typescript
// app/index.ts
import { initSentry } from './lib/sentry'
import * as Sentry from '@sentry/browser'

initSentry()

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(request, env)
    } catch (error) {
      // Capture error in Sentry
      Sentry.captureException(error, {
        contexts: {
          request: {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers)
          }
        },
        tags: {
          endpoint: new URL(request.url).pathname
        }
      })

      throw error
    }
  }
}
```

#### Source Maps

```javascript
// vite.config.ts
import { defineConfig } from 'vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  build: {
    sourcemap: true
  },
  plugins: [
    sentryVitePlugin({
      org: 'your-org',
      project: 'your-project',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    })
  ]
})
```

### Custom Error Tracking

```typescript
// app/lib/error-tracker.ts
interface ErrorReport {
  message: string
  stack?: string
  context: {
    url: string
    method: string
    userId?: string
    timestamp: string
  }
}

export async function trackError(
  error: Error,
  request: Request,
  env: Env
) {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    context: {
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString()
    }
  }

  // Store in D1 for later analysis
  await env.DB.prepare(`
    INSERT INTO error_logs (message, stack, context, created_at)
    VALUES (?, ?, ?, ?)
  `).bind(
    report.message,
    report.stack,
    JSON.stringify(report.context),
    report.context.timestamp
  ).run()

  // Also send to external service
  await fetch('https://your-error-tracking-service.com/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report)
  })
}
```

---

## Performance Monitoring

### Web Vitals Tracking

```typescript
// app/lib/vitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals'

export function reportWebVitals() {
  const sendToAnalytics = (metric: any) => {
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        delta: metric.delta,
      }),
      headers: { 'Content-Type': 'application/json' }
    })
  }

  onCLS(sendToAnalytics)
  onFID(sendToAnalytics)
  onFCP(sendToAnalytics)
  onLCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
}
```

### Database Query Performance

```typescript
// app/lib/db-monitor.ts
export async function monitoredQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = performance.now()

  try {
    const result = await queryFn()
    const duration = performance.now() - start

    logger.info('Database query completed', {
      query: queryName,
      duration,
      success: true
    })

    // Alert on slow queries
    if (duration > 1000) {
      logger.warn('Slow database query detected', {
        query: queryName,
        duration
      })
    }

    return result
  } catch (error) {
    const duration = performance.now() - start

    logger.error('Database query failed', error as Error, {
      query: queryName,
      duration
    })

    throw error
  }
}

// Usage
const customers = await monitoredQuery(
  'getCustomers',
  () => db.select().from(customers).limit(50)
)
```

### API Response Time Tracking

```typescript
// Middleware for tracking API response times
export async function performanceMiddleware(
  request: Request,
  next: () => Promise<Response>
): Promise<Response> {
  const start = performance.now()
  const response = await next()
  const duration = performance.now() - start

  // Add timing header
  response.headers.set('Server-Timing', `total;dur=${duration}`)

  // Log slow requests
  if (duration > 500) {
    logger.warn('Slow API request', {
      url: request.url,
      method: request.method,
      duration,
      status: response.status
    })
  }

  return response
}
```

---

## Distributed Tracing

### OpenTelemetry Setup

```bash
npm install @opentelemetry/api @opentelemetry/sdk-trace-base @opentelemetry/exporter-trace-otlp-http
```

```typescript
// app/lib/tracing.ts
import { trace, context } from '@opentelemetry/api'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'

const provider = new WebTracerProvider()
const exporter = new OTLPTraceExporter({
  url: 'https://api.honeycomb.io/v1/traces',
  headers: {
    'x-honeycomb-team': 'YOUR_API_KEY',
    'x-honeycomb-dataset': 'fenod-app'
  }
})

provider.addSpanProcessor(new BatchSpanProcessor(exporter))
provider.register()

export const tracer = trace.getTracer('fenod-app')
```

### Usage

```typescript
// app/api/customers.ts
import { tracer } from '@/lib/tracing'

export async function getCustomers(request: Request, env: Env) {
  const span = tracer.startSpan('getCustomers')

  try {
    span.setAttribute('http.method', request.method)
    span.setAttribute('http.url', request.url)

    // Database query span
    const dbSpan = tracer.startSpan('db.query', {
      parent: span
    })

    const customers = await env.DB.prepare(`
      SELECT * FROM customers LIMIT 50
    `).all()

    dbSpan.setAttribute('db.rows', customers.results.length)
    dbSpan.end()

    span.setStatus({ code: 0 }) // OK
    span.end()

    return customers
  } catch (error) {
    span.recordException(error as Error)
    span.setStatus({ code: 2 }) // ERROR
    span.end()
    throw error
  }
}
```

### Trace Context Propagation

```typescript
// Propagate trace context across service calls
export async function callExternalService(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const span = tracer.startSpan('external.http')

  const headers = new Headers(options.headers)

  // Inject trace context
  trace.getSpan(context.active())?.spanContext()
  headers.set('traceparent', generateTraceParent(span))

  try {
    const response = await fetch(url, {
      ...options,
      headers
    })

    span.setAttribute('http.status_code', response.status)
    span.end()

    return response
  } catch (error) {
    span.recordException(error as Error)
    span.end()
    throw error
  }
}
```

---

## Alerting

### Cloudflare Notifications

Set up alerts in Cloudflare dashboard:

```yaml
Alerts:
  - Error Rate Spike: >5% 5xx errors
  - High Latency: p95 > 1000ms
  - Traffic Spike: >200% increase
  - D1 Query Errors: Any D1 failures
```

### Custom Alerting

```typescript
// app/lib/alerting.ts
export async function sendAlert(
  level: 'info' | 'warning' | 'critical',
  message: string,
  details?: object
) {
  // Send to Slack
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `${level.toUpperCase()}: ${message}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${level.toUpperCase()}*: ${message}`
          }
        },
        {
          type: 'section',
          fields: Object.entries(details || {}).map(([key, value]) => ({
            type: 'mrkdwn',
            text: `*${key}*: ${value}`
          }))
        }
      ]
    })
  })

  // Send to PagerDuty for critical alerts
  if (level === 'critical') {
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: process.env.PAGERDUTY_KEY,
        event_action: 'trigger',
        payload: {
          summary: message,
          severity: 'critical',
          source: 'fenod-app',
          custom_details: details
        }
      })
    })
  }
}

// Usage
if (errorRate > 0.05) {
  await sendAlert('critical', 'Error rate exceeded 5%', {
    currentRate: errorRate,
    threshold: 0.05,
    timestamp: new Date().toISOString()
  })
}
```

---

## Dashboards

### Cloudflare Dashboard

Built-in dashboard shows:
- Request volume
- Bandwidth usage
- Status codes
- Response time percentiles
- Geography distribution

### Grafana Dashboard

```yaml
# Example Grafana dashboard configuration
apiVersion: 1
datasources:
  - name: Cloudflare
    type: prometheus
    url: http://prometheus:9090

dashboards:
  - name: Fenod Stack Overview
    panels:
      - title: Request Rate
        type: graph
        query: rate(http_requests_total[5m])

      - title: Error Rate
        type: graph
        query: rate(http_requests_total{status=~"5.."}[5m])

      - title: Response Time (p95)
        type: graph
        query: histogram_quantile(0.95, http_request_duration_seconds)

      - title: Database Query Time
        type: graph
        query: rate(db_query_duration_seconds[5m])
```

### Custom Dashboard

```typescript
// Simple custom dashboard endpoint
export async function dashboardHandler(env: Env): Promise<Response> {
  const [requests, errors, latency] = await Promise.all([
    getMetric(env, 'requests_total'),
    getMetric(env, 'errors_total'),
    getMetric(env, 'latency_p95')
  ])

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Fenod Stack Dashboard</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </head>
      <body>
        <h1>Application Metrics</h1>

        <div>
          <h2>Requests: ${requests.toLocaleString()}</h2>
          <h2>Errors: ${errors}</h2>
          <h2>Latency (p95): ${latency}ms</h2>
        </div>

        <canvas id="chart"></canvas>

        <script>
          // Render charts
          const ctx = document.getElementById('chart')
          new Chart(ctx, {
            type: 'line',
            data: ${JSON.stringify(getChartData())},
          })
        </script>
      </body>
    </html>
  `

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}
```

---

## Best Practices

### 1. **Log Structured Data**

```typescript
// ✅ Good - Structured
logger.info('User created', { userId: 123, email: 'user@example.com' })

// ❌ Bad - Unstructured
console.log(`User 123 created with email user@example.com`)
```

### 2. **Set Appropriate Log Levels**

```typescript
logger.debug('Query params', { params })  // Development only
logger.info('Request received', { url })   // Normal operations
logger.warn('Slow query', { duration })    // Potential issues
logger.error('Failed to connect', error)   // Errors
```

### 3. **Include Context**

```typescript
logger.info('Order placed', {
  orderId: order.id,
  userId: user.id,
  total: order.total,
  itemCount: order.items.length,
  timestamp: new Date().toISOString()
})
```

### 4. **Sample High-Volume Logs**

```typescript
// Only log 10% of requests
if (Math.random() < 0.1) {
  logger.info('Request details', { url, method, headers })
}
```

### 5. **Set Up Alerts Early**

Don't wait for production issues - set up basic alerts immediately.

---

## Recommended Services

| Service | Best For | Pricing |
|---------|---------|---------|
| **Axiom** | Log aggregation | Free tier: 500GB/month |
| **Sentry** | Error tracking | Free tier: 5K events/month |
| **Honeycomb** | Distributed tracing | Free tier: 20M events/month |
| **Checkly** | Synthetic monitoring | Free tier: 5K checks/month |
| **Better Uptime** | Uptime monitoring | Free tier: 10 monitors |

---

## Next Steps

- [Troubleshooting Guide](troubleshooting.md)
- [Cost Calculator](cost-calculator.md)
- [Infrastructure as Code](infrastructure-as-code.md)

---

**Last Updated:** November 2025
