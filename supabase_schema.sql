-- Database Schema for Society Ledger

-- 1. Societies
CREATE TABLE IF NOT EXISTS societies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Profiles (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Roles
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

INSERT INTO roles (id, name) VALUES 
(1, 'super_admin'),
(2, 'admin'),
(3, 'finance_manager'),
(4, 'auditor'),
(5, 'member')
ON CONFLICT (id) DO NOTHING;

-- 4. Society Members
CREATE TABLE IF NOT EXISTS society_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id),
    status TEXT CHECK (status IN ('active', 'invited', 'pending', 'removed')) DEFAULT 'invited',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, society_id)
);

-- 5. Payment Requests
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    amount NUMERIC(15, 2) NOT NULL,
    note TEXT,
    proof_url TEXT,
    status TEXT CHECK (status IN ('pending', 'received', 'verified', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Payment Approvals
CREATE TABLE IF NOT EXISTS payment_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID REFERENCES payment_requests(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES profiles(id),
    role TEXT CHECK (role IN ('admin', 'finance_manager')),
    status TEXT CHECK (status IN ('approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Expense Requests
CREATE TABLE IF NOT EXISTS expense_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id),
    title TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT,
    proof_url TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Expense Approvals
CREATE TABLE IF NOT EXISTS expense_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_request_id UUID REFERENCES expense_requests(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES profiles(id),
    role TEXT CHECK (role IN ('admin', 'finance_manager')),
    status TEXT CHECK (status IN ('approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Ledger Entries (APPEND ONLY)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('credit', 'debit', 'adjustment')) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    reference_id UUID, -- reference to payment_id or expense_id
    reference_type TEXT CHECK (reference_type IN ('payment', 'expense', 'adjustment')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Attachments
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    type TEXT,
    linked_id UUID, -- linked to payment_id, expense_id, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Helper Functions (Bypass RLS for policy checks)
CREATE OR REPLACE FUNCTION public.is_society_admin(soc_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.society_members
    WHERE society_id = soc_id
    AND user_id = auth.uid()
    AND role_id IN (1, 2) -- super_admin or admin
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_society_member(soc_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.society_members
    WHERE society_id = soc_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS)

-- Enable RLS
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Policies

-- Profiles: Users can view their own or people in the same society
CREATE POLICY "View profiles" ON profiles
    FOR SELECT USING (
        auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM society_members sm1
            WHERE sm1.user_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM society_members sm2
                WHERE sm2.society_id = sm1.society_id
                AND sm2.user_id = profiles.id
            )
        )
    );

CREATE POLICY "Update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Societies: Public societies are viewable by all, private only by members or creator
CREATE POLICY "View societies" ON societies
    FOR SELECT USING (
        is_private = FALSE 
        OR is_society_member(id)
        OR auth.uid() = created_by
    );

CREATE POLICY "Create societies" ON societies
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Society Members
CREATE POLICY "View memberships" ON society_members
    FOR SELECT USING (
        auth.uid() = user_id 
        OR is_society_admin(society_id)
    );

CREATE POLICY "Insert memberships" ON society_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id -- Can always insert yourself
    );

CREATE POLICY "Admin manage members" ON society_members
    FOR UPDATE USING (is_society_admin(society_id));

-- Payment Requests
CREATE POLICY "View payments" ON payment_requests
    FOR SELECT USING (
        auth.uid() = user_id 
        OR is_society_admin(society_id)
    );

CREATE POLICY "Submit payments" ON payment_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ledger
CREATE POLICY "View ledger" ON ledger_entries
    FOR SELECT USING (is_society_member(society_id));

-- Triggers for profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS society_ledger_on_auth_user_created ON auth.users;
CREATE TRIGGER society_ledger_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to update ledger when payment is verified
CREATE OR REPLACE FUNCTION public.verify_payment_and_ledger()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changes to 'verified'
    IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
        INSERT INTO public.ledger_entries (society_id, type, amount, reference_id, reference_type, created_by)
        VALUES (NEW.society_id, 'credit', NEW.amount, NEW.id, 'payment', auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS society_ledger_on_payment_verified ON payment_requests;
CREATE TRIGGER society_ledger_on_payment_verified
    AFTER UPDATE OF status ON payment_requests
    FOR EACH ROW EXECUTE PROCEDURE public.verify_payment_and_ledger();

-- Trigger to update ledger when expense is approved
CREATE OR REPLACE FUNCTION public.approve_expense_and_ledger()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changes to 'approved'
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        INSERT INTO public.ledger_entries (society_id, type, amount, reference_id, reference_type, created_by)
        VALUES (NEW.society_id, 'debit', NEW.amount, NEW.id, 'expense', auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS society_ledger_on_expense_approved ON expense_requests;
CREATE TRIGGER society_ledger_on_expense_approved
    AFTER UPDATE OF status ON expense_requests
    FOR EACH ROW EXECUTE PROCEDURE public.approve_expense_and_ledger();
