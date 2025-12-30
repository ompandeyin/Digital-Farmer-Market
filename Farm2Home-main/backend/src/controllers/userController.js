import User from '../models/User.js'

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    res.status(200).json({ success: true, data: user })
  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { fullName, phone, bio, profileImage, address } = req.body

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Update allowed fields
    if (fullName) user.fullName = fullName
    if (phone) user.phone = phone
    if (bio !== undefined) user.bio = bio
    if (profileImage) user.profileImage = profileImage
    if (address) user.address = { ...user.address, ...address }

    await user.save()

    // Return updated user without password
    const updatedUser = await User.findById(user._id).select('-password')
    res.status(200).json({ success: true, message: 'Profile updated successfully', data: updatedUser })
  } catch (error) {
    console.error('Update user profile error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// List users (admin only)
export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: users })
  } catch (error) {
    console.error('List users error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update user role (admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['consumer', 'farmer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' })
    }

    const user = await User.findById(id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    user.role = role
    await user.save()

    res.status(200).json({ success: true, message: 'User role updated', data: { _id: user._id, role: user.role } })
  } catch (error) {
    console.error('Update user role error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
