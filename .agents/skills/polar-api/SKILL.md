---
name: polar-api
description: >
  Manage Polar payments, products, checkouts, subscriptions, orders, and customers via
  the REST API using curl. Use this skill when the user asks to list products, create a
  checkout session, check subscription status, list orders, manage customers, inspect
  webhook events, or perform any Polar payment-related operations. This project uses
  Polar with a multi-tier pricing model (Free/Pro/Team/Enterprise) across sandbox and
  production environments.
---

# Polar API

Manage Polar payments and subscriptions via the REST API using curl. Polar has no dedicated CLI, so all operations use authenticated HTTP requests.

## When to Use

- Listing or inspecting products and pricing
- Creating checkout sessions for testing
- Listing orders or subscriptions
- Looking up customer information
- Debugging webhook deliveries
- Managing product benefits
- Checking subscription status
- Creating or archiving products

## When Not to Use

- Modifying application payment code -- edit `app/actions/polar.ts` or `app/lib/polar-products.ts` directly
- Polar webhook handler config -- edit `app/actions/polar-webhook.ts`
- Plan feature definitions -- edit `app/lib/plan-features.ts`
- Convex data operations -- use `convex-ops`

## Prerequisites

**Authentication:** Source the env vars from `.env.local`:

```bash
export POLAR_ACCESS_TOKEN=$(grep POLAR_ACCESS_TOKEN .env.local | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
```

To load all product IDs at once:

```bash
export POLAR_PRO_MONTHLY_ID=$(grep POLAR_PRO_MONTHLY_ID .env.local | cut -d'=' -f2-)
export POLAR_PRO_ANNUAL_ID=$(grep POLAR_PRO_ANNUAL_ID .env.local | cut -d'=' -f2-)
export POLAR_TEAM_MONTHLY_ID=$(grep POLAR_TEAM_MONTHLY_ID .env.local | cut -d'=' -f2-)
export POLAR_TEAM_ANNUAL_ID=$(grep POLAR_TEAM_ANNUAL_ID .env.local | cut -d'=' -f2-)
export POLAR_ENTERPRISE_MONTHLY_ID=$(grep POLAR_ENTERPRISE_MONTHLY_ID .env.local | cut -d'=' -f2-)
export POLAR_ENTERPRISE_ANNUAL_ID=$(grep POLAR_ENTERPRISE_ANNUAL_ID .env.local | cut -d'=' -f2-)
```

Tokens can be managed at: https://sandbox.polar.sh/dashboard/settings (sandbox) or https://dashboard.polar.sh/settings (production).

**Base URLs:**

| Environment | Base URL |
|-------------|----------|
| Sandbox | `https://sandbox-api.polar.sh` |
| Production | `https://api.polar.sh` |

This project uses **sandbox mode** for dev/preview. All examples below use the sandbox URL. Add a trailing `/` to paths (the API returns 307 redirects without it).

**Rate limits:** 100 requests/minute (sandbox), 500 requests/minute (production).

## Project Context

### Pricing Model (4 Tiers)

| Tier | Monthly | Annual | Target |
|------|---------|--------|--------|
| **Free** | $0 | $0 | Individuals (no Polar product) |
| **Pro** | $8/mo | $72/yr | Power users / small teams |
| **Team** | $29/seat/mo | $264/seat/yr | Organizations (5-100 seats) |
| **Enterprise** | $99/mo | $990/yr | Large organizations (100+ seats) |

Free tier has no Polar product -- it's the default state when no subscription exists.

### Product IDs (6 Products)

Each paid tier has a monthly and annual product in Polar. The env vars are:

| Env Var | Tier | Interval |
|---------|------|----------|
| `POLAR_PRO_MONTHLY_ID` | Pro | Monthly |
| `POLAR_PRO_ANNUAL_ID` | Pro | Yearly |
| `POLAR_TEAM_MONTHLY_ID` | Team | Monthly |
| `POLAR_TEAM_ANNUAL_ID` | Team | Yearly |
| `POLAR_ENTERPRISE_MONTHLY_ID` | Enterprise | Monthly |
| `POLAR_ENTERPRISE_ANNUAL_ID` | Enterprise | Yearly |

Sandbox and production have separate product IDs (same names, different UUIDs). The IDs are set in:
- `.env.local` -- sandbox IDs for local dev
- Vercel Preview env -- sandbox IDs
- Vercel Production env -- production IDs

### Polar Integration Architecture

