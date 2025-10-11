-- Configuration tables for document types, citizenship status, and other enums
-- This replaces hardcoded arrays throughout the application

-- Document types configuration
CREATE TABLE IF NOT EXISTS document_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('identification', 'certification', 'medical', 'training', 'other')),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default document types
INSERT INTO document_types (type_key, display_name, description, category, sort_order) VALUES
('medical_certificate', 'Medical Certificate', 'FAA medical certificate (1st, 2nd, or 3rd class)', 'medical', 1),
('pilot_license', 'Pilot License', 'Pilot certificate (Private, Commercial, ATP, etc.)', 'certification', 2),
('photo_id', 'Photo ID', 'Government-issued photo identification', 'identification', 3),
('logbook', 'Logbook', 'Pilot logbook or flight records', 'training', 4),
('endorsement', 'Endorsement', 'Instructor endorsement or recommendation', 'training', 5),
('certificate', 'Certificate', 'Other aviation certificates', 'certification', 6),
('other', 'Other', 'Other aviation-related documents', 'other', 7)
ON CONFLICT (type_key) DO NOTHING;

-- Citizenship status configuration
CREATE TABLE IF NOT EXISTS citizenship_statuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    status_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    requires_additional_docs BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default citizenship statuses
INSERT INTO citizenship_statuses (status_key, display_name, description, sort_order) VALUES
('us_citizen', 'U.S. Citizen', 'United States citizen by birth or naturalization', 1),
('permanent_resident', 'Permanent Resident', 'Lawful permanent resident (Green Card holder)', 2),
('foreign_national', 'Foreign National', 'Citizen of another country (requires TSA approval)', 3)
ON CONFLICT (status_key) DO NOTHING;

-- Enable RLS for configuration tables
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizenship_statuses ENABLE ROW LEVEL SECURITY;

-- RLS policies - configuration data is publicly readable
CREATE POLICY "Document types are publicly readable" ON document_types FOR SELECT USING (is_active = true);
CREATE POLICY "Citizenship statuses are publicly readable" ON citizenship_statuses FOR SELECT USING (is_active = true);

-- Only admins can modify configuration
CREATE POLICY "Only admins can modify document types" ON document_types FOR ALL USING (false); -- TODO: Implement admin role check
CREATE POLICY "Only admins can modify citizenship statuses" ON citizenship_statuses FOR ALL USING (false); -- TODO: Implement admin role check

-- Create triggers for updated_at
CREATE TRIGGER update_document_types_updated_at BEFORE UPDATE ON document_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_citizenship_statuses_updated_at BEFORE UPDATE ON citizenship_statuses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
