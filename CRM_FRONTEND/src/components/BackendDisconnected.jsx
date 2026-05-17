import { AlertCircle, RefreshCw } from 'lucide-react'

const REASON_MESSAGES = {
  jar_not_found:
    'The API server package is missing. Reinstall CRM Desktop or contact support.',
  java_not_found:
    'The application runtime is missing. Reinstall CRM Desktop to restore the bundled Java runtime.',
  port_in_use:
    'Port 5771 is already in use. Close other CRM instances and try again.',
  timeout:
    'The API server did not start in time. Check logs in your app data folder and retry.',
  process_exited:
    'The API server stopped unexpectedly. Check backend.log in your app data folder.',
  db_invalid:
    'The local database could not be opened. Restore a backup from the backups folder or contact support.',
}

export default function BackendDisconnected({
  reason,
  message,
  onRetry,
  retrying,
  logsPath,
}) {
  const detail = message || REASON_MESSAGES[reason] || 'Unable to connect to the local API server.'

  return (
    <div className="backendDisconnected">
      <div className="backendDisconnected__card">
        <div className="backendDisconnected__icon" aria-hidden>
          <AlertCircle size={40} strokeWidth={1.75} />
        </div>
        <h1>API server unavailable</h1>
        <p className="backendDisconnected__detail">{detail}</p>
        {reason && (
          <p className="backendDisconnected__code">
            Error code: <code>{reason}</code>
          </p>
        )}
        <button
          type="button"
          className="backendDisconnected__retry"
          onClick={onRetry}
          disabled={retrying}
        >
          <RefreshCw size={18} className={retrying ? 'backendDisconnected__spin' : ''} />
          {retrying ? 'Starting API server…' : 'Retry connection'}
        </button>
        {logsPath && (
          <p className="backendDisconnected__logs">
            Logs: <code>{logsPath}</code>
          </p>
        )}
      </div>
    </div>
  )
}
