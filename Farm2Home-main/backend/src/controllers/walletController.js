import User from '../models/User.js'
import FundRequest from '../models/FundRequest.js'
import Transaction from '../models/Transaction.js'

// Get wallet info and user's fund requests
export const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const requests = await FundRequest.find({ user: req.user._id }).sort({ createdAt: -1 })
  // Also return recent transactions for the user's wallet
  const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20)

  res.status(200).json({ success: true, data: { wallet: user.wallet, requests, transactions } })
  } catch (error) {
    console.error('Get wallet error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// User requests money to be added to wallet
export const requestFunds = async (req, res) => {
  try {
    const { amount, note } = req.body
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' })
    }

    const fr = await FundRequest.create({ user: req.user._id, amount, note })

    res.status(201).json({ success: true, message: 'Fund request submitted', data: fr })
  } catch (error) {
    console.error('Request funds error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: list fund requests
export const listFundRequests = async (req, res) => {
  try {
    const { status } = req.query
    const q = {}
    if (status) q.status = status

    const requests = await FundRequest.find(q).populate('user', 'fullName email').sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: requests })
  } catch (error) {
    console.error('List fund requests error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: approve a fund request
export const approveFundRequest = async (req, res) => {
  try {
    const { id } = req.params

    const request = await FundRequest.findById(id)
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' })
    }

    // Update request
    request.status = 'approved'
    request.approvedBy = req.user._id
    request.approvedAt = new Date()
    await request.save()

    // Credit user's wallet
    const user = await User.findById(request.user)
    user.wallet = user.wallet || { balance: 0, transactions: [] }
    user.wallet.balance = (user.wallet.balance || 0) + request.amount
    await user.save()

    // Create transaction
    const tx = await Transaction.create({ user: user._id, type: 'credit', amount: request.amount, source: 'admin_approval', meta: { requestId: request._id } })

    // Push transaction ref if transactions array exists
    if (user.wallet.transactions && Array.isArray(user.wallet.transactions)) {
      user.wallet.transactions.push(tx._id)
      await user.save()
    }

    res.status(200).json({ success: true, message: 'Request approved and wallet credited', data: { request, transaction: tx } })
  } catch (error) {
    console.error('Approve fund request error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: reject a fund request
export const rejectFundRequest = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const request = await FundRequest.findById(id)
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' })
    }

    // Update request status
    request.status = 'rejected'
    request.rejectedBy = req.user._id
    request.rejectedAt = new Date()
    request.note = reason || 'Rejected by admin'
    await request.save()

    res.status(200).json({ 
      success: true, 
      message: 'Fund request rejected', 
      data: request 
    })
  } catch (error) {
    console.error('Reject fund request error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get wallet balance only (for quick checks)
export const getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet.balance')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    res.status(200).json({ 
      success: true, 
      data: { 
        balance: user.wallet?.balance || 0 
      } 
    })
  } catch (error) {
    console.error('Get wallet balance error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
