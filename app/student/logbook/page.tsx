'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
// TODO: Import API hooks and UI components for logbook

function LogbookEntryForm({ entry, onSave, onClose }: { entry?: any, onSave: (data: any) => void, onClose: () => void }) {
  const [form, setForm] = useState(entry || {
    date: '',
    aircraft_id: '',
    instructor_id: '',
    total_time: '',
    pic_time: '',
    sic_time: '',
    solo_time: '',
    cross_country_time: '',
    night_time: '',
    instrument_time: '',
    simulator_time: '',
    dual_received: '',
    dual_given: '',
    landings_day: '',
    landings_night: '',
    complex_time: '',
    high_performance_time: '',
    tailwheel_time: '',
    multi_engine_time: '',
    remarks: '',
  });
  const [saving, setSaving] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-lg w-full space-y-4">
        <h2 className="text-xl font-bold mb-2">{entry ? 'Edit' : 'New'} Logbook Entry</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label>Aircraft ID</label>
            <input type="text" name="aircraft_id" value={form.aircraft_id} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label>Instructor ID</label>
            <input type="text" name="instructor_id" value={form.instructor_id} onChange={handleChange} className="input" />
          </div>
          <div>
            <label>Total Time</label>
            <input type="number" name="total_time" value={form.total_time} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label>PIC Time</label>
            <input type="number" name="pic_time" value={form.pic_time} onChange={handleChange} className="input" />
          </div>
          <div>
            <label>SIC Time</label>
            <input type="number" name="sic_time" value={form.sic_time} onChange={handleChange} className="input" />
          </div>
          <div>
            <label>Solo Time</label>
            <input type="number" name="solo_time" value={form.solo_time} onChange={handleChange} className="input" />
          </div>
          <div>
            <label>Cross Country Time</label>
            <input type="number" name="cross_country_time" value={form.cross_country_time} onChange={handleChange} className="input" />
          </div>
          <div>
            <label>Night Time</label>
            <input type="number" name="night_time" value={form.night_time} onChange={handleChange} className="input" />
          </div>
          <div>
            <label>Instrument Time</label>
            <input type="number" name="instrument_time" value={form.instrument_time} onChange={handleChange} className="input" />
          </div>
          <div>
            <label>Simulator Time</label>
            <input type="number" name="simulator_time" value={form.simulator_time} onChange={handleChange} className="input" />
          </div>
          <div>
            <label>Dual Received</label>
            <input type="number" name="dual_received" value={form.dual_received} onChange={handleChange} className="input" />
          </div>
          <div>
            <label>Dual Given</label>
            <input type="number" name="dual_given" value={form.dual_given} onChange={handleChange} className="input" />
          </div>
          <div>
            <label>Landings (Day)</label>
            <input type="number" name="landings_day" value={form.landings_day} onChange={handleChange} className="input" />
          </div>
          <div>
            <label>Landings (Night)</label>
            <input type="number" name="landings_night" value={form.landings_night} onChange={handleChange} className="input" />
          </div>
          <div>
            <label>Complex Time</label>
            <input type="number" name="complex_time" value={form.complex_time} onChange={handleChange} className="input" />
          </div>
          <div>
            <label>High Performance Time</label>
            <input type="number" name="high_performance_time" value={form.high_performance_time} onChange={handleChange} className="input" />
          </div>
          <div>
            <label>Tailwheel Time</label>
            <input type="number" name="tailwheel_time" value={form.tailwheel_time} onChange={handleChange} className="input" />
          </div>
          <div>
            <label>Multi-Engine Time</label>
            <input type="number" name="multi_engine_time" value={form.multi_engine_time} onChange={handleChange} className="input" />
          </div>
        </div>
        <div>
          <label>Remarks</label>
          <textarea name="remarks" value={form.remarks} onChange={handleChange} className="input w-full" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}

async function saveLogbookEntry(form: any, isEdit: boolean) {
  const method = isEdit ? 'PUT' : 'POST';
  const res = await fetch('/api/student/flight-log-entries', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save entry');
  return data;
}

function SignatureModal({ entry, role, onClose, onSigned }: { entry: any, role: 'student' | 'instructor', onClose: () => void, onSigned: () => void }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const res = await fetch('/api/student/flight-log-entries/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_id: entry.id, pin, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok && data.success) {
      setSuccess(true);
      onSigned();
      setTimeout(onClose, 1000);
    } else {
      setError(data.error || 'Invalid PIN or failed to sign.');
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form onSubmit={handleSign} className="bg-white p-6 rounded shadow max-w-xs w-full space-y-4">
        <h2 className="text-lg font-bold">Sign Logbook Entry</h2>
        <div>
          <label>Enter 4-digit PIN</label>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} maxLength={4} minLength={4} pattern="[0-9]{4}" className="input w-full" required />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">Signed!</div>}
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Signing...' : 'Sign'}</button>
        </div>
      </form>
    </div>
  );
}

