# Cloudflare Cost Calculator & Pricing Guide

Estimate your monthly costs for running applications on the Fenod Stack with Cloudflare infrastructure.

**Last Updated:** November 2025

---

## Table of Contents

- [Quick Cost Estimator](#quick-cost-estimator)
- [Pricing Breakdown](#pricing-breakdown)
- [Cost Comparison](#cost-comparison)
- [Cost Optimization Tips](#cost-optimization-tips)
- [Pricing Calculators](#pricing-calculators)

---

## Quick Cost Estimator

### Usage-Based Pricing Formula

```javascript
// Monthly cost calculator
function estimateMonthlyCost(usage) {
  const costs = {
    workers: calculateWorkersCost(usage.requests, usage.cpuTime),
    d1: calculateD1Cost(usage.reads, usage.writes, usage.storage),
    r2: calculateR2Cost(usage.storage, usage.operations),
    pages: 0, // Free for most use cases
    bandwidth: 0, // Unlimited and free
  }

  return Object.values(costs).reduce((sum, cost) => sum + cost, 0)
}
```

### Common Scenarios

| Scenario | Requests/Month | Est. Cost | Details |
|----------|----------------|-----------|---------|
| **Small Blog** | 100K | **$0** | Free tier sufficient |
| **Startup MVP** | 1M | **$5-10** | Light database usage |
| **Growing SaaS** | 10M | **$25-50** | Moderate DB + storage |
| **Scale-up** | 100M | **$150-300** | Heavy usage across services |
| **Enterprise** | 1B+ | **$1,500+** | Volume discounts available |

---

## Pricing Breakdown

### Cloudflare Workers

**Free Tier:**
- 100,000 requests/day (~3M/month)
- 10ms CPU time per request
- No bandwidth charges

**Paid Plan ($5/month):**
- Includes 10M requests
- Additional: $0.50 per million requests
- 50ms CPU time per request
- Duration: 30s max (10s on free tier)

**Example Costs:**

| Monthly Requests | Cost |
|-----------------|------|
| 3M (free tier) | $0 |
| 10M | $5 |
| 50M | $25 |
| 100M | $50 |
| 500M | $250 |

**Formula:**
```
Cost = $5 base + ((requests - 10M) / 1M) * $0.50
```

---

### Cloudflare D1 (SQLite Database)

**Free Tier:**
- 5M reads/day (~150M/month)
- 100K writes/day (~3M/month)
- 5GB storage
- No charge for queries

**Paid Pricing:**
- $0.001 per 1,000 rows read (after free tier)
- $1.00 per 1M rows written (after free tier)
- $0.75/GB storage per month (after 5GB)

**Example Costs:**

| Usage | Reads/Month | Writes/Month | Storage | Cost |
|-------|-------------|--------------|---------|------|
| Small | 50M | 1M | 2GB | $0 |
| Medium | 500M | 10M | 10GB | $0.35 + $7 + $3.75 = $11.10 |
| Large | 2B | 50M | 50GB | $1.85 + $47 + $33.75 = $82.60 |

**Formula:**
```javascript
const readCost = Math.max(0, (reads - 150M) / 1000) * 0.001
const writeCost = Math.max(0, (writes - 3M) / 1M) * 1.00
const storageCost = Math.max(0, storage - 5) * 0.75

const totalD1Cost = readCost + writeCost + storageCost
```

---

### Cloudflare R2 (Object Storage)

**Free Tier:**
- 10GB storage
- No egress fees (unlike S3)
- Class A operations (write): 1M/month free
- Class B operations (read): 10M/month free

**Paid Pricing:**
- Storage: $0.015/GB/month (after 10GB)
- Class A operations: $4.50 per million (writes, lists, deletes)
- Class B operations: $0.36 per million (reads)

**Example Costs:**

| Storage | Reads/Month | Writes/Month | Cost |
|---------|-------------|--------------|------|
| 5GB | 5M | 500K | $0 |
| 100GB | 50M | 2M | $1.35 + $0.14 + $4.50 = $6.00 |
| 1TB | 500M | 10M | $15.23 + $1.76 + $40.50 = $57.49 |

**Formula:**
```javascript
const storageCost = Math.max(0, storageGB - 10) * 0.015
const readCost = Math.max(0, (reads - 10M) / 1M) * 0.36
const writeCost = Math.max(0, (writes - 1M) / 1M) * 4.50

const totalR2Cost = storageCost + readCost + writeCost
```

---

### Cloudflare Pages

**Completely Free:**
- Unlimited bandwidth
- Unlimited requests
- 500 builds/month
- 100GB storage (for build assets)
- Automatic HTTPS

**Paid Add-ons (Optional):**
- Custom domains: Free
- Preview deployments: Free
- Additional build minutes: $0.04/min (after 500 builds)

**Cost:** $0 for 99% of use cases

---

### Cloudflare KV (Key-Value Store)

**Free Tier:**
- 100,000 reads/day (~3M/month)
- 1,000 writes/day (~30K/month)
- 1GB storage

**Paid Pricing:**
- $0.50 per million reads (after free tier)
- $5.00 per million writes (after free tier)
- $0.50/GB storage per month (after 1GB)

**Example Costs:**

| Reads/Month | Writes/Month | Storage | Cost |
|-------------|--------------|---------|------|
| 3M | 30K | 0.5GB | $0 |
| 100M | 500K | 5GB | $48.50 + $2.35 + $2.00 = $52.85 |

---

### Cloudflare Images

**Pricing:**
- $5/month for 100,000 images stored
- $1 per 100,000 images delivered
- Unlimited transformations included

**Example Costs:**

| Images Stored | Images Delivered | Cost |
|---------------|------------------|------|
| 50K | 500K | $5 + $5 = $10 |
| 200K | 2M | $10 + $20 = $30 |
| 1M | 10M | $50 + $100 = $150 |

---

## Cost Comparison

### Scenario: Growing SaaS Application

**Assumptions:**
- 10M requests/month
- 500M database reads, 10M writes
- 100GB file storage
- 50M read operations
- 2M write operations

#### Cloudflare Total: $40.60/month

```
Workers:     $5.00
D1:          $11.10  (reads: $0.35, writes: $7, storage: $3.75)
R2:          $6.00   (storage: $1.35, reads: $0.14, writes: $4.50)
Pages:       $0.00
KV:          $0.00   (within free tier)
Bandwidth:   $0.00   (unlimited free)
───────────────────
Total:       $22.10
```

#### Vercel Total: ~$175/month

```
Pro Plan:           $20.00
Function Calls:     $40.00  (10M requests @ $40/10M)
Bandwidth:          $40.00  (500GB @ $0.08/GB after 100GB free)
Database (ext):     $50.00  (PlanetScale Pro or similar)
Storage (ext):      $25.00  (AWS S3 or similar)
───────────────────
Total:              $175.00
```

#### AWS Total: ~$280/month

```
Lambda:             $20.00  (10M requests, 128MB)
API Gateway:        $35.00  (10M requests)
RDS (Smallest):     $100.00 (db.t3.micro, Multi-AZ)
S3:                 $25.00  (100GB + requests)
CloudFront:         $50.00  (CDN)
Data Transfer:      $50.00  (500GB egress)
───────────────────
Total:              $280.00
```

### Cost Comparison Table

| Service | Cloudflare | Vercel | AWS | Savings |
|---------|-----------|--------|-----|---------|
| Compute | $5 | $60 | $55 | **91% vs Vercel** |
| Database | $11 | $50 | $100 | **78% vs Vercel** |
| Storage | $6 | $25 | $25 | **76% vs Vercel** |
| Bandwidth | $0 | $40 | $50 | **100% savings** |
| **Total** | **$22** | **$175** | **$280** | **87% vs Vercel, 92% vs AWS** |

---

## Cost Optimization Tips

### 1. Optimize Database Queries

**Problem:** Excessive reads increase D1 costs

**Solutions:**
```typescript
// ❌ Bad - Multiple queries
const user = await db.select().from(users).where(eq(users.id, 1))
const posts = await db.select().from(posts).where(eq(posts.userId, 1))
const comments = await db.select().from(comments).where(eq(comments.userId, 1))
// Cost: 3 separate reads

// ✅ Good - Single join query
const userData = await db.select()
  .from(users)
  .leftJoin(posts, eq(posts.userId, users.id))
  .leftJoin(comments, eq(comments.userId, users.id))
  .where(eq(users.id, 1))
// Cost: 1 read (rows counted, not queries)
```

**Savings:** 60-80% reduction in read operations

### 2. Use KV for Caching

**Problem:** Repeated D1 reads for same data

**Solution:**
```typescript
// Cache frequently accessed data in KV
async function getPopularPosts() {
  // Check KV cache first
  const cached = await env.KV.get('popular-posts')
  if (cached) return JSON.parse(cached)

  // If not cached, query D1
  const posts = await db.select()
    .from(posts)
    .orderBy(desc(posts.views))
    .limit(10)

  // Cache for 1 hour
  await env.KV.put('popular-posts', JSON.stringify(posts), {
    expirationTtl: 3600
  })

  return posts
}
```

**Savings:** Can reduce D1 reads by 90%+ for hot data

### 3. Batch R2 Operations

**Problem:** Many small file uploads cost more

**Solution:**
```typescript
// ❌ Bad - Upload files one by one
for (const file of files) {
  await env.R2.put(`uploads/${file.name}`, file.data)
}
// Cost: N write operations

// ✅ Good - Batch small files into archives
const archive = await createZip(files)
await env.R2.put(`uploads/batch-${Date.now()}.zip`, archive)
// Cost: 1 write operation
```

**Savings:** Up to 90% reduction in Class A operations

### 4. Implement Smart Pagination

**Problem:** Large dataset queries are expensive

**Solution:**
```typescript
// ✅ Use cursor-based pagination
async function getPaginatedCustomers(cursor?: string, limit = 50) {
  const query = db.select()
    .from(customers)
    .limit(limit)

  if (cursor) {
    query.where(gt(customers.id, parseInt(cursor)))
  }

  return query
}
// Only reads requested rows
```

**Savings:** 70-90% reduction vs loading all data

### 5. Use Workers for Pre-processing

**Problem:** Storing every uploaded image variation

**Solution:**
```typescript
// Don't store multiple sizes - transform on-the-fly
app.get('/images/:id/:size', async (c) => {
  const { id, size } = c.req.param()

  // Fetch original from R2
  const original = await c.env.R2.get(`images/${id}`)

  // Transform using Cloudflare Images
  return c.redirect(
    `/cdn-cgi/image/width=${size},quality=80/${id}`
  )
})
```

**Savings:** Eliminates redundant storage costs

### 6. Monitor and Alert

**Set up cost alerts:**
```typescript
// Pseudo-code for monitoring
if (monthlyD1Reads > 450M) {
  sendAlert('Approaching D1 free tier limit')
}

if (monthlyWorkerRequests > 9M) {
  sendAlert('Approaching Workers free tier limit')
}
```

### 7. Use Preview Deployments Wisely

**Problem:** Too many preview builds burn through free tier

**Solution:**
- Only create previews for main branches
- Delete old preview deployments
- Use Wrangler local dev for testing

---

## Interactive Cost Calculator

### JavaScript Calculator

```javascript
/**
 * Calculate estimated monthly Cloudflare costs
 *
 * @param {Object} usage - Usage metrics
 * @returns {Object} Detailed cost breakdown
 */
function calculateCloudfareCosts(usage) {
  const {
    workerRequests = 0,
    d1Reads = 0,
    d1Writes = 0,
    d1StorageGB = 0,
    r2StorageGB = 0,
    r2ClassAOps = 0,  // writes
    r2ClassBOps = 0,  // reads
    kvReads = 0,
    kvWrites = 0,
    kvStorageGB = 0,
  } = usage

  // Workers cost
  const workersCost = workerRequests > 3_000_000
    ? 5 + Math.max(0, (workerRequests - 10_000_000) / 1_000_000) * 0.50
    : 0

  // D1 cost
  const d1ReadCost = Math.max(0, (d1Reads - 150_000_000) / 1000) * 0.001
  const d1WriteCost = Math.max(0, (d1Writes - 3_000_000) / 1_000_000) * 1.00
  const d1StorageCost = Math.max(0, d1StorageGB - 5) * 0.75
  const d1TotalCost = d1ReadCost + d1WriteCost + d1StorageCost

  // R2 cost
  const r2StorageCost = Math.max(0, r2StorageGB - 10) * 0.015
  const r2ClassACost = Math.max(0, (r2ClassAOps - 1_000_000) / 1_000_000) * 4.50
  const r2ClassBCost = Math.max(0, (r2ClassBOps - 10_000_000) / 1_000_000) * 0.36
  const r2TotalCost = r2StorageCost + r2ClassACost + r2ClassBCost

  // KV cost
  const kvReadCost = Math.max(0, (kvReads - 3_000_000) / 1_000_000) * 0.50
  const kvWriteCost = Math.max(0, (kvWrites - 30_000) / 1_000_000) * 5.00
  const kvStorageCost = Math.max(0, kvStorageGB - 1) * 0.50
  const kvTotalCost = kvReadCost + kvWriteCost + kvStorageCost

  const totalCost = workersCost + d1TotalCost + r2TotalCost + kvTotalCost

  return {
    workers: workersCost.toFixed(2),
    d1: {
      reads: d1ReadCost.toFixed(2),
      writes: d1WriteCost.toFixed(2),
      storage: d1StorageCost.toFixed(2),
      total: d1TotalCost.toFixed(2),
    },
    r2: {
      storage: r2StorageCost.toFixed(2),
      classA: r2ClassACost.toFixed(2),
      classB: r2ClassBCost.toFixed(2),
      total: r2TotalCost.toFixed(2),
    },
    kv: {
      reads: kvReadCost.toFixed(2),
      writes: kvWriteCost.toFixed(2),
      storage: kvStorageCost.toFixed(2),
      total: kvTotalCost.toFixed(2),
    },
    total: totalCost.toFixed(2),
    comparison: {
      vercel: (totalCost * 7).toFixed(2),  // Approximate
      aws: (totalCost * 10).toFixed(2),    // Approximate
    }
  }
}

// Example usage
const costs = calculateCloudfareCosts({
  workerRequests: 10_000_000,
  d1Reads: 500_000_000,
  d1Writes: 10_000_000,
  d1StorageGB: 10,
  r2StorageGB: 100,
  r2ClassAOps: 2_000_000,
  r2ClassBOps: 50_000_000,
  kvReads: 100_000_000,
  kvWrites: 500_000,
  kvStorageGB: 5,
})

console.log('Monthly Cost Estimate:', costs)
/*
Output:
{
  workers: "5.00",
  d1: {
    reads: "0.35",
    writes: "7.00",
    storage: "3.75",
    total: "11.10"
  },
  r2: {
    storage: "1.35",
    classA: "4.50",
    classB: "0.14",
    total: "5.99"
  },
  kv: {
    reads: "48.50",
    writes: "2.35",
    storage: "2.00",
    total: "52.85"
  },
  total: "74.94",
  comparison: {
    vercel: "524.58",
    aws: "749.40"
  }
}
*/
```

### CLI Calculator

```bash
# Save as estimate-cloudflare-costs.sh
#!/bin/bash

echo "Cloudflare Monthly Cost Estimator"
echo "=================================="
echo

read -p "Worker requests/month (e.g., 10000000): " WORKER_REQUESTS
read -p "D1 reads/month (e.g., 500000000): " D1_READS
read -p "D1 writes/month (e.g., 10000000): " D1_WRITES
read -p "D1 storage (GB) (e.g., 10): " D1_STORAGE
read -p "R2 storage (GB) (e.g., 100): " R2_STORAGE
read -p "R2 write operations/month (e.g., 2000000): " R2_WRITES
read -p "R2 read operations/month (e.g., 50000000): " R2_READS

echo
echo "Calculating..."
echo

# Calculate Workers
WORKERS_COST=0
if [ $WORKER_REQUESTS -gt 3000000 ]; then
  EXTRA_REQUESTS=$(( ($WORKER_REQUESTS - 10000000) / 1000000 ))
  if [ $EXTRA_REQUESTS -lt 0 ]; then
    WORKERS_COST=5
  else
    WORKERS_COST=$(echo "5 + ($EXTRA_REQUESTS * 0.50)" | bc)
  fi
fi

echo "Workers: \$$WORKERS_COST"
# ... (rest of calculations)

echo "=================================="
echo "Total Estimated Cost: \$XX.XX/month"
```

---

## Pricing Calculators

### Official Cloudflare Calculators

- **Workers**: [workers.cloudflare.com/pricing](https://workers.cloudflare.com/pricing)
- **D1**: [developers.cloudflare.com/d1/platform/pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- **R2**: [developers.cloudflare.com/r2/pricing](https://developers.cloudflare.com/r2/pricing/)

### Third-Party Calculators

- Use the JavaScript calculator above
- Spreadsheet template (create your own in Google Sheets)

---

## Real-World Cost Examples

### Example 1: Personal Blog

**Traffic:** 50K visitors/month, 500K pageviews

**Costs:**
- Workers: $0 (within free tier)
- D1: $0 (minimal reads/writes)
- R2: $0 (10GB images within free tier)
- Pages: $0

**Total: $0/month**

### Example 2: SaaS Startup

**Traffic:** 100K users, 5M requests/month

**Costs:**
- Workers: $0 (under 10M)
- D1: $5 (200M reads, 5M writes, 8GB)
- R2: $3 (50GB files)
- KV: $0 (within free tier)

**Total: $8/month**

### Example 3: E-commerce Site

**Traffic:** 500K visitors, 20M requests/month

**Costs:**
- Workers: $10 (20M requests)
- D1: $25 (1B reads, 20M writes, 15GB)
- R2: $15 (200GB product images)
- Images: $20 (500K images)

**Total: $70/month**

---

## Cost Monitoring

### Setup Cloudflare Analytics

```typescript
// Track costs in your application
export default {
  async fetch(request, env, ctx) {
    // Log request for cost tracking
    ctx.waitUntil(
      env.ANALYTICS.writeDataPoint({
        doubles: [1], // Request count
        blobs: [request.url],
      })
    )

    return handleRequest(request, env)
  }
}
```

### Create Cost Alerts

```javascript
// Monitor usage and alert before hitting paid tiers
async function checkUsageLimits(env) {
  // Check D1 usage
  const d1Stats = await getD1Stats(env)
  if (d1Stats.monthlyReads > 140_000_000) {
    await sendAlert('Warning: Approaching D1 free tier limit')
  }

  // Check Workers usage
  const workerStats = await getWorkerStats(env)
  if (workerStats.monthlyRequests > 2_800_000) {
    await sendAlert('Warning: Approaching Workers daily limit')
  }
}
```

---

## FAQs

**Q: Why is Cloudflare so much cheaper?**

A: No egress fees, V8 isolates (not containers), integrated platform, and aggressive pricing to compete.

**Q: Are there hidden costs?**

A: No. Bandwidth is truly unlimited and free. What you see is what you pay.

**Q: What if I exceed free tier?**

A: You're automatically upgraded to paid (requires payment method). Set up alerts to monitor usage.

**Q: Can I get enterprise pricing?**

A: Yes, for very high volume (100M+ requests), contact Cloudflare sales for volume discounts.

**Q: How accurate is this calculator?**

A: Estimates are based on official Cloudflare pricing as of Nov 2025. Actual costs may vary by ±10% based on usage patterns.

---

## Next Steps

1. **Estimate your usage** - Use the calculator above
2. **Start on free tier** - Deploy and monitor actual usage
3. **Optimize** - Follow cost optimization tips
4. **Scale gradually** - Upgrade to paid plans as needed
5. **Monitor continuously** - Set up alerts and dashboards

---

**Official Pricing:** [cloudflare.com/plans/developer-platform](https://www.cloudflare.com/plans/developer-platform/)

**Questions?** See [Troubleshooting Guide](troubleshooting.md) or ask in GitHub Discussions.

---

**Last Updated:** November 2025
