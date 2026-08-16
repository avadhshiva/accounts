-- Pathly PostgreSQL schema (portable — standard PostgreSQL, Supabase-compatible)
-- Apply with: npm run db:migrate

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'free',
  access VARCHAR(20) NOT NULL DEFAULT 'trial',
  trial_started_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  invite_code VARCHAR(255),
  session_version INTEGER NOT NULL DEFAULT 1,
  college VARCHAR(120) DEFAULT '',
  target_role VARCHAR(80) DEFAULT '',
  usage_resume_analyses INTEGER NOT NULL DEFAULT 0,
  usage_mock_interviews INTEGER NOT NULL DEFAULT 0,
  usage_month_key VARCHAR(7) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  role VARCHAR(80) NOT NULL,
  score INTEGER NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  strengths JSONB NOT NULL DEFAULT '[]',
  gaps JSONB NOT NULL DEFAULT '[]',
  rewrites JSONB NOT NULL DEFAULT '[]',
  keywords_to_add JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes (user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_created ON resumes (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  mode VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  question_set JSONB,
  messages JSONB NOT NULL DEFAULT '[]',
  scorecard JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews (user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_user_created ON interviews (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name VARCHAR(80) NOT NULL,
  email VARCHAR(255) NOT NULL,
  section VARCHAR(80) NOT NULL,
  type VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback (created_at DESC);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token VARCHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens (expires_at);

-- Foundation for future phases (not used by UI in Phase 1)
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  learn_completed JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aptitude_attempts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  accuracy INTEGER NOT NULL,
  duration_sec INTEGER,
  topic_breakdown JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_aptitude_user_id ON aptitude_attempts (user_id);
