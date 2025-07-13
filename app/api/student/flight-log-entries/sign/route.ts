import { NextRequest, NextResponse } from 'next/server';
import { addLogbookSignature, verifyLogbookSignature, getFlightLogEntryById, setLogbookEntryStatus, logLogbookAudit } from '@/lib/faa-requirements-service';
import { getUserFromApiRequest } from '@/lib/user-service';

// POST /api/student/flight-log-entries/sign: Add a signature (student or instructor)
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromApiRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { entry_id, pin, role } = await req.json();
    
    if (!entry_id || !pin || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (role !== 'student' && role !== 'instructor') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Get the entry to validate permissions
    const entry = await getFlightLogEntryById(entry_id);
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Check if user has permission to sign this entry
    if (role === 'student' && entry.student_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only sign your own entries' }, { status: 403 });
    }
    
    if (role === 'instructor' && entry.instructor_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only sign entries where you are the instructor' }, { status: 403 });
    }

    // Verify the PIN first
    const isValidPin = await verifyLogbookSignature(entry_id, user.id, role, pin);
    if (!isValidPin) {
      // Try to add the signature (in case this is the first time)
      const result = await addLogbookSignature(entry_id, user.id, role, pin);
      if (!result.success) {
        return NextResponse.json({ error: 'Invalid PIN or failed to sign' }, { status: 400 });
      }
    }

    // Check if both signatures are now present
    const updatedEntry = await getFlightLogEntryById(entry_id);
    if (updatedEntry?.student_signed && updatedEntry?.instructor_signed) {
      // Set status to final if both signatures are present
      await setLogbookEntryStatus(entry_id, 'final');
    }

    // Log the signature action
    await logLogbookAudit(entry_id, `${role}_signature`, user.id, `Entry signed by ${role}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('POST /api/student/flight-log-entries/sign error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}