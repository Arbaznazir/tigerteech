CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_settings (key, value_json)
VALUES (
  'cod',
  '{"enabled":true,"everywhere":true,"rules":[]}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