- **Mode:** Env-driven via `POLAR_SERVER` (`"sandbox"` or `"production"`)
- **Product mapping:** `app/lib/polar-products.ts` -- `PLAN_PRODUCT_MAP` (tier+cycle -> product ID) and `resolvePlanFromProductId()` (product ID -> tier+cycle)
- **Plan features:** `app/lib/plan-features.ts` -- `PLAN_FEATURES` defines feature limits per tier, `getPlanFeatures()`, `hasFeature()`, `isAtLeastTier()`
- **Server actions:** `app/actions/polar.ts` -- `createPolarCheckoutSession`, `getPolarCheckoutSession`, `getPolarCustomer`, `getCustomerPortalUrl`
- **Webhook handler:** `app/actions/polar-webhook.ts` -- standalone handler processes `subscription.created`, `subscription.active`, `subscription.updated`, `subscription.canceled`, `subscription.revoked` events
- **Plan persistence:** Webhook handler calls `api.organization.updateOrgPlan` in Convex to update `orgSettings.plan`, `orgSettings.polarSubscriptionId`, `orgSettings.polarCustomerId`, and auto-derives `orgSettings.featureFlags`

### Subscription -> Org Linking

When a checkout is created, `clerkOrgId` is passed in the checkout metadata. When the subscription webhook fires, the handler reads `metadata.clerkOrgId` to find and update the correct org in Convex.

### Authentication Header

All requests use:
```
Authorization: Bearer $POLAR_ACCESS_TOKEN
```

## Command Reference

### Products

```bash
# List all products
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/products/" | jq '.items[] | {id, name, is_archived, recurring_interval, prices: [.prices[] | {amount: .price_amount, interval: .recurring_interval}]}'

# Get a specific product by ID (e.g., Team Monthly)
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/products/$POLAR_TEAM_MONTHLY_ID/" | jq

# List only active (non-archived) products
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/products/?is_archived=false" | jq
```

### Checkouts

```bash
# Create a checkout session for Team Monthly plan
curl -sL -X POST \
  -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"products\": [\"$POLAR_TEAM_MONTHLY_ID\"],
    \"success_url\": \"https://moodsync.com/org/test-org/welcome?checkout_id={CHECKOUT_ID}\",
    \"customer_email\": \"test@example.com\",
    \"customer_name\": \"Test User\",
    \"metadata\": {
      \"plan\": \"team\",
      \"billingCycle\": \"monthly\",
      \"clerkOrgId\": \"<org-id>\"
    }
  }" \
  "https://sandbox-api.polar.sh/v1/checkouts/" | jq '{id, url, status}'

# Create a checkout for Pro Annual plan
curl -sL -X POST \
  -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"products\": [\"$POLAR_PRO_ANNUAL_ID\"],
    \"success_url\": \"https://moodsync.com/org/test-org/welcome?checkout_id={CHECKOUT_ID}\",
    \"customer_email\": \"test@example.com\"
  }" \
  "https://sandbox-api.polar.sh/v1/checkouts/" | jq '.url'

# Get a checkout session by ID
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/checkouts/<checkout-id>/" | jq
```

### Orders

```bash
# List all orders
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/orders/" | jq

# List orders with pagination
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/orders/?page=1&limit=20" | jq

# Get a specific order
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/orders/<order-id>/" | jq
```

### Subscriptions

```bash
# List all subscriptions
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/subscriptions/" | jq

# Filter active subscriptions
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/subscriptions/?active=true" | jq

# Get a specific subscription (includes product info and metadata)
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/subscriptions/<subscription-id>/" | jq '{id, status, product: .product.name, metadata, customer_id}'

# Cancel a subscription
curl -sL -X DELETE \
  -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/subscriptions/<subscription-id>/" | jq
```

### Customers

```bash
# List all customers
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/customers/" | jq

# Search customers by email
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/customers/?email=user@example.com" | jq

# Get a specific customer
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/customers/<customer-id>/" | jq
```

### Benefits

```bash
# List all benefits
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/benefits/" | jq

# Get a specific benefit
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/benefits/<benefit-id>/" | jq
```

### Webhooks

```bash
# List webhook endpoints
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/webhooks/endpoints/" | jq

# List webhook deliveries (recent events)
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/webhooks/deliveries/" | jq
```

### Metrics

```bash
# Get metrics overview
curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/metrics/?start_date=2024-01-01&end_date=2026-12-31&interval=month" | jq
```

## Workflow: Debug a Payment Issue

1. Look up the customer:
   ```bash
   curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
     "https://sandbox-api.polar.sh/v1/customers/?email=user@example.com" | jq
   ```

