/**
 * Escrow-Based Auction Settlement Service
 * 
 * Flow:
 * 1. AUCTION END → Deduct from winner wallet → Credit to escrow (admin wallet)
 * 2. DELIVERY CONFIRMED → Debit escrow → Credit farmer wallet
 * 3. REFUND (if needed) → Debit escrow → Credit buyer wallet
 * 
 * Uses MongoDB transactions for atomicity and prevents race conditions.
 */

import mongoose from 'mongoose'
import User from '../models/User.js'
import Auction from '../models/Auction.js'
import Order from '../models/Order.js'
import Transaction from '../models/Transaction.js'
import Notification from '../models/Notification.js'

// Configuration
const ESCROW_CONFIG = {
  // System/Admin user email that holds escrow funds
  ESCROW_ACCOUNT_EMAIL: process.env.ESCROW_ACCOUNT_EMAIL || 'admin@farm2home.com',
  // Auto-confirm delivery after X days if buyer doesn't confirm
  AUTO_CONFIRM_DAYS: parseInt(process.env.AUTO_CONFIRM_DAYS) || 7,
  // Settlement lock timeout in ms (prevent race conditions)
  SETTLEMENT_LOCK_TIMEOUT: 30000
}

// In-memory lock to prevent concurrent settlements on same auction
const settlementLocks = new Map()

/**
 * Acquire a lock for auction settlement
 */
const acquireLock = async (auctionId) => {
  const lockKey = auctionId.toString()
  
  if (settlementLocks.has(lockKey)) {
    const lock = settlementLocks.get(lockKey)
    if (Date.now() - lock.timestamp < ESCROW_CONFIG.SETTLEMENT_LOCK_TIMEOUT) {
      throw new Error('Settlement already in progress for this auction')
    }
  }
  
  settlementLocks.set(lockKey, { timestamp: Date.now() })
  return true
}

/**
 * Release settlement lock
 */
const releaseLock = (auctionId) => {
  settlementLocks.delete(auctionId.toString())
}

/**
 * Get or create the escrow/admin account
 */
const getEscrowAccount = async () => {
  let escrowAccount = await User.findOne({ 
    $or: [
      { email: ESCROW_CONFIG.ESCROW_ACCOUNT_EMAIL },
      { role: 'admin' }
    ]
  })
  
  if (!escrowAccount) {
    throw new Error('Escrow account (admin) not found. Please ensure an admin account exists.')
  }
  
  // Ensure wallet is initialized
  if (!escrowAccount.wallet) {
    escrowAccount.wallet = { balance: 0, transactions: [] }
    await escrowAccount.save()
  }
  
  return escrowAccount
}

/**
 * PHASE 1: Settle auction at end
 * - Deduct winning bid from buyer's wallet
 * - Credit to escrow (admin wallet)
 * - Create an Order linked to auction
 * 
 * @param {string} auctionId - The auction ID to settle
 * @returns {Object} Settlement result with order and transactions
 */
