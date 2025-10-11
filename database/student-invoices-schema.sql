-- Create student_invoices table for prepaid hours purchases
CREATE TABLE IF NOT EXISTS student_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    flight_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
    ground_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
    flight_rate DECIMAL(8,2) NOT NULL DEFAULT 0,
    ground_rate DECIMAL(8,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
    stripe_payment_intent_id TEXT,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_invoices_student_id ON student_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_student_invoices_status ON student_invoices(status);
CREATE INDEX IF NOT EXISTS idx_student_invoices_stripe_payment_intent_id ON student_invoices(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_student_invoices_created_at ON student_invoices(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_invoices_updated_at BEFORE UPDATE ON student_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE student_invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Students can only see their own invoices
CREATE POLICY "Students can view own invoices" ON student_invoices
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM user_profiles
            WHERE user_id = auth.uid()
        )
    );

-- Instructors can view invoices for their students (if we implement instructor-student relationships)
-- Admins can view all invoices

-- Students can create invoices for themselves (for prepaid purchases)
CREATE POLICY "Students can create own invoices" ON student_invoices
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT id FROM user_profiles
            WHERE user_id = auth.uid()
        )
    );

-- Only allow updates to certain fields and only for the student's own invoices
CREATE POLICY "Students can update own invoices" ON student_invoices
    FOR UPDATE USING (
        student_id IN (
            SELECT id FROM user_profiles
            WHERE user_id = auth.uid()
        )
    );
