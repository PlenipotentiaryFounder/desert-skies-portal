-- Aircraft Maintenance and Operations Schema
-- Comprehensive system for flight school aircraft management

-- Aircraft Maintenance Records
CREATE TABLE aircraft_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(50) NOT NULL, -- 'inspection', 'repair', 'modification', 'ad_compliance'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'overdue'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  due_date DATE NOT NULL,
  completed_date DATE,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  
  -- FAA Compliance
  faa_requirement VARCHAR(100), -- 'annual', '100hr', 'ad_2023-15-12', etc.
  is_airworthiness_affecting BOOLEAN DEFAULT false,
  requires_ferry_permit BOOLEAN DEFAULT false,
  
  -- Cost Tracking
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  vendor VARCHAR(255),
  invoice_number VARCHAR(100),
  
  -- Personnel
  assigned_mechanic UUID REFERENCES profiles(id),
  performed_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  
  -- Documentation
  work_order_number VARCHAR(100),
  logbook_entry TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id)
);

-- Squawk Reports (Maintenance Requests)
CREATE TABLE squawk_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  
  -- Issue Details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'airframe', 'engine', 'avionics', 'interior', 'exterior'
  severity VARCHAR(20) DEFAULT 'normal', -- 'minor', 'normal', 'major', 'critical'
  
  -- Status Tracking
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'assigned', 'in_progress', 'resolved', 'closed'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  
  -- Location and Conditions
  location VARCHAR(255), -- 'left wing', 'engine compartment', etc.
  flight_conditions TEXT, -- 'during takeoff', 'in cruise', etc.
  
  -- Safety and Operations
  is_airworthiness_affecting BOOLEAN DEFAULT false,
  requires_immediate_grounding BOOLEAN DEFAULT false,
  affects_operations BOOLEAN DEFAULT true,
  
  -- Resolution
  resolution TEXT,
  maintenance_id UUID REFERENCES aircraft_maintenance(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id),
  
  -- Timestamps
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ARROW/AVIATES Inspections Tracking
CREATE TABLE aircraft_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
  inspection_type VARCHAR(50) NOT NULL, -- 'preflight', 'postflight', '100hr', 'annual', 'conditional'
  
  -- Inspection Details
  title VARCHAR(255) NOT NULL,
  checklist_items JSONB, -- Structured checklist with status for each item
  findings TEXT,
  corrective_actions TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'passed', 'failed', 'conditional'
  is_airworthy BOOLEAN,
  
  -- Personnel
  inspector_id UUID NOT NULL REFERENCES profiles(id),
  verified_by UUID REFERENCES profiles(id),
  
  -- Timing
  inspection_date DATE NOT NULL,
  next_due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Documentation
  logbook_entry TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Aircraft Documents and Records
CREATE TABLE aircraft_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'airworthiness', 'registration', 'operating_limitations', 'weight_balance', 'maintenance_manual'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- File Information
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Validity
  issue_date DATE,
  expiration_date DATE,
  is_current BOOLEAN DEFAULT true,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'superseded', 'archived'
  
  -- Tracking
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Aircraft Utilization and Performance
CREATE TABLE aircraft_utilization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Flight Hours
  total_flights INTEGER DEFAULT 0,
  total_hours DECIMAL(5,2) DEFAULT 0,
  revenue_hours DECIMAL(5,2) DEFAULT 0,
  maintenance_hours DECIMAL(5,2) DEFAULT 0,
  
  -- Availability
  scheduled_hours DECIMAL(5,2) DEFAULT 0,
  actual_hours DECIMAL(5,2) DEFAULT 0,
  downtime_hours DECIMAL(5,2) DEFAULT 0,
  
  -- Performance
  fuel_consumed DECIMAL(6,2), -- gallons
  oil_consumed DECIMAL(4,2), -- quarts
  landings INTEGER DEFAULT 0,
  
  -- Revenue
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  maintenance_costs DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(aircraft_id, date)
);

-- Aircraft Parts and Inventory
CREATE TABLE aircraft_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES aircraft(id) ON DELETE SET NULL,
  part_number VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  manufacturer VARCHAR(255),
  
  -- Inventory
  quantity_on_hand INTEGER DEFAULT 0,
  minimum_quantity INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2),
  
  -- Life Tracking
  life_limit_hours INTEGER,
  life_limit_cycles INTEGER,
  current_hours INTEGER DEFAULT 0,
  current_cycles INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'obsolete', 'discontinued'
  location VARCHAR(255), -- 'hangar', 'warehouse', 'installed'
  
  -- Installation
  installed_date DATE,
  installed_hours INTEGER,
  next_inspection_hours INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Maintenance Alerts and Notifications
CREATE TABLE maintenance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'inspection_due', 'squawk_critical', 'part_life', 'document_expiry'
  
  -- Alert Details
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  
  -- Timing
  due_date DATE,
  alert_date DATE NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES profiles(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'dismissed'
  
  -- Related Records
  maintenance_id UUID REFERENCES aircraft_maintenance(id),
  squawk_id UUID REFERENCES squawk_reports(id),
  inspection_id UUID REFERENCES aircraft_inspections(id),
  part_id UUID REFERENCES aircraft_parts(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for Performance
CREATE INDEX idx_aircraft_maintenance_aircraft_id ON aircraft_maintenance(aircraft_id);
CREATE INDEX idx_aircraft_maintenance_status ON aircraft_maintenance(status);
CREATE INDEX idx_aircraft_maintenance_due_date ON aircraft_maintenance(due_date);
CREATE INDEX idx_squawk_reports_aircraft_id ON squawk_reports(aircraft_id);
CREATE INDEX idx_squawk_reports_status ON squawk_reports(status);
CREATE INDEX idx_squawk_reports_reported_by ON squawk_reports(reported_by);
CREATE INDEX idx_aircraft_inspections_aircraft_id ON aircraft_inspections(aircraft_id);
CREATE INDEX idx_aircraft_inspections_type ON aircraft_inspections(inspection_type);
CREATE INDEX idx_aircraft_inspections_date ON aircraft_inspections(inspection_date);
CREATE INDEX idx_aircraft_utilization_aircraft_date ON aircraft_utilization(aircraft_id, date);
CREATE INDEX idx_maintenance_alerts_aircraft_id ON maintenance_alerts(aircraft_id);
CREATE INDEX idx_maintenance_alerts_status ON maintenance_alerts(status);
CREATE INDEX idx_maintenance_alerts_due_date ON maintenance_alerts(due_date);

-- Triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_aircraft_maintenance_updated_at BEFORE UPDATE ON aircraft_maintenance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_squawk_reports_updated_at BEFORE UPDATE ON squawk_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aircraft_inspections_updated_at BEFORE UPDATE ON aircraft_inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aircraft_documents_updated_at BEFORE UPDATE ON aircraft_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aircraft_utilization_updated_at BEFORE UPDATE ON aircraft_utilization FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aircraft_parts_updated_at BEFORE UPDATE ON aircraft_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_alerts_updated_at BEFORE UPDATE ON maintenance_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 