export const settleAuctionEnd = async (auctionId) => {
  // Acquire lock to prevent race conditions
  await acquireLock(auctionId)
  
  const session = await mongoose.startSession()
  
  try {
    session.startTransaction()
    
    // 1. Fetch auction with session for consistency
    const auction = await Auction.findById(auctionId).session(session)
    
    if (!auction) {
      throw new Error('Auction not found')
    }
    
    // 2. Validate auction state
    if (auction.settlementStatus === 'settled' || auction.settlementStatus === 'in_escrow') {
      throw new Error('Auction has already been settled')
    }
    
    if (!auction.winner && !auction.currentBidder) {
      // No winner - no settlement needed
      auction.settlementStatus = 'no_winner'
      await auction.save({ session })
      await session.commitTransaction()
      return { success: true, message: 'No winner, nothing to settle', auction }
    }
    
    const winnerId = auction.winner || auction.currentBidder
    const winningAmount = auction.winningBidAmount || auction.currentPrice
    
    if (!winningAmount || winningAmount <= 0) {
      throw new Error('Invalid winning amount')
    }
    
    // 3. Fetch buyer (winner)
    const buyer = await User.findById(winnerId).session(session)
    if (!buyer) {
      throw new Error('Winner user not found')
    }
    
    // 4. Validate buyer wallet balance
    const buyerBalance = (buyer.wallet && buyer.wallet.balance) || 0
    if (buyerBalance < winningAmount) {
      // Mark auction as settlement_failed
      auction.settlementStatus = 'failed_insufficient_funds'
      await auction.save({ session })
      await session.commitTransaction()
      
      // Notify buyer
      await Notification.create({
        recipient: winnerId,
        type: 'system',
        title: 'Auction Settlement Failed',
        message: `Insufficient wallet balance (₹${buyerBalance}) for auction "${auction.productName}" (₹${winningAmount}). Please add funds.`,
        relatedEntity: { entityType: 'auction', entityId: auctionId }
      })
      
      throw new Error(`Insufficient buyer wallet balance. Available: ₹${buyerBalance}, Required: ₹${winningAmount}`)
    }
    
    // 5. Fetch escrow account (admin)
    const escrowAccount = await getEscrowAccount()
    
    // 6. Fetch farmer
    const farmer = await User.findById(auction.farmer).session(session)
    if (!farmer) {
      throw new Error('Farmer not found')
    }
    
    // 7. ATOMIC WALLET OPERATIONS
    
    // 7a. Debit buyer wallet
    buyer.wallet.balance -= winningAmount
    
    // 7b. Credit escrow wallet
    if (!escrowAccount.wallet) {
      escrowAccount.wallet = { balance: 0, transactions: [] }
    }
    escrowAccount.wallet.balance += winningAmount
    
    // 8. Create transaction records
    const buyerDebitTx = await Transaction.create([{
      user: buyer._id,
      type: 'debit',
      amount: winningAmount,
      source: 'auction_settlement',
      meta: {
        auctionId: auction._id,
        auctionName: auction.productName,
        description: `Payment for winning auction: ${auction.productName}`
      }
    }], { session })
    
    const escrowCreditTx = await Transaction.create([{
      user: escrowAccount._id,
      type: 'credit',
      amount: winningAmount,
      source: 'escrow_received',
      meta: {
        auctionId: auction._id,
        buyerId: buyer._id,
        buyerName: buyer.fullName,
        farmerId: farmer._id,
        farmerName: farmer.fullName,
        description: `Escrow funds for auction: ${auction.productName}`
      }
    }], { session })
    
    // 9. Update wallet transaction references
    if (!buyer.wallet.transactions) buyer.wallet.transactions = []
    buyer.wallet.transactions.push(buyerDebitTx[0]._id)
    
    if (!escrowAccount.wallet.transactions) escrowAccount.wallet.transactions = []
    escrowAccount.wallet.transactions.push(escrowCreditTx[0]._id)
    
    await buyer.save({ session })
    await escrowAccount.save({ session })
    
    // 10. Create Order for the auction
    const autoConfirmDate = new Date()
    autoConfirmDate.setDate(autoConfirmDate.getDate() + ESCROW_CONFIG.AUTO_CONFIRM_DAYS)
    
    const order = await Order.create([{
      customer: buyer._id,
      customerName: buyer.fullName,
      customerEmail: buyer.email,
      customerPhone: buyer.phone,
      items: [{
        productName: auction.productName,
        productImage: auction.productImage,
        quantity: auction.quantity,
        price: winningAmount,
        unit: auction.unit,
        farmer: farmer._id,
        farmerName: farmer.fullName || auction.farmerName
      }],
      shippingAddress: buyer.address || {},
      subtotal: winningAmount,
      shippingCost: 0,
      tax: 0,
      discount: 0,
      totalAmount: winningAmount,
      paymentMethod: 'wallet',
      paymentStatus: 'completed',
      orderStatus: 'pending_delivery',
      // Auction-specific fields
      auctionId: auction._id,
      isAuctionOrder: true,
      escrowStatus: 'held',
      escrowAmount: winningAmount,
      autoConfirmDate: autoConfirmDate,
      statusUpdates: [{
        status: 'pending_delivery',
        timestamp: new Date(),
        notes: 'Order created from auction win. Awaiting delivery confirmation.'
      }]
    }], { session })
    
    // 11. Update auction with settlement info
    auction.settlementStatus = 'in_escrow'
    auction.escrowTransactionId = escrowCreditTx[0]._id
    auction.orderId = order[0]._id
    auction.settlementDate = new Date()
    await auction.save({ session })
    
    // 12. Commit transaction
    await session.commitTransaction()
    
    // 13. Send notifications (outside transaction)
    try {
      // Notify buyer
      await Notification.create({
        recipient: buyer._id,
        type: 'order_placed',
        title: 'Auction Won - Order Created',
        message: `Your winning bid of ₹${winningAmount} for "${auction.productName}" has been processed. Order #${order[0].orderNumber} created.`,
        relatedEntity: { entityType: 'order', entityId: order[0]._id }
      })
      
      // Notify farmer
      await Notification.create({
        recipient: farmer._id,
        type: 'order_placed',
        title: 'New Auction Order',
        message: `Your auction "${auction.productName}" has been won. Order #${order[0].orderNumber} created. Please prepare for delivery.`,
        relatedEntity: { entityType: 'order', entityId: order[0]._id }
      })
    } catch (notifError) {
      console.error('Notification error (non-critical):', notifError)
    }
    
    console.log(`✅ Auction ${auctionId} settled. Order ${order[0].orderNumber} created. ₹${winningAmount} held in escrow.`)
    
    return {
      success: true,
      message: 'Auction settled successfully',
      data: {
        auction: auction,
        order: order[0],
        buyerTransaction: buyerDebitTx[0],
        escrowTransaction: escrowCreditTx[0],
        escrowAmount: winningAmount
      }
    }
    
  } catch (error) {
    await session.abortTransaction()
    console.error('❌ Auction settlement failed:', error.message)
    throw error
  } finally {
    session.endSession()
    releaseLock(auctionId)
  }
}

