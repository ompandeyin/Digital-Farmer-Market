import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { userService } from '../services'

const AdminUsers = () => {
  const { user } = useSelector((state) => state.auth)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setLoading(false)
      setError('Not authorized')
      return
    }
    fetchUsers()
  }, [user])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await userService.listUsers()
      setUsers(res.data.data)
      setError('')
    } catch (err) {
      console.error('Failed to list users', err)
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const changeRole = async (u, newRole) => {
    if (!window.confirm(`Change role of ${u.fullName || u.email} to ${newRole}?`)) return
    try {
      setProcessing((p) => ({ ...p, [u._id]: true }))
      await userService.updateUserRole(u._id, { role: newRole })
      // Update UI
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, role: newRole } : x)))
    } catch (err) {
      alert('Failed to change role: ' + (err.response?.data?.message || err.message))
    } finally {
      setProcessing((p) => ({ ...p, [u._id]: false }))
    }
  }

  if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>
  if (error) return <div className="container mx-auto px-4 py-8 text-red-500">{error}</div>

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Users ({users.length})</h1>
      <div className="space-y-4">
        {users.map((u) => (
          <div key={u._id} className="bg-white border rounded p-4 flex justify-between items-center">
            <div>
              <div className="font-semibold">{u.fullName || u.email}</div>
              <div className="text-sm text-gray-600">{u.email}</div>
              <div className="text-xs text-gray-500">Role: <span className="font-semibold">{u.role}</span></div>
            </div>
            <div className="flex gap-2">
              {u.role !== 'admin' ? (
                <button
                  onClick={() => changeRole(u, 'admin')}
                  disabled={processing[u._id]}
                  className={`px-4 py-2 rounded text-white ${processing[u._id] ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
                  {processing[u._id] ? 'Processing...' : 'Promote to Admin'}
                </button>
              ) : (
                <button
                  onClick={() => changeRole(u, 'consumer')}
                  disabled={processing[u._id]}
                  className={`px-4 py-2 rounded text-white ${processing[u._id] ? 'bg-gray-400' : 'bg-yellow-600 hover:bg-yellow-700'}`}>
                  {processing[u._id] ? 'Processing...' : 'Revoke Admin'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

export default AdminUsers
