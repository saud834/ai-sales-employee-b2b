// Kept in sync with schema.sql (which exists for reference/tooling).
// Inlined here so the schema ships correctly whether run via tsx or the
// compiled dist/ output, with no extra asset-copy build step required.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_title TEXT,
  email TEXT,
  industry TEXT,
  employee_count INTEGER,
  website TEXT,
  location TEXT,
  notes TEXT,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  qualification_score INTEGER,
  qualification_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email ON leads(email) WHERE email IS NOT NULL AND email != '';

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
`;