export default function StudentLogbookPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureEntry, setSignatureEntry] = useState<any>(null);
  const [signatureRole, setSignatureRole] = useState<'student' | 'instructor'>('student');
  const [userRole, setUserRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidEntry, setVoidEntry] = useState<any>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState<string | null>(null);
  const [voidLoading, setVoidLoading] = useState(false);

  useEffect(() => {
    async function fetchEntries() {
      setLoading(true);
      const res = await fetch('/api/student/flight-log-entries');
      const data = await res.json();
      setEntries(data);
      setLoading(false);
    }
    fetchEntries();
  }, []);

  useEffect(() => {
    async function fetchRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('id, roles').eq('id', user.id).single();
      if (profile?.roles?.includes('admin')) setUserRole('admin');
      else if (profile?.roles?.includes('instructor')) setUserRole('instructor');
      else setUserRole('student');
    }
    fetchRole();
  }, []);

  async function handleSave(form: any) {
    setError(null);
    try {
      await saveLogbookEntry(form, !!form.id);
      setShowModal(false);
      setSelectedEntry(null);
      // Refresh entries
      setLoading(true);
      const res = await fetch('/api/student/flight-log-entries');
      const data = await res.json();
      setEntries(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleSigned() {
    // Refresh entries after signing
    setLoading(true);
    const res = await fetch('/api/student/flight-log-entries');
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }

  async function handleVoid() {
    setVoidLoading(true);
    setVoidError(null);
    try {
      const res = await fetch('/api/student/flight-log-entries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: voidEntry.id, void_reason: voidReason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to void entry');
      }
      setShowVoidModal(false);
      setVoidEntry(null);
      setVoidReason('');
      // Refresh entries
      setLoading(true);
      const entriesRes = await fetch('/api/student/flight-log-entries');
      const data = await entriesRes.json();
      setEntries(data);
      setLoading(false);
    } catch (err: any) {
      setVoidError(err.message);
    } finally {
      setVoidLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Flight Logbook</h1>
      <button className="btn btn-primary mb-4" onClick={() => { setSelectedEntry(null); setShowModal(true); }}>New Entry</button>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr>
              <th>Date</th>
              <th>Aircraft</th>
              <th>Total Time</th>
              <th>Status</th>
              <th>Signatures</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry: any) => (
              <tr key={entry.id}>
                <td>{entry.date}</td>
                <td>{entry.aircraft?.tail_number || '-'}</td>
                <td>{entry.total_time}</td>
                <td>{entry.status}</td>
                <td>
                  <span className={entry.student_signed ? 'text-green-600' : 'text-gray-400'}>Student {entry.student_signed ? '✓' : '✗'}</span>
                  <span className="ml-2" />
                  <span className={entry.instructor_signed ? 'text-green-600' : 'text-gray-400'}>Instructor {entry.instructor_signed ? '✓' : '✗'}</span>
                </td>
                <td>
                  <button className="btn btn-xs btn-secondary mr-2" onClick={() => { setSelectedEntry(entry); setShowModal(true); }}>Edit</button>
                  {entry.status === 'draft' && userRole === 'student' && (
                    <button className="btn btn-xs btn-primary" onClick={() => { setSignatureEntry(entry); setSignatureRole('student'); setShowSignatureModal(true); }}>Sign</button>
                  )}
                  {entry.status === 'draft' && userRole === 'instructor' && (
                    <button className="btn btn-xs btn-primary ml-2" onClick={() => { setSignatureEntry(entry); setSignatureRole('instructor'); setShowSignatureModal(true); }}>Instructor Sign</button>
                  )}
                  {userRole === 'admin' && (
                    <button className="btn btn-xs btn-danger ml-2" onClick={() => { setVoidEntry(entry); setShowVoidModal(true); }}>Void</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showModal && (
        <LogbookEntryForm
          entry={selectedEntry}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
      {showSignatureModal && signatureEntry && (
        <SignatureModal
          entry={signatureEntry}
          role={signatureRole}
          onClose={() => setShowSignatureModal(false)}
          onSigned={handleSigned}
        />
      )}
      {showVoidModal && voidEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-xs w-full space-y-4">
            <h2 className="text-lg font-bold">Void Logbook Entry</h2>
            <div>Are you sure you want to void this entry?</div>
            <textarea className="input w-full" placeholder="Reason for voiding" value={voidReason} onChange={e => setVoidReason(e.target.value)} required />
            {voidError && <div className="text-red-600">{voidError}</div>}
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-secondary" onClick={() => setShowVoidModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleVoid} disabled={voidLoading}>{voidLoading ? 'Voiding...' : 'Void'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 