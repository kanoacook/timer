-- Session history table for tracking all state changes within a session
-- Event log for audit trail and analytics

CREATE TABLE session_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'started', 'paused', 'resumed', 'stopped',
        'activity_started', 'activity_updated', 'activity_ended'
    )),
    event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    elapsed_at_event INTEGER DEFAULT 0,
    metadata JSONB,  -- JSON blob for event-specific data
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_history_session_id ON session_history(session_id);
CREATE INDEX idx_history_event_type ON session_history(event_type);
CREATE INDEX idx_history_event_time ON session_history(event_time DESC);

-- Enable Row Level Security
ALTER TABLE session_history ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous insert
CREATE POLICY "Allow anonymous insert" ON session_history
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow read
CREATE POLICY "Allow read session history" ON session_history
    FOR SELECT
    USING (true);

COMMENT ON TABLE session_history IS 'Event log for tracking all state changes within study sessions';
COMMENT ON COLUMN session_history.event_type IS 'Event type: started, paused, resumed, stopped, activity_started, activity_updated, activity_ended';
COMMENT ON COLUMN session_history.elapsed_at_event IS 'Elapsed seconds at the time of the event';
COMMENT ON COLUMN session_history.metadata IS 'JSON blob for event-specific data';