/**
 * PHASE 2: Confirm delivery and release payment to farmer
 * 
 * @param {string} orderId - The order ID to confirm
 * @param {string} confirmerId - User confirming (buyer or admin)
 * @param {string} confirmerRole - Role of confirmer
 * @returns {Object} Release result with transactions
 */
export const confirmDeliveryAndRelease = async (orderId, confirmerId, confirmerRole) => {
  const session = await mongoose.startSession()
  
  try {
    session.startTransaction()
    
    // 1. Fetch order
    const order = await Order.findById(orderId).session(session)
    
    if (!order) {
      throw new Error('Order not found')
    }
    
    if (!order.isAuctionOrder) {
      throw new Error('This is not an auction order')
    }
    
    // 2. Validate order state
    if (order.escrowStatus === 'released') {
      throw new Error('Payment has already been released')
    }
    
    if (order.escrowStatus === 'refunded') {
      throw new Error('This order has been refunded')
    }
    
    // 3. Permission check
    const isAdmin = confirmerRole === 'admin'
    const isBuyer = order.customer.toString() === confirmerId.toString()
    
    if (!isAdmin && !isBuyer) {
      throw new Error('Only the buyer or admin can confirm delivery')
    }
    
    // 4. Get accounts
    const escrowAccount = await getEscrowAccount()
    const farmerId = order.items[0]?.farmer
    
    if (!farmerId) {
      throw new Error('Farmer not found in order')
    }
    
    const farmer = await User.findById(farmerId).session(session)
    if (!farmer) {
      throw new Error('Farmer account not found')
    }
    
    const releaseAmount = order.escrowAmount || order.totalAmount
    
    // 5. Validate escrow has funds
    const escrowBalance = (escrowAccount.wallet && escrowAccount.wallet.balance) || 0
    if (escrowBalance < releaseAmount) {
      throw new Error(`Insufficient escrow balance. Available: ₹${escrowBalance}`)
    }
    
    // 6. ATOMIC WALLET OPERATIONS
    
    // 6a. Debit escrow
    escrowAccount.wallet.balance -= releaseAmount
    
    // 6b. Credit farmer
    if (!farmer.wallet) {
      farmer.wallet = { balance: 0, transactions: [] }
    }
    farmer.wallet.balance += releaseAmount
    
    // 7. Create transaction records
    const escrowDebitTx = await Transaction.create([{
      user: escrowAccount._id,
      type: 'debit',
      amount: releaseAmount,
      source: 'escrow_release',
      meta: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        farmerId: farmer._id,
        farmerName: farmer.fullName,
        description: `Payment released for order: ${order.orderNumber}`
      }
    }], { session })
    
    const farmerCreditTx = await Transaction.create([{
      user: farmer._id,
      type: 'credit',
      amount: releaseAmount,
      source: 'auction_payment',
      meta: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        auctionId: order.auctionId,
        description: `Payment received for auction order: ${order.orderNumber}`
      }
    }], { session })
    
    // 8. Update wallet transaction references
    if (!escrowAccount.wallet.transactions) escrowAccount.wallet.transactions = []
    escrowAccount.wallet.transactions.push(escrowDebitTx[0]._id)
    
    if (!farmer.wallet.transactions) farmer.wallet.transactions = []
    farmer.wallet.transactions.push(farmerCreditTx[0]._id)
    
    await escrowAccount.save({ session })
    await farmer.save({ session })
    
    // 9. Update order status
    order.escrowStatus = 'released'
    order.orderStatus = 'completed'
    order.deliveryConfirmedAt = new Date()
    order.deliveryConfirmedBy = confirmerId
    order.paymentReleasedAt = new Date()
    order.statusUpdates.push({
      status: 'completed',
      timestamp: new Date(),
      notes: `Delivery confirmed by ${isAdmin ? 'admin' : 'buyer'}. Payment released to farmer.`
    })
    await order.save({ session })
    
    // 10. Update auction if exists
    if (order.auctionId) {
      const auction = await Auction.findById(order.auctionId).session(session)
      if (auction) {
        auction.settlementStatus = 'completed'
        auction.paymentReleasedAt = new Date()
        await auction.save({ session })
      }
    }
    
    // 11. Commit transaction
    await session.commitTransaction()
    
    // 12. Send notifications
    try {
      await Notification.create({
        recipient: farmer._id,
        type: 'payment_confirmed',
        title: 'Payment Received',
        message: `₹${releaseAmount} has been credited to your wallet for order #${order.orderNumber}`,
        relatedEntity: { entityType: 'order', entityId: order._id }
      })
      
      if (order.customer) {
        await Notification.create({
          recipient: order.customer,
          type: 'order_delivered',
          title: 'Delivery Confirmed',
          message: `Your order #${order.orderNumber} has been marked as delivered.`,
          relatedEntity: { entityType: 'order', entityId: order._id }
        })
      }
    } catch (notifError) {
      console.error('Notification error (non-critical):', notifError)
    }
    
    console.log(`✅ Order ${order.orderNumber} completed. ₹${releaseAmount} released to farmer.`)
    
    return {
      success: true,
      message: 'Delivery confirmed and payment released to farmer',
      data: {
        order,
        escrowTransaction: escrowDebitTx[0],
        farmerTransaction: farmerCreditTx[0],
        releasedAmount: releaseAmount
      }
    }
    
  } catch (error) {
    await session.abortTransaction()
    console.error('❌ Payment release failed:', error.message)
    throw error
  } finally {
    session.endSession()
  }
}

