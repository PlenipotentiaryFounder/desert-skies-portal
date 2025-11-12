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
import { getUserFromApiRequest, requireRole } from '@/lib/user-service';

// GET: List all logbook entries for the current student
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromApiRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // Students see their own, instructors/admins can filter by student_id
    const studentId = req.nextUrl.searchParams.get('student_id') || user.id;
    const entries = await getFlightLogEntriesOld(studentId);
    return NextResponse.json(entries);
  } catch (err: any) {
    console.error('GET /api/student/flight-log-entries error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new logbook entry (draft or final)
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromApiRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    // Only students can create their own entries
    if (user.role !== 'student' || body.student_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const result = await createFlightLogEntry(body);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('POST /api/student/flight-log-entries error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update an entry (handle signature invalidation if needed)
export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromApiRequest(req);
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
  } catch (err: any) {
    console.error('PUT /api/student/flight-log-entries error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Void (soft-delete) an entry, admin only
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromApiRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id, void_reason } = await req.json();
    await setLogbookEntryStatus(id, 'voided', user.id, void_reason);
    await logLogbookAudit(id, 'void', user.id, void_reason);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/student/flight-log-entries error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// Additional endpoints for signature and audit actions can be added as needed. 