import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
      type: String,
      enum: ['Vegetables', 'Fruits', 'Grains', 'Greens', 'Dairy', 'Other'],
      required: [true, 'Please select a category']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    unit: {
      type: String,
      enum: ['kg', 'liter', 'bunch', 'piece', 'box', 'dozen'],
      required: [true, 'Unit is required']
    },
    image: {
      type: String,
      default: 'https://via.placeholder.com/400'
    },
    images: [
      {
        type: String
      }
    ],
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer ID is required']
    },
    farmerName: String,
    farmerLocation: String,
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
      }
    ],
    harvest_date: {
      type: Date,
      required: [true, 'Harvest date is required']
    },
    expiry_date: Date,
    storage_conditions: {
      temperature: String,
      humidity: String,
      location: String
    },
    certifications: [String],
    tags: [String],
    isFeatured: {
      type: Boolean,
      default: false
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    available_from: {
      type: Date,
      default: Date.now
    },
    views: {
      type: Number,
      default: 0
    },
    purchases: {
      type: Number,
      default: 0
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

// Indexes for faster queries
productSchema.index({ farmer: 1 });
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isAvailable: 1 });

// Update average rating
productSchema.methods.updateRating = async function () {
  const reviews = await mongoose.model('Review').find({ product: this._id });
  if (reviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
  } else {
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    this.ratings.average = sum / reviews.length;
    this.ratings.count = reviews.length;
  }
  await this.save();
};

export default mongoose.model('Product', productSchema);
