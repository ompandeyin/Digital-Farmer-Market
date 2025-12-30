import mongoose from 'mongoose';

const auctionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    productImage: String,
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer ID is required']
    },
    farmerName: String,
    startingPrice: {
      type: Number,
      required: [true, 'Starting price is required'],
      min: [0, 'Starting price cannot be negative']
    },
    currentPrice: {
      type: Number,
      required: [true, 'Current price is required']
    },
    minBidIncrement: {
      type: Number,
      default: 10,
      min: [1, 'Minimum bid increment must be at least 1']
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended', 'cancelled'],
      default: 'scheduled'
    },
    currentBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    currentBidderName: String,
    bids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid'
      }
    ],
    totalBids: {
      type: Number,
      default: 0
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    winningBidAmount: Number,
    winningTime: Date,
    // Escrow settlement fields
    settlementStatus: {
      type: String,
      enum: ['pending', 'in_escrow', 'completed', 'refunded', 'failed_insufficient_funds', 'no_winner'],
      default: 'pending'
    },
    settlementDate: Date,
    escrowTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    paymentReleasedAt: Date,
    description: String,
    quantity: {
      type: Number,
      required: [true, 'Quantity is required']
    },
    unit: {
      type: String,
      enum: ['kg', 'liter', 'bunch', 'piece', 'box', 'dozen']
    },
    socketRoomId: String,
    isLive: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    index: true
  }
);

// Indexes
auctionSchema.index({ farmer: 1 });
auctionSchema.index({ status: 1 });
auctionSchema.index({ startTime: 1 });
auctionSchema.index({ endTime: 1 });
auctionSchema.index({ product: 1 });
auctionSchema.index({ createdAt: -1 });

export default mongoose.model('Auction', auctionSchema);
