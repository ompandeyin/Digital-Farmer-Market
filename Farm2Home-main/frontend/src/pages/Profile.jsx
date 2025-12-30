import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { userService } from '../services'
import { updateUser } from '../redux/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'

const Profile = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ fullName: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    fetchProfile()
  }, [isAuthenticated])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await userService.getUserProfile()
      const data = res.data.data
      setForm({ fullName: data.fullName || '', phone: data.phone || '' })
      setError('')
    } catch (err) {
      console.error('Failed to fetch profile', err)
      setError(err.response?.data?.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const res = await userService.updateUserProfile(form)
      // Update redux
      dispatch(updateUser(res.data.data))
      alert('Profile updated')
      navigate('/dashboard')
    } catch (err) {
      console.error('Update failed', err)
      alert('Failed to update profile: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h1>
          <p className="text-gray-600 mb-8">You need to be logged in to edit your profile.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition font-medium"
          >
            Go to Login
          </button>
        </div>
      </main>
    )
  }

  if (loading) return <div className="container mx-auto px-4 py-8">Loading profile...</div>
  if (error) return <div className="container mx-auto px-4 py-8 text-red-500">{error}</div>

  // Disable profile editing for admin accounts
  if (user && user.role === 'admin') {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="bg-white border rounded p-6 max-w-md mx-auto text-center">
          <h2 className="text-lg font-semibold mb-2">Admin Profile Disabled</h2>
          <p className="text-sm text-gray-600 mb-4">Admin accounts do not use the user profile editor. Use the Admin Dashboard for management tasks.</p>
          <div className="flex justify-center gap-2">
            <button onClick={() => navigate('/admin/dashboard')} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Go to Admin Dashboard</button>
            <button onClick={() => navigate('/')} className="px-4 py-2 rounded border">Home</button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      <form onSubmit={handleSave} className="bg-white border rounded p-6 max-w-md">
        <label className="block mb-3">
          <div className="text-sm text-gray-600 mb-1">Full name</div>
          <input name="fullName" value={form.fullName} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
        </label>

        <label className="block mb-3">
          <div className="text-sm text-gray-600 mb-1">Phone</div>
          <input name="phone" value={form.phone} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
        </label>

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard')} className="px-4 py-2 rounded border">Cancel</button>
        </div>
      </form>
    </main>
  )
}

export default Profile
