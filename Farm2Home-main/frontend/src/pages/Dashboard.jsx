import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { userService, walletService } from '../services'
import { useNavigate } from 'react-router-dom'
import { Lock, Wallet, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const [profile, setProfile] = useState(null)
  const [wallet, setWallet] = useState({ balance: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestAmount, setRequestAmount] = useState('')
  const [requestNote, setRequestNote] = useState('')
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    fetchProfile()
    fetchWallet()
  }, [isAuthenticated])

  const fetchProfile = async () => {
    try {
      const res = await userService.getUserProfile()
      setProfile(res.data.data)
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  }

  const fetchWallet = async () => {
    try {
      const res = await walletService.getWallet()
      setWallet(res.data.data || { wallet: { balance: 0 }, transactions: [], requests: [] })
    } catch (err) {
      console.error('Failed to fetch wallet:', err)
      setError(err.response?.data?.message || 'Failed to load wallet')
    } finally {
      setLoading(false)
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
          <p className="text-gray-600 mb-8">You need to be logged in to view your profile.</p>
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

  const walletData = wallet.wallet || wallet
  const transactions = wallet.transactions || []
  const requests = wallet.requests || []

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border rounded p-4">
          <h2 className="font-semibold text-lg mb-2">Account</h2>
          <div className="text-sm text-gray-700 mb-1"><strong>Name:</strong> {profile?.fullName || user?.fullName}</div>
          <div className="text-sm text-gray-700 mb-1"><strong>Email:</strong> {profile?.email || user?.email}</div>
          <div className="text-sm text-gray-700 mb-1"><strong>Phone:</strong> {profile?.phone || user?.phone}</div>
          <div className="text-sm text-gray-700 mt-4">
            {user && user.role === 'admin' ? (
              <button onClick={() => navigate('/admin/dashboard')} className="text-blue-600 underline">Go to Admin Dashboard</button>
            ) : (
              <button onClick={() => navigate('/profile')} className="text-blue-600 underline">Edit profile</button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {user && user.role === 'admin' ? (
            <div className="bg-white border rounded p-4">
              <h2 className="font-semibold text-lg mb-2">Admin Account</h2>
              <p className="text-sm text-gray-600">Admin accounts do not use the wallet. Use the <span className="font-medium">Admin Dashboard</span> for management tasks.</p>
            </div>
          ) : (
            <>
              <div className="bg-white border rounded p-4">
                <h2 className="font-semibold text-lg mb-2">Wallet</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-600">Balance</div>
                    <div className="text-2xl font-bold text-green-600">₹{(walletData.balance || 0).toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <button onClick={() => navigate('/cart')} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Shop</button>
                    <button onClick={() => setShowRequestModal(true)} className="ml-2 text-sm text-blue-600 underline">Request Funds</button>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-medium mb-2">Recent Transactions</h3>
                  {transactions.length === 0 ? (
                    <div className="text-gray-600">No transactions yet</div>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((t) => (
                        <div key={t._id} className="flex justify-between text-sm">
                          <div>
                            <div className="font-semibold">{t.type === 'credit' ? 'Credit' : 'Debit'} • {t.source}</div>
                            <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()}</div>
                          </div>
                          <div className={`font-semibold ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>₹{t.amount}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border rounded p-4">
                <h3 className="font-medium mb-2">Fund Requests</h3>
                {requests.length === 0 ? (
                  <div className="text-gray-600">No fund requests.</div>
                ) : (
                  <div className="space-y-2">
                    {requests.map((r) => (
                      <div key={r._id} className="flex justify-between items-center text-sm">
                        <div>
                          <div className="font-semibold">₹{r.amount}</div>
                          <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="text-sm">{r.status}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Request Funds Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-4">Request Funds</h3>
            <div className="mb-3">
              <label className="text-sm text-gray-600 block mb-1">Amount</label>
              <input type="number" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="mb-3">
              <label className="text-sm text-gray-600 block mb-1">Note (optional)</label>
              <input value={requestNote} onChange={(e) => setRequestNote(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowRequestModal(false)} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={async () => {
                const amt = parseFloat(requestAmount)
                if (!amt || amt <= 0) return alert('Enter a valid amount')
                try {
                  setIsRequesting(true)
                  await walletService.requestFunds({ amount: amt, note: requestNote })
                  alert('Fund request submitted')
                  setShowRequestModal(false)
                  setRequestAmount('')
                  setRequestNote('')
                  fetchWallet()
                } catch (err) {
                  console.error('Request funds failed', err)
                  alert('Failed to submit request: ' + (err.response?.data?.message || err.message))
                } finally {
                  setIsRequesting(false)
                }
              }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">{isRequesting ? 'Submitting...' : 'Submit'}</button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}

export default Dashboard
