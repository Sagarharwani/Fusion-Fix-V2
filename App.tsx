import React, { useEffect, useMemo, useState } from "react"

type RefLink = { kind: string; url?: string; mosDocId?: string }
type Item = {
  id: string
  title: string
  module: string
  severity: string
}

export default function App() {
  const [data, setData] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/solutions.json")
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((rows: Item[]) => setData(rows))
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading…</div>
  if (error)   return <div>Failed to load: {error}</div>

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Fusion Finance Fixes</h1>
      <ul>
        {data.slice(0, 20).map(d => (
          <li key={d.id}>{d.title} ({d.module}, {d.severity})</li>
        ))}
      </ul>
    </div>
  )
}