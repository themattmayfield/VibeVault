---
name: polar-api
description: >
  Manage Polar payments, products, checkouts, subscriptions, orders, and customers via
  the REST API using curl. Use this skill when the user asks to list products, create a
  checkout session, check subscription status, list orders, manage customers, inspect
  webhook events, or perform any Polar payment-related operations. This project uses
  Polar in sandbox mode for subscriptions and checkout.
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

## When Not to Use

- Modifying application payment code -- edit `app/actions/` files directly
- Better Auth Polar plugin config -- edit `auth.ts` directly
- Convex data operations -- use `convex-ops`

## Prerequisites

**Authentication:** The `POLAR_ACCESS_TOKEN` and `POLAR_PRODUCT_ID` env vars are available in `.env.local`. Source them before running commands:

```bash
export POLAR_ACCESS_TOKEN=$(grep POLAR_ACCESS_TOKEN .env.local | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
export POLAR_PRODUCT_ID=$(grep POLAR_PRODUCT_ID .env.local | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
```

Tokens can be managed at: https://sandbox.polar.sh/dashboard/settings (sandbox) or https://dashboard.polar.sh/settings (production).

**Base URLs:**

| Environment | Base URL |
|-------------|----------|
| Sandbox | `https://sandbox-api.polar.sh` |
| Production | `https://api.polar.sh` |

This project uses **sandbox mode**. All examples below use the sandbox URL.

**Rate limits:** 100 requests/minute (sandbox), 500 requests/minute (production).

## Project Context

### Polar Configuration

- **Mode:** Sandbox (env-driven -- see `POLAR_SERVER` in `.env.local`)
- **Product ID:** Stored in `POLAR_PRODUCT_ID` env var -- always query the API for current product details (name, pricing, etc.)
- **Integration:** Better Auth Polar plugin in `auth.ts`
- **Server actions:** `app/actions/polar.ts` -- `createPolarCheckoutSession`, `getPolarCheckoutSession`, `getPolarCustomer`
- **Webhook handler:** Configured via Better Auth's Polar plugin

### Authentication Header

All requests use:
```
Authorization: Bearer $POLAR_ACCESS_TOKEN
```

## Command Reference

### Products

```bash
# List all products
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/products" | jq

# Get the configured product (uses POLAR_PRODUCT_ID from .env.local)
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/products/$POLAR_PRODUCT_ID" | jq

# List products with pagination
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/products?page=1&limit=10" | jq
```

### Checkouts

```bash
# Create a checkout session (uses POLAR_PRODUCT_ID from .env.local)
curl -s -X POST \
  -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"product_id\": \"$POLAR_PRODUCT_ID\",
    \"success_url\": \"https://moodsync.com/welcome\",
    \"customer_email\": \"test@example.com\"
  }" \
  "https://sandbox-api.polar.sh/v1/checkouts/custom" | jq

# Get a checkout session by ID
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/checkouts/custom/<checkout-id>" | jq
```

### Orders

```bash
# List all orders
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/orders" | jq

# List orders with pagination
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/orders?page=1&limit=20" | jq

# Get a specific order
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/orders/<order-id>" | jq
```

### Subscriptions

```bash
# List all subscriptions
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/subscriptions" | jq

# Filter active subscriptions
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/subscriptions?active=true" | jq

# Get a specific subscription
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/subscriptions/<subscription-id>" | jq

# Cancel a subscription
curl -s -X DELETE \
  -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/subscriptions/<subscription-id>" | jq
```

### Customers

```bash
# List all customers
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/customers" | jq

# Search customers by email
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/customers?email=user@example.com" | jq

# Get a specific customer
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/customers/<customer-id>" | jq
```

### Benefits

```bash
# List all benefits
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/benefits" | jq

# Get a specific benefit
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/benefits/<benefit-id>" | jq
```

### Webhooks

```bash
# List webhook endpoints
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/webhooks/endpoints" | jq

# List webhook deliveries (recent events)
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/webhooks/deliveries" | jq
```

### Metrics

```bash
# Get metrics overview
curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  "https://sandbox-api.polar.sh/v1/metrics?start_date=2024-01-01&end_date=2024-12-31&interval=month" | jq
```

## Workflow: Debug a Payment Issue

1. Look up the customer:
   ```bash
   curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
     "https://sandbox-api.polar.sh/v1/customers?email=user@example.com" | jq
   ```

2. Check their subscriptions:
   ```bash
   curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
     "https://sandbox-api.polar.sh/v1/subscriptions?customer_id=<customer-id>" | jq
   ```

3. Check their orders:
   ```bash
   curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
     "https://sandbox-api.polar.sh/v1/orders?customer_id=<customer-id>" | jq
   ```

4. Review recent webhook deliveries:
   ```bash
   curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
     "https://sandbox-api.polar.sh/v1/webhooks/deliveries?limit=5" | jq
   ```

## Workflow: Create a Test Checkout

1. Verify the product exists:
   ```bash
   curl -s -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
     "https://sandbox-api.polar.sh/v1/products/$POLAR_PRODUCT_ID" | jq '{ name: .name, prices: [.prices[] | { amount: .price_amount, currency: .price_currency, interval: .recurring_interval }] }'
   ```

2. Create a checkout session:
   ```bash
   curl -s -X POST \
     -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{
       \"product_id\": \"$POLAR_PRODUCT_ID\",
       \"success_url\": \"https://moodsync.com/welcome\",
       \"customer_email\": \"test@example.com\"
     }" \
     "https://sandbox-api.polar.sh/v1/checkouts/custom" | jq '.url'
   ```

3. The response includes a `.url` field -- this is the checkout page URL.

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

And use the production `POLAR_ACCESS_TOKEN`.

## Checklist

- [ ] Set `POLAR_ACCESS_TOKEN` env var
- [ ] Used correct base URL (sandbox vs production)
- [ ] Piped output through `jq` for readable JSON
- [ ] Used `-s` (silent) flag on curl to suppress progress bars
- [ ] Included `Content-Type: application/json` header on POST/PATCH requests
- [ ] Checked rate limits (100/min sandbox, 500/min production)
