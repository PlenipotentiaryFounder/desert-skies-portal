-- Create ACS Documents table for storing FAA Airman Certification Standards
-- This replaces the hardcoded mock data in lib/acs-service.ts

CREATE TABLE IF NOT EXISTS acs_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    certificate_type TEXT NOT NULL CHECK (certificate_type IN ('private_pilot', 'commercial_pilot', 'instrument_rating', 'cfi', 'cfii', 'atp')),
    version TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'superseded')),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Ensure unique combination of certificate_type and version
    CONSTRAINT unique_certificate_version UNIQUE (certificate_type, version)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_acs_documents_certificate_type ON acs_documents(certificate_type);
CREATE INDEX IF NOT EXISTS idx_acs_documents_status ON acs_documents(status);
CREATE INDEX IF NOT EXISTS idx_acs_documents_active ON acs_documents(status) WHERE status = 'active';

-- Insert initial ACS documents data
INSERT INTO acs_documents (name, certificate_type, version, url, status) VALUES
('Private Pilot Airplane ACS', 'private_pilot', 'FAA-S-ACS-6B', 'https://www.faa.gov/training_testing/testing/acs/private_airplane_acs_6.pdf', 'active'),
('Commercial Pilot Airplane ACS', 'commercial_pilot', 'FAA-S-ACS-7B', 'https://www.faa.gov/training_testing/testing/acs/commercial_airplane_acs_7.pdf', 'active'),
('Instrument Rating Airplane ACS', 'instrument_rating', 'FAA-S-ACS-8C', 'https://www.faa.gov/training_testing/testing/acs/instrument_rating_acs_8.pdf', 'active')
ON CONFLICT (certificate_type, version) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE acs_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies - ACS documents are public reference data
CREATE POLICY "ACS documents are publicly readable" ON acs_documents
    FOR SELECT USING (true);

-- Only admins can modify ACS documents
CREATE POLICY "Only admins can insert ACS documents" ON acs_documents
    FOR INSERT WITH CHECK (false); -- TODO: Implement admin role check

CREATE POLICY "Only admins can update ACS documents" ON acs_documents
    FOR UPDATE USING (false); -- TODO: Implement admin role check

CREATE POLICY "Only admins can delete ACS documents" ON acs_documents
    FOR DELETE USING (false); -- TODO: Implement admin role check

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_acs_documents_updated_at
    BEFORE UPDATE ON acs_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
