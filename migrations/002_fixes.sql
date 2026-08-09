ALTER TABLE person ADD CONSTRAINT check_credits_positive CHECK (credits >= 0);

CREATE INDEX idx_session_room_id ON session (room_id);
CREATE INDEX idx_session_coach_id ON session (coach_id);
CREATE INDEX idx_session_starts_at ON session (starts_at);
CREATE INDEX idx_enrolment_session_id ON enrolment (session_id);
CREATE INDEX idx_enrolment_person_id ON enrolment (person_id);
