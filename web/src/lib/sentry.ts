/**
 * Sentry error tracking (optional).
 * To enable: add VITE_SENTRY_DSN to web/.env.local
 * Free tier at sentry.io — 5,000 errors/month
 */

const SENTRY_DSN = (import.meta as any).env?.VITE_SENTRY_DSN as string | undefined

export function initSentry(): void {
  if (!SENTRY_DSN) {
    console.info('[Sentry] Disabled — add VITE_SENTRY_DSN to .env.local to enable')
    return
  }
  import('@sentry/react').then(Sentry => {
    Sentry.init({
      dsn:                       SENTRY_DSN,
      environment:               (import.meta as any).env?.MODE ?? 'production',
      tracesSampleRate:          0.1,
      replaysSessionSampleRate:  0,
      integrations:              [],
    })
    console.info('[Sentry] Initialized')
  }).catch(() => {
    console.warn('[Sentry] @sentry/react not installed — run: npm install @sentry/react')
  })
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!SENTRY_DSN) return
  import('@sentry/react').then(Sentry => {
    Sentry.withScope(scope => {
      if (context) Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v))
      Sentry.captureException(error)
    })
  }).catch(() => {})
}

export function setSentryUser(id: string, email: string, role: string): void {
  if (!SENTRY_DSN) return
  import('@sentry/react').then(Sentry => {
    Sentry.setUser({ id, email, username: role })
  }).catch(() => {})
}