2. Check their subscriptions:
   ```bash
   curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
     "https://sandbox-api.polar.sh/v1/subscriptions/?customer_id=<customer-id>" | jq '.items[] | {id, status, product: .product.name, metadata}'
   ```

3. Check their orders:
   ```bash
   curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
     "https://sandbox-api.polar.sh/v1/orders/?customer_id=<customer-id>" | jq
   ```

4. Review recent webhook deliveries:
   ```bash
   curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
     "https://sandbox-api.polar.sh/v1/webhooks/deliveries/?limit=5" | jq
   ```

5. Cross-reference with Convex org settings:
   ```bash
   npx convex run organization:getOrgSettingsByClerkOrgId '{      "clerkOrgId": "<org-id>"}'
   ```

## Workflow: Create a Test Checkout

1. Decide which tier and billing cycle to test. Available products:

   | Plan | Monthly Env Var | Annual Env Var |
   |------|----------------|----------------|
   | Pro | `POLAR_PRO_MONTHLY_ID` | `POLAR_PRO_ANNUAL_ID` |
   | Team | `POLAR_TEAM_MONTHLY_ID` | `POLAR_TEAM_ANNUAL_ID` |
   | Enterprise | `POLAR_ENTERPRISE_MONTHLY_ID` | `POLAR_ENTERPRISE_ANNUAL_ID` |

2. Verify the product exists:
   ```bash
   curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
     "https://sandbox-api.polar.sh/v1/products/$POLAR_TEAM_MONTHLY_ID/" | jq '{name, prices: [.prices[] | {amount: .price_amount, currency: .price_currency, interval: .recurring_interval}]}'
   ```

3. Create a checkout session:
   ```bash
   curl -sL -X POST \
     -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{
       \"products\": [\"$POLAR_TEAM_MONTHLY_ID\"],
       \"success_url\": \"https://moodsync.com/org/test-org/welcome?checkout_id={CHECKOUT_ID}\",
       \"customer_email\": \"test@example.com\",
       \"customer_name\": \"Test User\",
       \"metadata\": {
         \"plan\": \"team\",
         \"billingCycle\": \"monthly\",
         \"clerkOrgId\": \"test-org-id\"
       }
     }" \
     "https://sandbox-api.polar.sh/v1/checkouts/" | jq '.url'
   ```

4. Open the returned URL to complete the test checkout.

## Workflow: Verify Subscription -> Plan Sync

After a checkout completes, verify the webhook updated the org:

1. Find the subscription:
   ```bash
   curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
     "https://sandbox-api.polar.sh/v1/subscriptions/?active=true" | jq '.items[-1] | {id, status, product: .product.name, metadata}'
   ```

2. Check webhook delivery:
   ```bash
   curl -sL -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
     "https://sandbox-api.polar.sh/v1/webhooks/deliveries/?limit=3" | jq '.items[] | {event_type: .event, success: .success, created_at}'
   ```

3. Verify the Convex org was updated:
   ```bash
   npx convex run organization:getOrgSettingsByClerkOrgId '{"clerkOrgId": "<clerkOrgId-from-metadata>"}'
   # Should show plan: "team" (or whatever tier was purchased)
   ```

## Pagination

All list endpoints support pagination:

```bash
# Page 1, 20 items per page
?page=1&limit=20

# Page 2
?page=2&limit=20
```

Response includes `pagination.total_count` and `pagination.max_page`.

## Switching to Production

Replace the base URL:
- Sandbox: `https://sandbox-api.polar.sh`
- Production: `https://api.polar.sh`

And use the production `POLAR_ACCESS_TOKEN`. Production product IDs are different from sandbox -- get them from Vercel production env vars:
```bash
vercel env pull --environment=production /tmp/prod-env && grep POLAR_ /tmp/prod-env
```

## Checklist

- [ ] Set `POLAR_ACCESS_TOKEN` env var
- [ ] Exported the correct product ID env vars for the tier being tested
- [ ] Used correct base URL (sandbox vs production)
- [ ] Added trailing `/` to API paths (avoids 307 redirects)
- [ ] Piped output through `jq` for readable JSON
- [ ] Used `-sL` flags on curl (silent + follow redirects)
- [ ] Included `Content-Type: application/json` header on POST/PATCH requests
- [ ] Included `clerkOrgId` in checkout metadata for subscription -> org linking
- [ ] Checked rate limits (100/min sandbox, 500/min production)
