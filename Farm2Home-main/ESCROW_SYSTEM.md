# Escrow-Based Auction Settlement System

## Overview

This document describes the secure escrow-based auction settlement mechanism implemented in Farm2Home. The system ensures safe transactions between buyers and farmers through an escrow model.

## Money Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ESCROW MONEY FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  PHASE 1: AUCTION END                PHASE 2: DELIVERY              PHASE 3: COMPLETION
  ────────────────────                ─────────────────              ──────────────────

  ┌──────────┐                        ┌──────────┐                   ┌──────────┐
  │  BUYER   │                        │  ESCROW  │                   │  FARMER  │
  │  WALLET  │                        │ (ADMIN)  │                   │  WALLET  │
  └────┬─────┘                        └────┬─────┘                   └────┬─────┘
       │                                   │                              │
       │  ─₹1000 (Winning Bid)            │                              │
       ├──────────────────────────────────►│                              │
       │                                   │ (Funds Held)                 │
       │                                   │                              │
       │                              [Delivery Confirmed]                │
       │                                   │                              │
       │                                   │  +₹1000 (Payment)            │
       │                                   ├──────────────────────────────►│
       │                                   │                              │
       ▼                                   ▼                              ▼
  ┌──────────┐                        ┌──────────┐                   ┌──────────┐
  │ BALANCE: │                        │ BALANCE: │                   │ BALANCE: │
  │  -₹1000  │                        │    ₹0    │                   │  +₹1000  │
  └──────────┘                        └──────────┘                   └──────────┘
```

## System Architecture

### Phase 1: Live Bidding
- Wallet balance is **validated** but **NOT deducted** during bidding
- Bids must not exceed the bidder's wallet balance
- Socket.io provides real-time bid updates

### Phase 2: Auction End
When an auction ends:
1. Identify the highest bidder (winner)
2. Deduct winning bid amount from buyer's wallet
3. Credit the same amount to escrow (admin wallet)
4. Automatically create an Order linked to the auction
5. Order status: `pending_delivery`
6. Log transactions:
   - Buyer → Debit
   - Escrow → Credit

### Phase 3: Delivery Confirmation
- Buyer can manually confirm delivery
- OR system auto-confirms after X days (configurable, default: 7 days)
- Until confirmation, funds remain locked in escrow

### Phase 4: Payment Release
- After delivery confirmation:
  - Transfer escrow amount to farmer wallet
  - Log transactions:
    - Escrow → Debit
    - Farmer → Credit
  - Update order status to `completed`

### Phase 5: Refund (Failure Cases)
If auction is cancelled, disputed, or delivery fails:
- Refund escrow amount back to buyer wallet
- Log refund transactions
- Idempotency ensures no double refunds

## API Endpoints

### Buyer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/escrow/my-orders` | Get buyer's auction orders |
| POST | `/api/v1/escrow/confirm-delivery/:orderId` | Confirm delivery (releases payment) |

### Farmer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/escrow/farmer-orders` | Get farmer's auction orders |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/escrow/summary` | Get escrow dashboard summary |
| GET | `/api/v1/escrow/orders` | Get all escrow orders |
| GET | `/api/v1/escrow/orders/:orderId` | Get order details |
| POST | `/api/v1/escrow/release-payment/:orderId` | Admin releases payment |
| POST | `/api/v1/escrow/refund/:orderId` | Admin refunds to buyer |
| POST | `/api/v1/escrow/retry-settlement/:auctionId` | Retry failed settlement |
| POST | `/api/v1/escrow/process-auto-confirmations` | Manually trigger auto-confirmations |

> Note: To make the terminology friendlier we are introducing a new non‑breaking alias `/api/v1/settlement/*` that maps to the exact same handlers as the `/api/v1/escrow/*` endpoints. This allows UI and clients to adopt the term **"settlement"** without affecting existing integrations. The `/api/v1/escrow/*` endpoints will be kept for backward compatibility and will be marked for deprecation in a later release.

## Data Models

### Auction Model (New Fields)

```javascript
{
  // ... existing fields ...
  
  // Escrow settlement fields
  settlementStatus: {
    type: String,
    enum: ['pending', 'in_escrow', 'completed', 'refunded', 'failed_insufficient_funds', 'no_winner'],
    default: 'pending'
  },
  settlementDate: Date,
  escrowTransactionId: ObjectId,  // Reference to escrow credit transaction
  orderId: ObjectId,              // Reference to created order
  paymentReleasedAt: Date
}
```

### Order Model (New Fields)

```javascript
{
  // ... existing fields ...
  
  // Auction/Escrow-specific fields
  auctionId: ObjectId,            // Reference to source auction
  isAuctionOrder: Boolean,        // Flag for auction orders
  escrowStatus: {
    type: String,
    enum: ['none', 'held', 'released', 'refunded'],
    default: 'none'
  },
  escrowAmount: Number,           // Amount held in escrow
  autoConfirmDate: Date,          // Date for auto-confirmation
  deliveryConfirmedAt: Date,
  deliveryConfirmedBy: ObjectId,
  paymentReleasedAt: Date,
  refundedAt: Date,
  refundedBy: ObjectId,
  refundReason: String
}
```

