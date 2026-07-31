'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, ReactNode } from 'react'
import { queryClient } from '@/lib/query-client'

interface ToastMessage {
  id: string
  msg: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

const ToastManager = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.toastSuccess = (msg: string, duration?: number) => {
        const id = Math.random().toString(36).substr(2, 9)
        setToasts(prev => [...prev, { id, msg, type: 'success', duration }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration || 5000)
      }
      window.toastError = (msg: string, duration?: number) => {
        const id = Math.random().toString(36).substr(2, 9)
        setToasts(prev => [...prev, { id, msg, type: 'error', duration }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration || 5000)
      }
      window.toastInfo = (msg: string, duration?: number) => {
        const id = Math.random().toString(36).substr(2, 9)
        setToasts(prev => [...prev, { id, msg, type: 'info', duration }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration || 5000)
      }
      window.toastWarning = (msg: string, duration?: number) => {
        const id = Math.random().toString(36).substr(2, 9)
        setToasts(prev => [...prev, { id, msg, type: 'warning', duration }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration || 5000)
      }
    }
  }, [])

  return (
    <>
      <QueryClientProvider client={queryClient}>
        {children}
        <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-center px-4 py-3 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
                t.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                t.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                t.type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                'bg-yellow-50 text-yellow-800 border border-yellow-200'
              }`}
            >
              <span className="mr-2">
                {t.type === 'success' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {t.type === 'error' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {t.type === 'info' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {t.type === 'warning' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L8.05 3.25C7.282 2.425 5.5 3.08 5.5 4.5v13.5c0 1.42 1.782 2.075 2.55 1.25z" />
                  </svg>
                )}
              </span>
              <p className="text-sm font-medium">{t.msg}</p>
            </div>
          ))}
        </div>
      </QueryClientProvider>
    </>
  )
}

export default function ClientWrapper({ children }: { children: ReactNode }) {
  return <ToastManager>{children}</ToastManager>
}