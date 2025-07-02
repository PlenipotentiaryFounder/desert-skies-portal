import { NextRequest, NextResponse } from 'next/server';
import {
  getFlightLogEntries,
  getFlightLogEntryById,
  createFlightLogEntry,
  updateFlightLogEntry,
  deleteFlightLogEntry,
  addLogbookSignature,
  verifyLogbookSignature,
  invalidateLogbookSignatures,
  logLogbookAudit,
  setLogbookEntryStatus
} from '@/lib/faa-requirements-service';
import { getUserFromRequest, requireRole } from '@/lib/user-service';
// TODO: Import and implement signature and audit logic

// GET: List all logbook entries for the current student
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Students see their own, instructors/admins can filter by student_id
  const studentId = req.nextUrl.searchParams.get('student_id') || user.id;
  const entries = await getFlightLogEntries(studentId);
  return NextResponse.json(entries);
}

// POST: Create a new logbook entry (draft or final)
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  // Only students can create their own entries
  if (user.role !== 'student' || body.student_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const result = await createFlightLogEntry(body);
  return NextResponse.json(result);
}

// PUT: Update an entry (handle signature invalidation if needed)
export async function PUT(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { id, ...update } = body;
  // Only students or instructors can update, must be related to entry
  const entry = await getFlightLogEntryById(id);
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (user.role === 'student' && entry.student_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (user.role === 'instructor' && entry.instructor_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // Invalidate signatures if a signed entry is edited
  if (entry.status === 'final') {
    await invalidateLogbookSignatures(id);
    await setLogbookEntryStatus(id, 'draft');
  }
  const result = await updateFlightLogEntry(id, update);
  return NextResponse.json(result);
}

// DELETE: Void (soft-delete) an entry, admin only
export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id, void_reason } = await req.json();
  await setLogbookEntryStatus(id, 'voided', user.id, void_reason);
  await logLogbookAudit(id, 'void', user.id, void_reason);
  return NextResponse.json({ success: true });
}

// POST /sign: Add a signature (student or instructor)
export async function POST_sign(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { entry_id, pin, role } = await req.json();
  // Only allow signing if user matches role and is related to entry
  const entry = await getFlightLogEntryById(entry_id);
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (role === 'student' && entry.student_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (role === 'instructor' && entry.instructor_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const result = await addLogbookSignature(entry_id, user.id, role, pin);
  if (result.success) {
    // If both signatures present, set status to final
    // (Signature check logic would be here)
    await setLogbookEntryStatus(entry_id, 'final');
  }
  return NextResponse.json(result);
}

// POST /verify-signature: Verify a signature (for PIN entry modal)
export async function POST_verify_signature(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { entry_id, pin, role } = await req.json();
  const valid = await verifyLogbookSignature(entry_id, user.id, role, pin);
  return NextResponse.json({ valid });
}

// Additional endpoints for signature and audit actions can be added as needed. 