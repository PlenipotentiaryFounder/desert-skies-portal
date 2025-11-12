'use client';
import React, { useEffect, useState, useRef } from 'react';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, ChevronDown, ChevronUp, Edit, Trash2, CheckCircle, Loader2, Plus, Download, Printer, Paperclip } from 'lucide-react';
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const DESERT_SKIES_COLORS = {
  primary: 'bg-sky-500',
  accent: 'bg-yellow-400',
  surface: 'bg-white/60 dark:bg-zinc-900/60',
  border: 'border-zinc-200 dark:border-zinc-800',
  navy: 'bg-blue-900',
};

function AviationFAB({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, boxShadow: '0 0 16px #38bdf8' }}
      className="fixed bottom-6 right-6 z-50 md:hidden rounded-full shadow-2xl bg-sky-500 text-white p-4 flex items-center justify-center hover:bg-sky-600 transition-colors"
      aria-label="Add Logbook Entry"
      onClick={onClick}
    >
      <Plus className="h-7 w-7" />
    </motion.button>
  );
}

function AviationSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-10 rounded-xl bg-gradient-to-r from-sky-100 via-white to-sky-100 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800" />
      ))}
    </div>
  );
}

function AviationToast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-xl bg-sky-500 text-white flex items-center gap-2"
    >
      <CheckCircle className="h-5 w-5" />
      {message}
    </motion.div>
  );
}

