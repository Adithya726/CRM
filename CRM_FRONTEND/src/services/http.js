export function getApiErrorMessage(err) {
  const msg =
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    (typeof err?.response?.data === 'string' ? err.response.data : null) ??
    err?.message ??
    'Request failed'

  return msg
}