/**
 * PHASE 3: Refund buyer (for cancellations, disputes, delivery failures)
 * 
 * @param {string} orderId - The order ID to refund
 * @param {string} adminId - Admin performing the refund
 * @param {string} reason - Reason for refund
 * @returns {Object} Refund result
 */
export const refundEscrow = async (orderId, adminId, reason = 'Order cancelled') => {
  const session = await mongoose.startSession()
  
  try {
    session.startTransaction()
    
    // 1. Fetch order
    const order = await Order.findById(orderId).session(session)
    
    if (!order) {
      throw new Error('Order not found')
    }
    
    if (!order.isAuctionOrder) {
      throw new Error('This is not an auction order')
    }
    
    // 2. Idempotency check - prevent double refunds
    if (order.escrowStatus === 'refunded') {
      throw new Error('Order has already been refunded')
    }
    
    if (order.escrowStatus === 'released') {
      throw new Error('Payment has already been released to farmer. Cannot refund.')
    }
    
    if (order.escrowStatus !== 'held') {
      throw new Error(`Invalid escrow status for refund: ${order.escrowStatus}`)
    }
    
    // 3. Get accounts
    const escrowAccount = await getEscrowAccount()
    const buyer = await User.findById(order.customer).session(session)
    
    if (!buyer) {
      throw new Error('Buyer account not found')
    }
    
    const refundAmount = order.escrowAmount || order.totalAmount
    
    // 4. Validate escrow has funds
    const escrowBalance = (escrowAccount.wallet && escrowAccount.wallet.balance) || 0
    if (escrowBalance < refundAmount) {
      throw new Error(`Insufficient escrow balance for refund. Available: ₹${escrowBalance}`)
    }
    
    // 5. ATOMIC WALLET OPERATIONS
    
    // 5a. Debit escrow
    escrowAccount.wallet.balance -= refundAmount
    
    // 5b. Credit buyer
    if (!buyer.wallet) {
      buyer.wallet = { balance: 0, transactions: [] }
    }
    buyer.wallet.balance += refundAmount
    
    // 6. Create transaction records
    const escrowDebitTx = await Transaction.create([{
      user: escrowAccount._id,
      type: 'debit',
      amount: refundAmount,
      source: 'escrow_refund',
      meta: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        buyerId: buyer._id,
        reason,
        description: `Refund for order: ${order.orderNumber}`
      }
    }], { session })
    
    const buyerCreditTx = await Transaction.create([{
      user: buyer._id,
      type: 'credit',
      amount: refundAmount,
      source: 'auction_refund',
      meta: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        reason,
        description: `Refund for cancelled order: ${order.orderNumber}`
      }
    }], { session })
    
    // 7. Update wallet transaction references
    if (!escrowAccount.wallet.transactions) escrowAccount.wallet.transactions = []
    escrowAccount.wallet.transactions.push(escrowDebitTx[0]._id)
    
    if (!buyer.wallet.transactions) buyer.wallet.transactions = []
    buyer.wallet.transactions.push(buyerCreditTx[0]._id)
    
    await escrowAccount.save({ session })
    await buyer.save({ session })
    
    // 8. Update order status
    order.escrowStatus = 'refunded'
    order.orderStatus = 'cancelled'
    order.paymentStatus = 'refunded'
    order.refundedAt = new Date()
    order.refundedBy = adminId
    order.refundReason = reason
    order.statusUpdates.push({
      status: 'cancelled',
      timestamp: new Date(),
      notes: `Order refunded. Reason: ${reason}`
    })
    await order.save({ session })
    
    // 9. Update auction if exists
    if (order.auctionId) {
      const auction = await Auction.findById(order.auctionId).session(session)
      if (auction) {
        auction.settlementStatus = 'refunded'
        await auction.save({ session })
      }
    }
    
    // 10. Commit transaction
    await session.commitTransaction()
    
    // 11. Send notifications
    try {
      await Notification.create({
        recipient: buyer._id,
        type: 'payment_confirmed',
        title: 'Refund Processed',
        message: `₹${refundAmount} has been refunded to your wallet for order #${order.orderNumber}. Reason: ${reason}`,
        relatedEntity: { entityType: 'order', entityId: order._id }
      })
      
      // Notify farmer
      const farmerId = order.items[0]?.farmer
      if (farmerId) {
        await Notification.create({
          recipient: farmerId,
          type: 'system',
          title: 'Order Cancelled',
          message: `Order #${order.orderNumber} has been cancelled and refunded. Reason: ${reason}`,
          relatedEntity: { entityType: 'order', entityId: order._id }
        })
      }
    } catch (notifError) {
      console.error('Notification error (non-critical):', notifError)
    }
    
    console.log(`✅ Order ${order.orderNumber} refunded. ₹${refundAmount} returned to buyer.`)
    
    return {
      success: true,
      message: 'Order refunded successfully',
      data: {
        order,
        escrowTransaction: escrowDebitTx[0],
        buyerTransaction: buyerCreditTx[0],
        refundedAmount: refundAmount
      }
    }
    
  } catch (error) {
    await session.abortTransaction()
    console.error('❌ Refund failed:', error.message)
    throw error
  } finally {
    session.endSession()
  }
}

