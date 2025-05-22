"use client"

import { useState } from "react"

export function ManageSessionRequests({ requests: initialRequests = [] }: { requests: any[] }) {
  const [requests, setRequests] = useState(initialRequests)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function handleAction(id: string, action: "approve" | "deny" | "cancel") {
    setLoadingId(id)
    setError("")
    let endpoint = `/api/instructor/schedule/${id}/approve`
    let body: any = {}
    if (action === "approve") body.request_status = "approved"
    if (action === "deny") body.request_status = "denied"
    if (action === "cancel") {
      endpoint = `/api/instructor/schedule/${id}/cancel`
      body = {}
    }
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: Object.keys(body).length ? JSON.stringify(body) : undefined
    })
    if (res.ok) {
      setRequests((reqs) => reqs.filter((r) => r.id !== id))
    } else {
      const data = await res.json()
      setError(data.error || "Unknown error")
    }
    setLoadingId(null)
  }

  if (!requests.length) return <div>No pending session requests.</div>

  return (
    <div className="space-y-6">
      {requests.map((req) => (
        <div key={req.id} className="border rounded p-4 flex flex-col gap-2 bg-white shadow">
          <div><b>Student:</b> {req.student ? `${req.student.first_name} ${req.student.last_name}` : req.enrollment_id}</div>
          <div><b>Lesson:</b> {req.lesson ? req.lesson.title : req.lesson_id}</div>
          <div><b>Aircraft:</b> {req.aircraft ? `${req.aircraft.tail_number} (${req.aircraft.make} ${req.aircraft.model})` : req.aircraft_id}</div>
          <div><b>Date:</b> {req.date} <b>Time:</b> {req.start_time} - {req.end_time}</div>
          <div><b>Type:</b> {req.session_type}</div>
          <div><b>Notes:</b> {req.notes}</div>
          <div className="flex gap-2 mt-2">
            <button disabled={loadingId === req.id} onClick={() => handleAction(req.id, "approve")} className="btn btn-success">Approve</button>
            <button disabled={loadingId === req.id} onClick={() => handleAction(req.id, "deny")} className="btn btn-warning">Deny</button>
            <button disabled={loadingId === req.id} onClick={() => handleAction(req.id, "cancel")} className="btn btn-danger">Cancel</button>
          </div>
        </div>
      ))}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  )
} 