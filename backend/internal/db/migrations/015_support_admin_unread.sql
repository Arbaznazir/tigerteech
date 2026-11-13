ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS admin_unread BOOLEAN NOT NULL DEFAULT false;

-- Existing open tickets with customer messages waiting should show as unread.
UPDATE support_tickets
SET admin_unread = true
WHERE status = 'open' AND user_burst > 0 AND admin_unread = false;