/**
 * Auto-confirm deliveries that have passed their auto-confirm date
 * This should be called by a scheduler/cron job
 */
export const processAutoConfirmations = async () => {
  try {
    const now = new Date()
    
    // Find orders past auto-confirm date that haven't been confirmed
    const overdueOrders = await Order.find({
      isAuctionOrder: true,
      escrowStatus: 'held',
      autoConfirmDate: { $lte: now },
      orderStatus: { $nin: ['completed', 'cancelled'] }
    })
    
    console.log(`📦 Found ${overdueOrders.length} orders for auto-confirmation`)
    
    const results = []
    
    for (const order of overdueOrders) {
      try {
        // Use system/admin as the confirmer
        const escrowAccount = await getEscrowAccount()
        const result = await confirmDeliveryAndRelease(
          order._id,
          escrowAccount._id,
          'admin'
        )
        results.push({ orderId: order._id, orderNumber: order.orderNumber, success: true })
        console.log(`✅ Auto-confirmed order ${order.orderNumber}`)
      } catch (error) {
        results.push({ orderId: order._id, orderNumber: order.orderNumber, success: false, error: error.message })
        console.error(`❌ Failed to auto-confirm order ${order.orderNumber}:`, error.message)
      }
    }
    
    return results
    
  } catch (error) {
    console.error('Auto-confirmation processing failed:', error)
    throw error
  }
}

