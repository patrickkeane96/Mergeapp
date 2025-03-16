-- Insert 20 additional mergers with various statuses

-- Starbucks / Dutch Bros Merger (Under review - Phase 1)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Starbucks / Dutch Bros Merger',
  'Starbucks plans to acquire Dutch Bros to expand its coffee shop network and market share.',
  'Food & Beverage',
  '2024-04-05',
  NULL,
  'under_review',
  3200,
  false
);

-- Sony / Spotify Merger (Under review - Phase 2)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Sony / Spotify Merger',
  'Sony''s proposed acquisition of Spotify aims to strengthen its position in the music streaming industry.',
  'Entertainment',
  '2024-03-12',
  NULL,
  'under_review',
  8700,
  true
);

-- Marriott / Hilton Merger (Blocked)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Marriott / Hilton Merger',
  'The merger between Marriott and Hilton was blocked due to significant competition concerns in the hotel industry.',
  'Hospitality',
  '2023-11-08',
  '2024-05-15',
  'blocked',
  12500,
  true
);

-- Uber / Lyft Merger (Cleared with commitments)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Uber / Lyft Merger',
  'Uber''s acquisition of Lyft was cleared with commitments to maintain competitive pricing and driver compensation.',
  'Transportation',
  '2023-09-20',
  '2024-04-10',
  'cleared_with_commitments',
  9800,
  true
);

-- Adidas / Puma Merger (Cleared)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Adidas / Puma Merger',
  'Adidas successfully acquired Puma, reuniting the two companies that were originally founded by brothers.',
  'Apparel',
  '2023-08-15',
  '2024-01-22',
  'cleared',
  5600,
  false
);

-- Siemens / ABB Merger (Under review - Phase 2)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Siemens / ABB Merger',
  'Siemens seeks to acquire ABB to strengthen its industrial automation and power distribution capabilities.',
  'Industrial',
  '2024-02-28',
  NULL,
  'under_review',
  7300,
  true
);

-- Nestlé / Danone Merger (Cleared with commitments)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Nestlé / Danone Merger',
  'Nestlé''s acquisition of Danone was approved with commitments to divest certain dairy and water brands.',
  'Food & Beverage',
  '2023-07-10',
  '2024-03-05',
  'cleared_with_commitments',
  8200,
  true
);

-- Samsung / LG Electronics Merger (Under review - Phase 1)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Samsung / LG Electronics Merger',
  'Samsung plans to acquire LG Electronics to expand its consumer electronics and appliance offerings.',
  'Electronics',
  '2024-04-18',
  NULL,
  'under_review',
  11500,
  false
);

-- Novartis / Roche Merger (Blocked)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Novartis / Roche Merger',
  'The proposed merger between Novartis and Roche was blocked due to concerns about reduced innovation in pharmaceuticals.',
  'Pharmaceuticals',
  '2023-10-05',
  '2024-05-02',
  'blocked',
  14200,
  true
);

-- Volkswagen / BMW Merger (Cleared)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Volkswagen / BMW Merger',
  'Volkswagen successfully acquired BMW to create Europe''s largest automotive group.',
  'Automotive',
  '2023-06-12',
  '2024-02-08',
  'cleared',
  18500,
  true
);

-- Airbnb / Booking.com Merger (Under review - Phase 2)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Airbnb / Booking.com Merger',
  'Airbnb''s proposed acquisition of Booking.com would create the world''s largest online travel platform.',
  'Travel',
  '2024-01-15',
  NULL,
  'under_review',
  10300,
  true
);

-- HSBC / Standard Chartered Merger (Cleared with commitments)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'HSBC / Standard Chartered Merger',
  'HSBC''s acquisition of Standard Chartered was approved with commitments to maintain competitive banking services in Asia.',
  'Financial Services',
  '2023-09-08',
  '2024-04-22',
  'cleared_with_commitments',
  15800,
  true
);

-- Shopify / Etsy Merger (Under review - Phase 1)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Shopify / Etsy Merger',
  'Shopify plans to acquire Etsy to expand its e-commerce platform to include more handmade and unique products.',
  'E-commerce',
  '2024-05-01',
  NULL,
  'under_review',
  4700,
  false
);

-- Pfizer / Moderna Merger (Blocked)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Pfizer / Moderna Merger',
  'The proposed merger between Pfizer and Moderna was blocked due to concerns about vaccine development competition.',
  'Pharmaceuticals',
  '2023-12-10',
  '2024-06-05',
  'blocked',
  22500,
  true
);

-- Unilever / Colgate-Palmolive Merger (Cleared)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Unilever / Colgate-Palmolive Merger',
  'Unilever successfully acquired Colgate-Palmolive to strengthen its personal care and household products portfolio.',
  'Consumer Goods',
  '2023-08-22',
  '2024-03-15',
  'cleared',
  9200,
  false
);

-- Cisco / Juniper Networks Merger (Under review - Phase 2)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Cisco / Juniper Networks Merger',
  'Cisco seeks to acquire Juniper Networks to expand its networking hardware and software capabilities.',
  'Technology',
  '2024-02-05',
  NULL,
  'under_review',
  6800,
  true
);

-- Barclays / Santander Merger (Cleared with commitments)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Barclays / Santander Merger',
  'Barclays'' acquisition of Santander was approved with commitments to maintain competitive retail banking services.',
  'Financial Services',
  '2023-11-15',
  '2024-05-20',
  'cleared_with_commitments',
  13500,
  true
);

-- Zara / H&M Merger (Under review - Phase 1)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Zara / H&M Merger',
  'Zara plans to acquire H&M to create the world''s largest fast fashion retailer.',
  'Retail',
  '2024-04-25',
  NULL,
  'under_review',
  7500,
  false
);

-- Shell / BP Merger (Blocked)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Shell / BP Merger',
  'The proposed merger between Shell and BP was blocked due to significant competition concerns in the energy sector.',
  'Energy',
  '2023-10-18',
  '2024-06-10',
  'blocked',
  28500,
  true
);

-- Philips / Siemens Healthineers Merger (Cleared)
INSERT INTO mergers (name, description, industry, start_date, end_date, current_status, value_million_usd, has_phase_2)
VALUES (
  'Philips / Siemens Healthineers Merger',
  'Philips successfully acquired Siemens Healthineers to strengthen its medical equipment and healthcare technology portfolio.',
  'Healthcare',
  '2023-07-28',
  '2024-02-15',
  'cleared',
  12800,
  true
);

-- Get the total count of mergers
SELECT COUNT(*) FROM mergers; 