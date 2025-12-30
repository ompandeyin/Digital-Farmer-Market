import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { walletService } from '../services'
import { useNavigate } from 'react-router-dom'

const AdminRequests = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState({})

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      // Not an admin — redirect or show error
      setLoading(false)
      setError('Not authorized to view this page')
      return
    }

    fetchRequests()
  }, [user])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await walletService.listRequests({ status: 'pending' })
      setRequests(res.data.data)
      setError('')
    } catch (err) {
      console.error('Error fetching fund requests:', err)
      setError(err.response?.data?.message || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this fund request and credit the user?')) return
    try {
      setProcessing((p) => ({ ...p, [id]: true }))
      await walletService.approveRequest(id)
      // Remove or update request in UI
      setRequests((prev) => prev.filter((r) => r._id !== id))
    } catch (err) {
      alert('Failed to approve request: ' + (err.response?.data?.message || err.message))
    } finally {
      setProcessing((p) => ({ ...p, [id]: false }))
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Fund Requests</h1>

      {requests.length === 0 ? (
        <div className="text-gray-600">No pending requests.</div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r._id} className="bg-white border rounded p-4 flex justify-between items-center">
              <div>
                <div className="font-semibold">{r.user?.fullName || r.user?.email || 'User'}</div>
                <div className="text-sm text-gray-600">Amount: ₹{r.amount}</div>
                <div className="text-xs text-gray-500">Requested: {new Date(r.createdAt).toLocaleString()}</div>
                {r.note && <div className="text-sm mt-1">Note: {r.note}</div>}
              </div>

              <div className="flex gap-2 items-center">
                <button
                  onClick={() => handleApprove(r._id)}
                  disabled={processing[r._id]}
                  className={`px-4 py-2 rounded text-white ${processing[r._id] ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
                  {processing[r._id] ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => { if (window.confirm('Reject this request?')) { /* TODO: implement reject endpoint later */ alert('Request rejected locally'); setRequests(prev => prev.filter(x => x._id !== r._id)) } }}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

export default AdminRequests
