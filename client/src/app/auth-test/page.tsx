'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState } from 'react'

// Force dynamic rendering for debug pages
export const dynamic = 'force-dynamic'

export default function AuthTestPage() {
  const sessionResult = useSession()
  const { data: session, status } = sessionResult || { data: null, status: 'loading' }
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')

  const handleSignIn = async () => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    
    if (result?.error) {
      alert('Sign in failed: ' + result.error)
    } else {
      alert('Sign in successful!')
    }
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Current Session Status:</h2>
        <p>Status: {status}</p>
        {session ? (
          <div className="bg-green-100 p-3 rounded">
            <p><strong>Signed in as:</strong> {session.user?.email}</p>
            <p><strong>Name:</strong> {session.user?.name}</p>
            <p><strong>Role:</strong> {session.user?.role}</p>
            <button
              onClick={() => signOut()}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="bg-yellow-100 p-3 rounded">
            <p>Not signed in</p>
          </div>
        )}
      </div>

      {!session && (
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">Test Sign In:</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <button
              onClick={handleSignIn}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  )
}



