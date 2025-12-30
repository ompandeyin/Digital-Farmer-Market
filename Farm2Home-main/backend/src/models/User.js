import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    phone: {
      type: String,
      required: [true, 'Please provide your phone number'],
      match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Please provide a valid phone number']
    },
    role: {
      type: String,
      enum: ['consumer', 'farmer', 'admin'],
      default: 'consumer'
    },
    profileImage: {
      type: String,
      default: 'https://via.placeholder.com/200?text=User'
    },
    bio: {
      type: String,
      maxlength: 500
    },
    address: {
      street: String,
      city: {
        type: String,
        required: [true, 'City is required']
      },
      state: {
        type: String,
        required: [true, 'State is required']
      },
      pincode: {
        type: String,
        required: [true, 'Pincode is required']
      },
      country: {
        type: String,
        default: 'India'
      }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    farmerDetails: {
      farmName: String,
      farmSize: String,
      cropTypes: [String],
      yearsOfExperience: Number,
      certifications: [String],
      verified: {
        type: Boolean,
        default: false
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
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
    totalSales: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    wallet: {
      balance: {
        type: Number,
        default: 0
      },
      transactions: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Transaction'
        }
      ]
    },
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true
      },
      smsNotifications: {
        type: Boolean,
        default: false
      },
      orderUpdates: {
        type: Boolean,
        default: true
      },
      promotionalEmails: {
        type: Boolean,
        default: false
      }
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: Date,
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

// Index for location-based queries
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  return userObject;
};

export default mongoose.model('User', userSchema);
