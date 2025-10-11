-- Create student_enrollments table for instructor-student relationships
CREATE TABLE IF NOT EXISTS student_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    syllabus_id UUID REFERENCES syllabi(id) ON DELETE SET NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'cancelled')),
    progress JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, instructor_id) -- One enrollment per student-instructor pair
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_instructor_id ON student_enrollments(instructor_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_syllabus_id ON student_enrollments(syllabus_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_status ON student_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_start_date ON student_enrollments(start_date);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_student_enrollments_updated_at BEFORE UPDATE ON student_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments" ON student_enrollments
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Instructors can view enrollments where they are the instructor
CREATE POLICY "Instructors can view their student enrollments" ON student_enrollments
    FOR SELECT USING (
        instructor_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Students can create enrollments for themselves
CREATE POLICY "Students can create own enrollments" ON student_enrollments
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Instructors can create enrollments for their students
CREATE POLICY "Instructors can create student enrollments" ON student_enrollments
    FOR INSERT WITH CHECK (
        instructor_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Users can update enrollments where they are involved (student or instructor)
CREATE POLICY "Users can update their enrollments" ON student_enrollments
    FOR UPDATE USING (
        student_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        ) OR instructor_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Create syllabi table for flight training programs
CREATE TABLE IF NOT EXISTS syllabi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('private', 'instrument', 'commercial', 'multi-engine', 'instructor')),
    total_lessons INTEGER NOT NULL DEFAULT 0,
    estimated_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for syllabi
CREATE INDEX IF NOT EXISTS idx_syllabi_category ON syllabi(category);
CREATE INDEX IF NOT EXISTS idx_syllabi_is_active ON syllabi(is_active);

-- Create trigger for syllabi
CREATE TRIGGER update_syllabi_updated_at BEFORE UPDATE ON syllabi
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for syllabi
ALTER TABLE syllabi ENABLE ROW LEVEL SECURITY;

-- Everyone can view active syllabi
CREATE POLICY "Anyone can view active syllabi" ON syllabi
    FOR SELECT USING (is_active = true);

-- Only admins can manage syllabi (simplified for now)
CREATE POLICY "Admins can manage syllabi" ON syllabi
    FOR ALL USING (true); -- TODO: Implement proper admin role checking

-- Create flight_sessions table for tracking individual flight lessons
CREATE TABLE IF NOT EXISTS flight_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES student_enrollments(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    flight_hours DECIMAL(4,2) DEFAULT 0,
    ground_hours DECIMAL(4,2) DEFAULT 0,
    aircraft_id TEXT, -- Could reference an aircraft table if we have one
    lesson_type TEXT CHECK (lesson_type IN ('ground', 'flight', 'simulator')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    weather_conditions JSONB DEFAULT '{}',
    maneuvers_practiced TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for flight_sessions
CREATE INDEX IF NOT EXISTS idx_flight_sessions_student_id ON flight_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_flight_sessions_instructor_id ON flight_sessions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_flight_sessions_enrollment_id ON flight_sessions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_flight_sessions_session_date ON flight_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_flight_sessions_status ON flight_sessions(status);

-- Create trigger for flight_sessions
CREATE TRIGGER update_flight_sessions_updated_at BEFORE UPDATE ON flight_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for flight_sessions
ALTER TABLE flight_sessions ENABLE ROW LEVEL SECURITY;

-- Students can view their own sessions
CREATE POLICY "Students can view own sessions" ON flight_sessions
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Instructors can view sessions where they are the instructor
CREATE POLICY "Instructors can view their sessions" ON flight_sessions
    FOR SELECT USING (
        instructor_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Students can create sessions for themselves
CREATE POLICY "Students can create own sessions" ON flight_sessions
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Instructors can create sessions for their students
CREATE POLICY "Instructors can create student sessions" ON flight_sessions
    FOR INSERT WITH CHECK (
        instructor_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Users can update sessions where they are involved
CREATE POLICY "Users can update their sessions" ON flight_sessions
    FOR UPDATE USING (
        student_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        ) OR instructor_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
        )
    );

-- Insert some sample syllabi
INSERT INTO syllabi (name, description, category, total_lessons, estimated_hours) VALUES
('Private Pilot Certificate', 'Complete private pilot training program', 'private', 40, 60.0),
('Instrument Rating', 'Instrument flight rules training', 'instrument', 25, 40.0),
('Commercial Pilot Certificate', 'Commercial pilot certification', 'commercial', 30, 120.0)
ON CONFLICT DO NOTHING;
