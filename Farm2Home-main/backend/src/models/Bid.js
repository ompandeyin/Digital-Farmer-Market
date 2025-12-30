import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auction',
      required: [true, 'Auction ID is required']
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Bidder ID is required']
    },
    bidderName: String,
    bidAmount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [0, 'Bid amount cannot be negative']
    },
    isWinningBid: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['active', 'outbid', 'won', 'cancelled'],
      default: 'active'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    deviceInfo: String,
    createdAt: {
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
bidSchema.index({ auction: 1, bidAmount: -1 });
bidSchema.index({ bidder: 1 });
bidSchema.index({ isWinningBid: 1 });
bidSchema.index({ createdAt: -1 });

export default mongoose.model('Bid', bidSchema);
