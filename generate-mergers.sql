-- 30 New fictional mergers for the merger tracking application
-- SQL script to insert data into the mergers table

-- Clear existing placeholder mergers (optional)
-- DELETE FROM mergers WHERE name LIKE '%Hypothetical%';

-- First, make sure the merger_status_history table exists
CREATE TABLE IF NOT EXISTS merger_status_history (
  id SERIAL PRIMARY KEY,
  merger_id UUID NOT NULL REFERENCES mergers(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  has_phase_2 BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_merger_status_history_merger_id ON merger_status_history(merger_id);
CREATE INDEX IF NOT EXISTS idx_merger_status_history_created_at ON merger_status_history(created_at);

-- Insert new mergers 
INSERT INTO mergers (target, acquirer, name, industry, filing_date, current_status, has_phase_2, description)
VALUES
-- Technology sector mergers
('QuantumLogic', 'TechSphere', 'QuantumLogic / TechSphere', 'Technology', CURRENT_DATE - INTERVAL '45 days', 'Phase 1', false, 'Merger between quantum computing startup and established tech giant to accelerate quantum technology development'),
('CloudNest', 'GlobalNet Systems', 'CloudNest / GlobalNet Systems', 'Technology', CURRENT_DATE - INTERVAL '120 days', 'Cleared', false, 'Cloud infrastructure provider acquisition to expand enterprise service offerings'),
('CyberShield', 'SecureMatrix', 'CyberShield / SecureMatrix', 'Technology', CURRENT_DATE - INTERVAL '75 days', 'Phase 2', true, 'Cybersecurity firms merging to create comprehensive security solutions provider'),
('DataVision', 'AnalyticsForge', 'DataVision / AnalyticsForge', 'Technology', CURRENT_DATE - INTERVAL '180 days', 'Cleared with commitments', true, 'Big data analytics merger with commitments to protect user privacy and data portability'),

-- Healthcare sector mergers
('GeneticFrontier', 'BioPharma Labs', 'GeneticFrontier / BioPharma Labs', 'Healthcare', CURRENT_DATE - INTERVAL '95 days', 'Phase 2', true, 'Gene therapy startup being acquired by established pharmaceutical company'),
('MediTech Solutions', 'HealthScape', 'MediTech Solutions / HealthScape', 'Healthcare', CURRENT_DATE - INTERVAL '210 days', 'Cleared', false, 'Medical technology providers joining forces to enhance telehealth capabilities'),
('VitalCare Clinics', 'MediGlobal', 'VitalCare Clinics / MediGlobal', 'Healthcare', CURRENT_DATE - INTERVAL '150 days', 'Blocked', true, 'Hospital chain acquisition blocked due to regional monopoly concerns'),
('BioGenesis', 'PharmaCorp', 'BioGenesis / PharmaCorp', 'Healthcare', CURRENT_DATE - INTERVAL '60 days', 'Phase 1', false, 'Biotechnology research firm acquisition by major pharmaceutical corporation'),

-- Financial Services mergers
('DigitalWealth', 'TraditionBank', 'DigitalWealth / TraditionBank', 'Financial Services', CURRENT_DATE - INTERVAL '85 days', 'Phase 2', true, 'Fintech wealth management platform being acquired by traditional banking institution'),
('CreditSphere', 'GlobalFinance', 'CreditSphere / GlobalFinance', 'Financial Services', CURRENT_DATE - INTERVAL '175 days', 'Cleared with commitments', true, 'Credit analytics provider merger with commitments to maintain fair lending practices'),
('InsureTech', 'SecureFuture', 'InsureTech / SecureFuture', 'Financial Services', CURRENT_DATE - INTERVAL '30 days', 'Phase 1', false, 'Insurance technology startup being acquired by established insurer'),
('PaymentFlow', 'TransactGlobal', 'PaymentFlow / TransactGlobal', 'Financial Services', CURRENT_DATE - INTERVAL '135 days', 'Cleared', false, 'Digital payment platforms merger to expand international presence'),

-- Retail mergers
('GourmetGrocer', 'FoodCorp', 'GourmetGrocer / FoodCorp', 'Retail', CURRENT_DATE - INTERVAL '55 days', 'Phase 1', false, 'Premium grocery chain acquisition by major food retailer'),
('FashionForward', 'StyleMatrix', 'FashionForward / StyleMatrix', 'Retail', CURRENT_DATE - INTERVAL '190 days', 'Cleared', false, 'Online fashion retailer merger to compete with industry giants'),
('HomeEssentials', 'LivingSpaces', 'HomeEssentials / LivingSpaces', 'Retail', CURRENT_DATE - INTERVAL '165 days', 'Blocked', true, 'Home goods retailers merger blocked due to competition concerns in multiple markets'),
('ElectronicEmporium', 'TechRetail', 'ElectronicEmporium / TechRetail', 'Retail', CURRENT_DATE - INTERVAL '100 days', 'Phase 2', true, 'Consumer electronics retailers merger under extended review'),

-- Energy sector mergers
('RenewableFuture', 'GreenPower', 'RenewableFuture / GreenPower', 'Energy', CURRENT_DATE - INTERVAL '40 days', 'Phase 1', false, 'Renewable energy developers merger to scale clean energy projects'),
('SolarInnovations', 'EnergyGrid', 'SolarInnovations / EnergyGrid', 'Energy', CURRENT_DATE - INTERVAL '110 days', 'Cleared', false, 'Solar technology provider acquisition by utility company'),
('FossilResources', 'PetroChem', 'FossilResources / PetroChem', 'Energy', CURRENT_DATE - INTERVAL '200 days', 'Cleared with commitments', true, 'Oil and gas merger with environmental impact commitments'),
('NuclearTech', 'PowerSolutions', 'NuclearTech / PowerSolutions', 'Energy', CURRENT_DATE - INTERVAL '140 days', 'Phase 2', true, 'Nuclear energy specialist acquisition under extended review'),

-- Transportation mergers
('UrbanMobility', 'TransitCorp', 'UrbanMobility / TransitCorp', 'Transportation', CURRENT_DATE - INTERVAL '70 days', 'Phase 1', false, 'Urban transportation startup being acquired by established transit company'),
('AeroSpace Dynamics', 'GlobalAir', 'AeroSpace Dynamics / GlobalAir', 'Transportation', CURRENT_DATE - INTERVAL '155 days', 'Cleared', false, 'Aircraft component manufacturer acquisition by airline conglomerate'),
('FreightForward', 'LogisticsGlobal', 'FreightForward / LogisticsGlobal', 'Transportation', CURRENT_DATE - INTERVAL '90 days', 'Phase 2', true, 'Freight and logistics providers merger under extended review'),
('MaritimeSolutions', 'OceanTransport', 'MaritimeSolutions / OceanTransport', 'Transportation', CURRENT_DATE - INTERVAL '185 days', 'Blocked', true, 'Shipping companies merger blocked due to port monopoly concerns'),

-- Media and Entertainment mergers
('StreamVision', 'ContentHub', 'StreamVision / ContentHub', 'Media', CURRENT_DATE - INTERVAL '50 days', 'Phase 1', false, 'Streaming platform acquisition by content production company'),
('GamingSphere', 'InteractiveMedia', 'GamingSphere / InteractiveMedia', 'Media', CURRENT_DATE - INTERVAL '130 days', 'Cleared', false, 'Gaming studio merger to create diverse entertainment portfolio'),
('NewsNetwork', 'MediaGlobal', 'NewsNetwork / MediaGlobal', 'Media', CURRENT_DATE - INTERVAL '170 days', 'Phase 2', true, 'News and media conglomerates merger under extended review'),
('FilmStudios', 'EntertainmentCorp', 'FilmStudios / EntertainmentCorp', 'Media', CURRENT_DATE - INTERVAL '25 days', 'Phase 1', false, 'Independent film studio being acquired by entertainment conglomerate'),

-- Telecommunications mergers
('FiberConnect', 'GlobalComm', 'FiberConnect / GlobalComm', 'Telecommunications', CURRENT_DATE - INTERVAL '115 days', 'Phase 2', true, 'Fiber optic network provider acquisition by telecommunications giant'),
('WirelessInnovations', 'MobileTech', 'WirelessInnovations / MobileTech', 'Telecommunications', CURRENT_DATE - INTERVAL '195 days', 'Cleared with commitments', true, 'Wireless technology providers merger with consumer protection commitments');

-- Add merger status history entries for phase 2 mergers
INSERT INTO merger_status_history (merger_id, status, has_phase_2, created_at)
SELECT 
  id,
  'Phase 1 Determination',
  true,
  filing_date + INTERVAL '30 days'
FROM mergers
WHERE has_phase_2 = true AND id IN (SELECT id FROM mergers ORDER BY filing_date DESC LIMIT 30);

-- Add NOCC entries for phase 2 mergers
INSERT INTO merger_status_history (merger_id, status, has_phase_2, created_at)
SELECT 
  id,
  'NOCC Issued',
  true,
  filing_date + INTERVAL '45 days'
FROM mergers
WHERE has_phase_2 = true AND id IN (SELECT id FROM mergers ORDER BY filing_date DESC LIMIT 30);

-- Update status history for blocked mergers
INSERT INTO merger_status_history (merger_id, status, has_phase_2, created_at)
SELECT 
  id,
  'Blocked',
  true,
  CURRENT_DATE
FROM mergers
WHERE current_status = 'Blocked' AND id IN (SELECT id FROM mergers ORDER BY filing_date DESC LIMIT 30);

-- Update status history for cleared mergers
INSERT INTO merger_status_history (merger_id, status, has_phase_2, created_at)
SELECT 
  id,
  'Cleared',
  has_phase_2,
  CURRENT_DATE - INTERVAL '7 days'
FROM mergers
WHERE current_status = 'Cleared' AND id IN (SELECT id FROM mergers ORDER BY filing_date DESC LIMIT 30);

-- Update status history for cleared with commitments mergers
INSERT INTO merger_status_history (merger_id, status, has_phase_2, created_at)
SELECT 
  id,
  'Cleared with commitments',
  has_phase_2,
  CURRENT_DATE - INTERVAL '10 days'
FROM mergers
WHERE current_status = 'Cleared with commitments' AND id IN (SELECT id FROM mergers ORDER BY filing_date DESC LIMIT 30); 