/**
 * Get escrow summary for admin dashboard
 */
export const getEscrowSummary = async () => {
  try {
    const escrowAccount = await getEscrowAccount()
    
    const pendingOrders = await Order.find({
      isAuctionOrder: true,
      escrowStatus: 'held'
    }).select('orderNumber totalAmount escrowAmount autoConfirmDate customer')
    .populate('customer', 'fullName email')
    
    const completedOrders = await Order.countDocuments({
      isAuctionOrder: true,
      escrowStatus: 'released'
    })
    
    const refundedOrders = await Order.countDocuments({
      isAuctionOrder: true,
      escrowStatus: 'refunded'
    })
    
    // Calculate total held in escrow
    const totalHeld = pendingOrders.reduce((sum, order) => {
      return sum + (order.escrowAmount || order.totalAmount || 0)
    }, 0)
    
    return {
      escrowBalance: escrowAccount.wallet?.balance || 0,
      totalHeldInEscrow: totalHeld,
      pendingOrders: pendingOrders.length,
      completedOrders,
      refundedOrders,
      orders: pendingOrders
    }
    
  } catch (error) {
    console.error('Failed to get escrow summary:', error)
    throw error
  }
}

export default {
  settleAuctionEnd,
  confirmDeliveryAndRelease,
  refundEscrow,
  processAutoConfirmations,
  getEscrowSummary,
  ESCROW_CONFIG
}
