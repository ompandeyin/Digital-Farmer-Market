import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required']
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer ID is required']
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer ID is required']
    },
    reviewerName: String,
    reviewerImage: String,
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating cannot be less than 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    title: {
      type: String,
      required: [true, 'Review title is required'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    content: {
      type: String,
      required: [true, 'Review content is required'],
      minlength: [10, 'Review must be at least 10 characters'],
      maxlength: [1000, 'Review cannot exceed 1000 characters']
    },
    images: [String],
    helpfulCount: {
      type: Number,
      default: 0
    },
    unhelpfulCount: {
      type: Number,
      default: 0
    },
    farmerResponse: {
      text: String,
      respondedAt: Date
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved'
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
reviewSchema.index({ product: 1 });
reviewSchema.index({ farmer: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });

export default mongoose.model('Review', reviewSchema);
