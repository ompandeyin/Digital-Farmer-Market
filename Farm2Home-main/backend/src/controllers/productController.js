import Product from '../models/Product.js';
import { paginate, parseSort, buildFilter } from '../utils/helpers.js';
import { mockProducts } from '../mocks/mockData.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const { page, limit, sort } = req.query;
    const { skip, limit: pageLimit } = paginate(page, limit);
    
    // Build filter object from query parameters
    const filter = buildFilter(req.query);

    // Query with filters
    const dbProducts = await Product.find(filter)
      .sort(parseSort(sort) || { createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .populate('farmer', 'fullName farmerDetails');
    
    const totalCount = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: dbProducts,
      pagination: {
        total: totalCount,
        page: parseInt(page) || 1,
        pages: Math.ceil(totalCount / pageLimit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single product
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid product ID format' 
      });
    }

    // Find product and increment views
    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Now get full product with populated data
    const fullProduct = await Product.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate({
      path: 'farmer',
      select: 'fullName email address'
    });

    res.status(200).json({ 
      success: true, 
      data: fullProduct 
    });
  } catch (error) {
    console.error('Get product by ID error:', error.message, error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch product: ' + error.message 
    });
  }
};

// Create product (farmer only)
export const createProduct = async (req, res) => {
  try {
    const { name, description, category, price, quantity, unit, harvest_date, certifications } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Product image is required' });
    }

    // Upload image to Cloudinary
    let imageUrl = 'https://via.placeholder.com/400';
    try {
      const stream = Readable.from(req.file.buffer);

      imageUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'farm2home/products',
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto'
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          }
        );

        stream.pipe(uploadStream);
      });
    } catch (uploadError) {
      console.log('Cloudinary upload error, using placeholder:', uploadError.message);
    }

    const product = await Product.create({
      name,
      description,
      category,
      price: parseFloat(price),
      quantity: parseFloat(quantity),
      unit,
      image: imageUrl,
      harvest_date,
      farmer: req.user._id,
      farmerName: req.user.fullName,
      farmerLocation: `${req.user.address.city}, ${req.user.address.state}`,
      certifications: certifications || []
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check ownership
    if (product.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check ownership
    if (product.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const { skip, limit: pageLimit } = paginate(page, limit);

    const products = await Product.find({ $text: { $search: search } })
      .skip(skip)
      .limit(pageLimit)
      .populate('farmer', 'fullName');

    const totalProducts = await Product.find({ $text: { $search: search } }).countDocuments();

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total: totalProducts,
        page: parseInt(page) || 1,
        pages: Math.ceil(totalProducts / pageLimit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get featured products
export const getFeaturedProducts = async (req, res) => {
  try {
    // First try to get products marked as featured
    let products = await Product.find({ isFeatured: true })
      .limit(4)
      .sort({ createdAt: -1 })
      .populate('farmer', 'fullName');
    
    // If no featured products, get top 4 products by views/rating
    if (products.length === 0) {
      products = await Product.find({ status: 'active' })
        .limit(4)
        .sort({ views: -1, averageRating: -1, createdAt: -1 })
        .populate('farmer', 'fullName');
    }

    // If still no products, get the 4 most recent products
    if (products.length === 0) {
      products = await Product.find()
        .limit(4)
        .sort({ createdAt: -1 })
        .populate('farmer', 'fullName');
    }

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const { category, page, limit } = req.query;
    const { skip, limit: pageLimit } = paginate(page, limit);

    const products = await Product.find({ category })
      .skip(skip)
      .limit(pageLimit)
      .sort({ createdAt: -1 })
      .populate('farmer', 'fullName');

    const totalProducts = await Product.countDocuments({ category });

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total: totalProducts,
        page: parseInt(page) || 1,
        pages: Math.ceil(totalProducts / pageLimit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get products by farmer
export const getProductsByFarmer = async (req, res) => {
  try {
    const { farmerId, page, limit } = req.query;
    const { skip, limit: pageLimit } = paginate(page, limit);

    const products = await Product.find({ farmer: farmerId })
      .skip(skip)
      .limit(pageLimit)
      .sort({ createdAt: -1 });

    const totalProducts = await Product.countDocuments({ farmer: farmerId });

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total: totalProducts,
        page: parseInt(page) || 1,
        pages: Math.ceil(totalProducts / pageLimit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
