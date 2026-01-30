-- Sessions table for storing study sessions
-- Adapted from SQLite schema for PostgreSQL/Supabase

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,  -- Identifies the device (for anonymous sync)
    title TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_time TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_sessions_device_id ON sessions(device_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_start_time ON sessions(start_time DESC);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to insert their own sessions
CREATE POLICY "Allow anonymous insert" ON sessions
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow users to read sessions from their device
CREATE POLICY "Allow read own sessions" ON sessions
    FOR SELECT
    USING (true);

-- Policy: Allow users to update their own sessions
CREATE POLICY "Allow update own sessions" ON sessions
    FOR UPDATE
    USING (true);

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE sessions IS 'Study timer sessions - tracks active and completed study sessions';
COMMENT ON COLUMN sessions.device_id IS 'Unique device identifier for anonymous session tracking';
COMMENT ON COLUMN sessions.status IS 'Session status: active, paused, completed, or cancelled';