## Transaction Types

| Source | Type | Description |
|--------|------|-------------|
| `auction_settlement` | debit | Buyer's wallet debited for winning bid |
| `escrow_received` | credit | Escrow wallet credited |
| `escrow_release` | debit | Escrow wallet debited for payment release |
| `auction_payment` | credit | Farmer's wallet credited |
| `escrow_refund` | debit | Escrow wallet debited for refund |
| `auction_refund` | credit | Buyer's wallet credited for refund |

## Safety Mechanisms

### 1. MongoDB Transactions
All settlement operations use MongoDB transactions for atomicity:
```javascript
const session = await mongoose.startSession()
session.startTransaction()
// ... operations ...
await session.commitTransaction()
```

### 2. Settlement Locking
Prevents race conditions on same auction:
```javascript
const settlementLocks = new Map()
// Lock acquired before settlement
// Released after completion/failure
```

### 3. Idempotency
- Settlement status checked before processing
- Cannot settle already-settled auctions
- Cannot refund already-refunded orders

### 4. Wallet Balance Validation
- Checked during bidding (no deduction)
- Checked again at settlement time
- Settlement fails gracefully if insufficient

## Auto-Confirmation Scheduler

The system runs a background scheduler for auto-confirming deliveries:

### Configuration
```env
AUTO_CONFIRM_DAYS=7                    # Days before auto-confirm
SCHEDULER_INTERVAL_HOURS=6             # How often to check
AUTO_CONFIRM_SCHEDULER_ENABLED=true    # Enable/disable scheduler
```

### Behavior
1. Runs every 6 hours (configurable)
2. Finds orders past their `autoConfirmDate`
3. Automatically confirms delivery and releases payment
4. Logs results for monitoring

## Environment Variables

```env
# Escrow Configuration
ESCROW_ACCOUNT_EMAIL=admin@farm2home.com   # Admin account email
AUTO_CONFIRM_DAYS=7                        # Days before auto-confirm
SCHEDULER_INTERVAL_HOURS=6                 # Scheduler interval
AUTO_CONFIRM_SCHEDULER_ENABLED=true        # Enable scheduler
```

## Flow Diagrams

### Auction End Settlement Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUCTION END SETTLEMENT                               │
└─────────────────────────────────────────────────────────────────────────────┘

  endAuction() called
        │
        ▼
  ┌─────────────┐     No Winner      ┌─────────────┐
  │ Has Winner? ├────────────────────►│   No-op     │
  └──────┬──────┘                     └─────────────┘
         │ Yes
         ▼
  ┌─────────────────────────┐
  │   Acquire Lock          │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐
  │   Start DB Transaction  │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐   Insufficient   ┌──────────────────┐
  │ Check Buyer Balance     ├──────────────────►│ Mark as Failed  │
  └───────────┬─────────────┘                   └──────────────────┘
              │ Sufficient
              ▼
  ┌─────────────────────────┐
  │ Debit Buyer Wallet      │
  │ Credit Escrow Wallet    │
  │ Create Transactions     │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐
  │ Create Auction Order    │
  │ (pending_delivery)      │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐
  │ Update Auction Status   │
  │ (in_escrow)             │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐
  │ Commit Transaction      │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐
  │ Send Notifications      │
  │ Release Lock            │
  └─────────────────────────┘
```

### Delivery Confirmation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DELIVERY CONFIRMATION                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  confirmDelivery() called
        │
        ▼
  ┌─────────────────────────┐
  │ Validate Order Status   │
  │ (must be 'held')        │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐
  │ Check Permission        │
  │ (buyer or admin)        │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐
  │   Start DB Transaction  │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐
  │ Debit Escrow Wallet     │
  │ Credit Farmer Wallet    │
  │ Create Transactions     │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐
  │ Update Order Status     │
  │ (completed, released)   │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐
  │ Commit Transaction      │
  │ Send Notifications      │
  └─────────────────────────┘
```

## Error Handling

### Settlement Failures
- Insufficient balance: Marked as `failed_insufficient_funds`, can be retried
- User not found: Transaction aborted, error logged
- Lock contention: Request rejected, retry later

### Refund Failures
- Already refunded: Idempotency check prevents double refund
- Already released: Cannot refund after farmer paid
- Insufficient escrow: Error logged, manual intervention required

## Testing Checklist

- [ ] Place bid without sufficient balance → Rejected
- [ ] Win auction with sufficient balance → Settlement succeeds
- [ ] Win auction with insufficient balance → Settlement fails gracefully
- [ ] Buyer confirms delivery → Payment released to farmer
- [ ] Auto-confirm after X days → Payment released automatically
- [ ] Admin refunds order → Buyer receives refund
- [ ] Double refund attempt → Rejected (idempotency)
- [ ] Concurrent settlement → Lock prevents race condition
