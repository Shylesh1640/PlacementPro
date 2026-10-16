export function cn(...classes: (string | number | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getReadinessColor(status: string): string {
  switch (status) {
    case 'placement_ready': return 'text-success'
    case 'needs_improvement': return 'text-warning'
    case 'at_risk': return 'text-danger'
    default: return 'text-muted'
  }
}

export function getReadinessLabel(status: string): string {
  switch (status) {
    case 'placement_ready': return 'Ready for Placement'
    case 'needs_improvement': return 'Needs Improvement'
    case 'at_risk': return 'At Risk'
    default: return 'Not Assessed'
  }
}

export function getMatchColor(pct: number): string {
  if (pct >= 90) return 'text-success'
  if (pct >= 75) return 'text-info'
  if (pct >= 60) return 'text-warning'
  return 'text-danger'
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