function AviationLogbookRow({ entry, expanded, onExpand, onEdit, onSign, onVoid, userRole }: any) {
  return (
    <>
      <motion.tr
        layout
        initial={false}
        className={`transition-all cursor-pointer hover:shadow-lg hover:bg-sky-50 dark:hover:bg-blue-900/30 ${expanded ? 'bg-sky-100/60 dark:bg-blue-900/40' : ''}`}
        onClick={onExpand}
      >
        <td className="font-semibold">{entry.date}</td>
        <td className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-sky-500" />
          {entry.aircraft?.tail_number || '-'}
        </td>
        <td>{entry.total_time}</td>
        <td>{entry.status}</td>
        <td>
          <span className={entry.student_signed ? 'text-green-600' : 'text-aviation-sunset-300'}>Student {entry.student_signed ? '✓' : '✗'}</span>
          <span className="ml-2" />
          <span className={entry.instructor_signed ? 'text-green-600' : 'text-aviation-sunset-300'}>Instructor {entry.instructor_signed ? '✓' : '✗'}</span>
        </td>
        <td className="flex gap-2">
          <button className="btn btn-xs btn-secondary" onClick={e => { e.stopPropagation(); onEdit(entry); }}><Edit className="h-4 w-4" /></button>
          {entry.status === 'draft' && userRole === 'student' && (
            <button className="btn btn-xs btn-primary" onClick={e => { e.stopPropagation(); onSign(entry, 'student'); }}>Sign</button>
          )}
          {entry.status === 'draft' && userRole === 'instructor' && (
            <button className="btn btn-xs btn-primary ml-2" onClick={e => { e.stopPropagation(); onSign(entry, 'instructor'); }}>Instructor Sign</button>
          )}
          {userRole === 'admin' && (
            <button className="btn btn-xs btn-danger ml-2" onClick={e => { e.stopPropagation(); onVoid(entry); }}><Trash2 className="h-4 w-4" /></button>
          )}
          <button className="ml-2" aria-label="Expand row">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </td>
      </motion.tr>
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-sky-50/60 dark:bg-blue-900/30"
          >
            <td colSpan={6} className="p-4 border-t border-sky-200 dark:border-blue-800">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="font-bold text-sky-700 dark:text-yellow-300 mb-1">Remarks</div>
                  <div className="text-sm text-aviation-sunset-200">{entry.remarks || <span className="italic text-aviation-sunset-300">No remarks</span>}</div>
                  {entry.attachment_url && (
                    <div className="mt-3 flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-sky-500" aria-hidden="true" />
                      <a
                        href={entry.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-sky-700 dark:text-yellow-300 hover:text-sky-900 dark:hover:text-yellow-400 text-sm font-medium"
                        aria-label={`Download attachment for logbook entry on ${entry.date}`}
                      >
                        {entry.attachment_url.split('/').pop()}
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="font-bold text-sky-700 dark:text-yellow-300 mb-1">Flight Details</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Tooltip>
                      <span tabIndex={0} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded cursor-help">PIC</span>
                      <span className="sr-only">PIC: Pilot in Command</span>
                    </Tooltip>: <span className="font-semibold">{entry.pic_time || 0}</span>
                    <Tooltip>
                      <span tabIndex={0} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded cursor-help">SIC</span>
                      <span className="sr-only">SIC: Second in Command</span>
                    </Tooltip>: <span className="font-semibold">{entry.sic_time || 0}</span>
                    <Tooltip>
                      <span tabIndex={0} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded cursor-help">Solo</span>
                      <span className="sr-only">Solo: Solo Flight Time</span>
                    </Tooltip>: <span className="font-semibold">{entry.solo_time || 0}</span>
                    <Tooltip>
                      <span tabIndex={0} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded cursor-help">Night</span>
                      <span className="sr-only">Night: Night Flight Time</span>
                    </Tooltip>: <span className="font-semibold">{entry.night_time || 0}</span>
                    <Tooltip>
                      <span tabIndex={0} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded cursor-help">Instrument</span>
                      <span className="sr-only">Instrument: Instrument Flight Time</span>
                    </Tooltip>: <span className="font-semibold">{entry.instrument_time || 0}</span>
                    <Tooltip>
                      <span tabIndex={0} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded cursor-help">Landings (Day)</span>
                      <span className="sr-only">Landings (Day): Daytime Landings</span>
                    </Tooltip>: <span className="font-semibold">{entry.landings_day || 0}</span>
                    <Tooltip>
                      <span tabIndex={0} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded cursor-help">Landings (Night)</span>
                      <span className="sr-only">Landings (Night): Nighttime Landings</span>
                    </Tooltip>: <span className="font-semibold">{entry.landings_night || 0}</span>
                  </div>
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

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
    attachment: null,
  });
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [aircraftOptions, setAircraftOptions] = useState<any[]>([]);
  const [instructorOptions, setInstructorOptions] = useState<any[]>([]);
  const [aircraftQuery, setAircraftQuery] = useState('');
  const [instructorQuery, setInstructorQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    // Fetch aircraft options for autocomplete
    async function fetchAircraft() {
      if (!aircraftQuery) return setAircraftOptions([]);
      const res = await fetch(`/api/aircraft?search=${encodeURIComponent(aircraftQuery)}`);
      const data = await res.json();
      setAircraftOptions(data);
    }
    fetchAircraft();
  }, [aircraftQuery]);

  useEffect(() => {
    // Fetch instructor options for autocomplete
    async function fetchInstructors() {
      if (!instructorQuery) return setInstructorOptions([]);
      const res = await fetch(`/api/instructors?search=${encodeURIComponent(instructorQuery)}`);
      const data = await res.json();
      setInstructorOptions(data);
    }
    fetchInstructors();
  }, [instructorQuery]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, attachment: e.target.files?.[0] || null });
  }

  function handleAircraftSelect(option: any) {
    setForm({ ...form, aircraft_id: option.id });
    setAircraftQuery(option.tail_number);
    setAircraftOptions([]);
  }

  function handleInstructorSelect(option: any) {
    setForm({ ...form, instructor_id: option.id });
    setInstructorQuery(option.name);
    setInstructorOptions([]);
  }

  function validateStep() {
    if (step === 0) {
      return !!form.date && !!form.aircraft_id;
    }
    if (step === 1) {
      return !!form.total_time;
    }
    return true;
  }

  function handleNextStep() {
    if (!validateStep()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setStep(step + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setSaving(true);
    setUploadError(null);
    let fileUrl = form.attachment_url || '';
    if (form.attachment && form.attachment instanceof File) {
      setUploading(true);
      try {
        const supabase = createSupabaseClient();
        const fileExt = form.attachment.name.split('.').pop();
        const fileName = `logbook/${Date.now()}_${form.attachment.name}`;
        const { data, error } = await supabase.storage.from('attachments').upload(fileName, form.attachment, { upsert: true });
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from('attachments').getPublicUrl(fileName);
        fileUrl = publicUrlData?.publicUrl || '';
      } catch (err: any) {
        setUploadError('Failed to upload file.');
        setSaving(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    await onSave({ ...form, attachment_url: fileUrl });
    setSaving(false);
  }

  const steps = [
    {
      label: 'Flight Info',
      icon: <Plane className="h-5 w-5 text-sky-500" />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label>Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label>Aircraft</label>
            <input
              type="text"
              name="aircraft"
              value={aircraftQuery}
              onChange={e => setAircraftQuery(e.target.value)}
              className="input"
              placeholder="Search tail number..."
              autoComplete="off"
              required
            />
            {aircraftOptions.length > 0 && (
              <div className="absolute z-10 bg-white border rounded shadow mt-1 w-full max-h-40 overflow-auto">
                {aircraftOptions.map(option => (
                  <div key={option.id} className="px-3 py-2 hover:bg-sky-100 cursor-pointer" onClick={() => handleAircraftSelect(option)}>
                    <span className="font-semibold">{option.tail_number}</span> <span className="text-xs text-aviation-sunset-300">{option.make} {option.model}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label>Instructor</label>
            <input
              type="text"
              name="instructor"
              value={instructorQuery}
              onChange={e => setInstructorQuery(e.target.value)}
              className="input"
              placeholder="Search instructor..."
              autoComplete="off"
            />
            {instructorOptions.length > 0 && (
              <div className="absolute z-10 bg-white border rounded shadow mt-1 w-full max-h-40 overflow-auto">
                {instructorOptions.map(option => (
                  <div key={option.id} className="px-3 py-2 hover:bg-sky-100 cursor-pointer" onClick={() => handleInstructorSelect(option)}>
                    <span className="font-semibold">{option.name}</span> <span className="text-xs text-aviation-sunset-300">{option.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label>Attachment (optional)</label>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="input" accept="image/*,application/pdf" />
            {uploading && <p className="text-sm text-aviation-sunset-300 mt-1">Uploading...</p>}
            {uploadError && <p className="text-sm text-red-600 mt-1">{uploadError}</p>}
          </div>
        </div>
      ),
    },
    {
      label: 'Flight Times',
      icon: <Loader2 className="h-5 w-5 text-yellow-400" />,
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div><label>Total Time</label><input type="number" name="total_time" value={form.total_time} onChange={handleChange} className="input" required /></div>
          <div><label>PIC Time</label><input type="number" name="pic_time" value={form.pic_time} onChange={handleChange} className="input" /></div>
          <div><label>SIC Time</label><input type="number" name="sic_time" value={form.sic_time} onChange={handleChange} className="input" /></div>
          <div><label>Solo Time</label><input type="number" name="solo_time" value={form.solo_time} onChange={handleChange} className="input" /></div>
          <div><label>Cross Country</label><input type="number" name="cross_country_time" value={form.cross_country_time} onChange={handleChange} className="input" /></div>
          <div><label>Night Time</label><input type="number" name="night_time" value={form.night_time} onChange={handleChange} className="input" /></div>
          <div><label>Instrument Time</label><input type="number" name="instrument_time" value={form.instrument_time} onChange={handleChange} className="input" /></div>
          <div><label>Simulator Time</label><input type="number" name="simulator_time" value={form.simulator_time} onChange={handleChange} className="input" /></div>
          <div><label>Dual Received</label><input type="number" name="dual_received" value={form.dual_received} onChange={handleChange} className="input" /></div>
          <div><label>Dual Given</label><input type="number" name="dual_given" value={form.dual_given} onChange={handleChange} className="input" /></div>
          <div><label>Complex Time</label><input type="number" name="complex_time" value={form.complex_time} onChange={handleChange} className="input" /></div>
          <div><label>High Performance</label><input type="number" name="high_performance_time" value={form.high_performance_time} onChange={handleChange} className="input" /></div>
          <div><label>Tailwheel</label><input type="number" name="tailwheel_time" value={form.tailwheel_time} onChange={handleChange} className="input" /></div>
          <div><label>Multi-Engine</label><input type="number" name="multi_engine_time" value={form.multi_engine_time} onChange={handleChange} className="input" /></div>
        </div>
      ),
    },
    {
      label: 'Landings & Remarks',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div><label>Landings (Day)</label><input type="number" name="landings_day" value={form.landings_day} onChange={handleChange} className="input" /></div>
          <div><label>Landings (Night)</label><input type="number" name="landings_night" value={form.landings_night} onChange={handleChange} className="input" /></div>
          <div className="col-span-2"><label>Remarks</label><textarea name="remarks" value={form.remarks} onChange={handleChange} className="input w-full" /></div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className={`bg-white/80 dark:bg-zinc-900/80 p-6 rounded-2xl shadow-2xl max-w-2xl w-full space-y-6 border-2 border-sky-200 dark:border-blue-900 relative ${shake ? 'animate-shake' : ''}`}
        aria-live="assertive"
      >
        <div className="flex items-center gap-3 mb-2">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-1 ${i === step ? 'font-bold text-sky-600 dark:text-yellow-300' : i < step ? 'text-green-600 dark:text-green-300' : 'text-aviation-sunset-300'}`}>
              {s.icon}
              <span className="hidden md:inline">{s.label}</span>
              {i < steps.length - 1 && <span className="mx-2 w-6 h-1 rounded-full bg-sky-200 dark:bg-blue-900" />}
            </div>
          ))}
        </div>
        <div>{steps[step].content}</div>
        <div className="flex justify-between mt-6">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <div className="flex gap-2">
            {step > 0 && <button type="button" className="btn btn-outline" onClick={() => setStep(step - 1)}>Back</button>}
            {step < steps.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={handleNextStep}>Next</button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={saving || uploading} aria-busy={saving || uploading}>
                {(saving || uploading) ? <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" aria-hidden="true" /> : null}
                {saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save'}
              </button>
            )}
          </div>
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
    const supabase = await createSupabaseClient();
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
          <input type="password" autoComplete="current-password" value={pin} onChange={e => setPin(e.target.value)} maxLength={4} minLength={4} pattern="[0-9]{4}" className="input w-full" required />
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
  const { toast } = useToast();

  useEffect(() => {
    async function fetchEntries() {
      setLoading(true);
      const res = await fetch('/api/student/flight-log-entries');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEntries(data);
        setError(null);
      } else {
        setEntries([]);
        setError(data.error || 'Failed to load logbook entries.');
      }
      setLoading(false);
    }
    fetchEntries();
  }, []);

  useEffect(() => {
    async function fetchRole() {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role === 'admin') setUserRole('admin');
      else if (profile?.role === 'instructor') setUserRole('instructor');
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
      toast({
        title: 'Entry saved!',
        description: 'Your logbook entry has been saved.',
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error saving entry',
        description: err.message,
        variant: 'destructive',
      });
    }
  }

  async function handleSigned() {
    // Refresh entries after signing
    setLoading(true);
    const res = await fetch('/api/student/flight-log-entries');
    const data = await res.json();
    setEntries(data);
    setLoading(false);
    toast({
      title: 'Signed!',
      description: 'Your logbook entry has been signed.',
    });
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
      toast({
        title: 'Entry voided!',
        description: 'Your logbook entry has been voided.',
      });
    } catch (err: any) {
      setVoidError(err.message);
      toast({
        title: 'Error voiding entry',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setVoidLoading(false);
    }
  }

  // Calculate summary stats
  const totalHours = entries.reduce((sum, e) => sum + Number(e.total_time || 0), 0)
  const recentFlights = entries.slice(0, 3)

  return (
    <TooltipProvider>
      <div className="relative flex flex-col gap-6">
        {/* Glassmorphic summary card */}
        <div className="backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 rounded-2xl shadow-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-zinc-200 dark:border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">My Flight Logbook</h1>
            <p className="text-muted-foreground">Track your flights, hours, and endorsements</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold">{totalHours}</span>
              <span className="text-xs text-muted-foreground">Total Hours</span>
            </div>
            <Button variant="ghost" size="icon" aria-label="Export Logbook">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Print Logbook">
              <Printer className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Analytics/Charts */}
        <div className="rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-4 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            {/* Placeholder for analytics chart */}
            <div className="flex items-center gap-2 mb-2">
              <Plane className="h-5 w-5 text-sky-500" />
              <span className="font-semibold">Recent Activity</span>
            </div>
            <div className="h-32 flex items-center justify-center text-muted-foreground">[Chart Coming Soon]</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Plane className="h-5 w-5 text-sky-500" />
              <span className="font-semibold">Flight Time by Type</span>
            </div>
            <div className="h-32 flex items-center justify-center text-muted-foreground">[Chart Coming Soon]</div>
          </div>
        </div>

        {/* Logbook Table */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold">Flight Entries</h2>
          <div className="flex gap-2">
            <Button onClick={() => { setSelectedEntry(null); setShowModal(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Flight
            </Button>
          </div>
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {loading ? (
          <AviationSkeleton />
        ) : (
          <table className="min-w-full bg-white border rounded shadow">
            <thead>
              <tr>
                <th>Date</th>
                <th>Aircraft</th>
                <th>Total Time</th>
                <th>Status</th>
                <th>
                  <Tooltip>
                    <span tabIndex={0} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded cursor-help">
                      Signatures
                    </span>
                    <span className="sr-only">Signatures: Student and Instructor sign-off</span>
                  </Tooltip>
                </th>
                <th>
                  <Tooltip>
                    <span tabIndex={0} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded cursor-help">
                      Actions
                    </span>
                    <span className="sr-only">Actions: Edit, Sign, Void</span>
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry: any) => (
                <AviationLogbookRow
                  key={entry.id}
                  entry={entry}
                  expanded={false} // Initially collapsed
                  onExpand={() => {}} // No expand/collapse for now
                  onEdit={(e) => { setSelectedEntry(e); setShowModal(true); }}
                  onSign={(e, r) => { setSignatureEntry(e); setSignatureRole(r); setShowSignatureModal(true); }}
                  onVoid={(e) => { setVoidEntry(e); setShowVoidModal(true); }}
                  userRole={userRole}
                />
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

        {/* Floating Action Button for mobile */}
        <AviationFAB onClick={() => setShowModal(true)} />
        <AviationToast message="Entry saved!" />
        <AviationToast message="Signed!" />
        <AviationToast message="Entry voided!" />
        <AviationToast message="Error saving entry" />
        <AviationToast message="Error voiding entry" />
      </div>
    </TooltipProvider>
  );
} 