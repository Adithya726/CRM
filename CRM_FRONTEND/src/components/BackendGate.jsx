import { useCallback, useEffect, useState } from 'react'
import BackendDisconnected from './BackendDisconnected.jsx'

const isElectron =
  typeof window !== 'undefined' && window.electronAPI?.isElectron

/**
 * Desktop-only gate: blocks CRM UI until the Spring Boot API is healthy.
 * Shows splash-style loading in-app and a disconnected screen on failure.
 */
export default function BackendGate({ children }) {
  const [phase, setPhase] = useState(isElectron ? 'loading' : 'ready')
  const [startup, setStartup] = useState(null)
  const [retrying, setRetrying] = useState(false)
  const [logsPath, setLogsPath] = useState('')

  const syncStatus = useCallback(async () => {
    if (!isElectron) return

    const [startupInfo, appInfo, backendStatus] = await Promise.all([
      window.electronAPI.getBackendStartup(),
      window.electronAPI.getAppInfo(),
      window.electronAPI.getBackendStatus(),
    ])

    setStartup(startupInfo)
    setLogsPath(appInfo?.logsPath || '')

    if (backendStatus?.healthy || startupInfo?.ok) {
      setPhase('ready')
      return
    }

    if (startupInfo?.ok === false || backendStatus?.status === 'failed') {
      setPhase('error')
      return
    }

    setPhase('loading')
  }, [])

  useEffect(() => {
    if (!isElectron) return undefined

    syncStatus()

    const unsubscribe = window.electronAPI.onBackendStatus((payload) => {
      if (payload.status === 'ready' || payload.startup?.ok) {
        setPhase('ready')
      } else if (payload.status === 'failed') {
        setPhase('error')
        setStartup((prev) => ({
          ...prev,
          ok: false,
          reason: payload.reason || prev?.reason,
          message: payload.message || prev?.message,
        }))
      } else if (payload.status === 'starting') {
        setPhase('loading')
      }
    })

    const poll = setInterval(syncStatus, 4000)
    return () => {
      unsubscribe?.()
      clearInterval(poll)
    }
  }, [syncStatus])

  const handleRetry = async () => {
    if (!isElectron) return
    setRetrying(true)
    setPhase('loading')
    try {
      const result = await window.electronAPI.restartBackend()
      setStartup(result)
      setPhase(result?.ok ? 'ready' : 'error')
    } finally {
      setRetrying(false)
    }
  }

  if (!isElectron) {
    return children
  }

  if (phase === 'loading') {
    return (
      <div className="backendGateLoading">
        <div className="backendGateLoading__spinner" role="status" aria-label="Loading" />
        <p>Connecting to API server…</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <BackendDisconnected
        reason={startup?.reason || startup?.lastError}
        message={startup?.message}
        onRetry={handleRetry}
        retrying={retrying}
        logsPath={logsPath}
      />
    )
  }

  return children
}
