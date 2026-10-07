-- ============================================================
-- Align `notifications` with the in-app inbox model the app targets.
--
-- Why:
--   The table was created as a delivery log (user_id NOT NULL,
--   template_id, subject, body, status, sent_at, delivered_at,
--   error_message, and a CHECK limiting `type` to
--   sms/email/whatsapp/push/in_app).
--
--   No application code reads any of those columns. Instead
--   src/app/api/notifications/route.ts, src/app/api/notifications/send/route.ts,
--   src/app/(dashboard)/notifications/page.tsx and the `Notification`
--   interface in src/types/index.ts all target an inbox model:
--   title, message, a severity `type`, role/user targeting and an
--   is_read flag. Every query and insert against those columns failed
--   with "column does not exist" (PostgREST 42703).
--
--   The table held 0 rows, so this is a straight redefinition rather
--   than a data migration.
-- ============================================================

DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'info'
        CHECK (type IN ('info', 'warning', 'urgent', 'academic', 'general')),
    -- Mirrors users.role, plus 'all' for a broadcast.
    target_role VARCHAR(20) NOT NULL DEFAULT 'all'
        CHECK (target_role IN ('all', 'super_admin', 'admin', 'hod', 'faculty', 'student')),
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    target_batch_year INTEGER,
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_notifications_target_user_id ON notifications(target_user_id);
CREATE INDEX idx_notifications_target_role ON notifications(target_role);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER so the policy can read users.role without recursing
-- through the users table's own RLS. Mirrors the is_admin() helper.
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS VARCHAR(20) AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- A notification is visible when it is addressed to this user directly,
-- to their role, or broadcast to everyone.
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (
        target_user_id = auth.uid()
        OR target_role = 'all'
        OR target_role = current_user_role()
        OR is_admin()
    );

CREATE POLICY "Admins can manage notifications"
    ON notifications FOR ALL
    USING (is_admin());