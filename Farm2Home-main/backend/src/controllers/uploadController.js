import cloudinary from '../config/cloudinary.js'
import { Readable } from 'stream'

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    // Convert buffer to stream for Cloudinary
    const stream = Readable.from(req.file.buffer)

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'farm2home/products',
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto'
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        }
      )

      stream.pipe(uploadStream)
    })

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Image upload failed'
    })
  }
}

// Delete image from Cloudinary
export const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      })
    }

    const result = await cloudinary.uploader.destroy(publicId)

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Image deletion failed'
    })
  }
}
