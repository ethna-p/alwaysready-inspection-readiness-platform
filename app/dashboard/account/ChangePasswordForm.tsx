'use client'

import { useState } from 'react'
import { changePassword } from './actions'

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const result = await changePassword(currentPassword, newPassword, confirmPassword)

    if (result.success) {
      setStatus('success')
      setMessage('Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      setStatus('error')
      setMessage(result.error)
    }
  }

  const inputClass =
    'block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#1a1a1a] placeholder-gray-400 focus:border-[#014D4E] focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-1'

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      <div>
        <label htmlFor="current-password" className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-gray-500">Minimum 8 characters.</p>
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      {message && (
        <div
          role="alert"
          className={`rounded-lg px-4 py-3 text-sm ${
            status === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-[#014D4E] text-white text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-[#013a3b] focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? 'Updating…' : 'Change password'}
      </button>
    </form>
  )
}
