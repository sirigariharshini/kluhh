-- ============================================
-- SUPABASE SCHEMA: AI Medical Assistant
-- ============================================

-- 1. USERS TABLE (links to auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  medical_history TEXT,
  emergency_contact VARCHAR(255),
  allergies TEXT
);

-- 2. CHATS TABLE (conversation threads)
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  medical_context TEXT
);

-- 3. MESSAGES TABLE (chat history)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason VARCHAR(255)
);

-- 4. MEDICAL REPORTS TABLE
CREATE TABLE IF NOT EXISTS medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  file_path VARCHAR(512),
  original_filename VARCHAR(255),
  file_size_bytes INTEGER,
  mime_type VARCHAR(50),
  extracted_text TEXT,
  ocr_confidence DECIMAL(3, 2),
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  CONSTRAINT valid_confidence CHECK (ocr_confidence >= 0 AND ocr_confidence <= 1)
);

-- 5. HEALTH METRICS TABLE
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES medical_reports(id) ON DELETE SET NULL,
  metric_name VARCHAR(100),
  metric_value DECIMAL(10, 2),
  unit VARCHAR(50),
  normal_min DECIMAL(10, 2),
  normal_max DECIMAL(10, 2),
  is_abnormal BOOLEAN,
  severity VARCHAR(50) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  created_at TIMESTAMP DEFAULT NOW(),
  recorded_date DATE
);

-- 6. RISK ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES medical_reports(id) ON DELETE SET NULL,
  risk_score DECIMAL(5, 2) CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level VARCHAR(50) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  identified_conditions TEXT,
  recommended_actions TEXT,
  flagged_metrics TEXT,
  emergency_flags TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 7. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255),
  resource_type VARCHAR(100),
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_reports_user_id ON medical_reports(user_id);
CREATE INDEX idx_metrics_user_id ON health_metrics(user_id);
CREATE INDEX idx_risk_user_id ON risk_assessments(user_id);
CREATE INDEX idx_health_metrics_abnormal ON health_metrics(is_abnormal);
CREATE INDEX idx_risk_severity ON risk_assessments(risk_level);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- CHATS POLICIES
CREATE POLICY "Users can view their own chats" ON chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create chats" ON chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats" ON chats
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats" ON chats
  FOR DELETE USING (auth.uid() = user_id);

-- MESSAGES POLICIES
CREATE POLICY "Users can view messages in their chats" ON messages
  FOR SELECT USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chats WHERE id = chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their chats" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chats WHERE id = chat_id AND user_id = auth.uid()
    )
  );

-- MEDICAL REPORTS POLICIES
CREATE POLICY "Users can view their own reports" ON medical_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports" ON medical_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON medical_reports
  FOR DELETE USING (auth.uid() = user_id);

-- HEALTH METRICS POLICIES
CREATE POLICY "Users can view their own metrics" ON health_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their metrics" ON health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RISK ASSESSMENTS POLICIES
CREATE POLICY "Users can view their own risk assessments" ON risk_assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all risk assessments" ON risk_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- AUDIT LOGS POLICIES
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER chats_updated_at BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id, action, resource_type, resource_id, old_values, new_values, ip_address
  )
  VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    current_setting('request.headers')::json->>'x-forwarded-for'
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEWS for Common Queries
-- ============================================

CREATE OR REPLACE VIEW user_chat_summary AS
SELECT 
  c.id,
  c.title,
  c.created_at,
  (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count,
  (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
FROM chats c
WHERE c.user_id = auth.uid()
ORDER BY c.updated_at DESC;

CREATE OR REPLACE VIEW user_risk_overview AS
SELECT 
  ra.risk_level,
  COUNT(*) as count,
  ROUND(AVG(ra.risk_score), 2) as avg_risk_score
FROM risk_assessments ra
WHERE ra.user_id = auth.uid()
GROUP BY ra.risk_level;
