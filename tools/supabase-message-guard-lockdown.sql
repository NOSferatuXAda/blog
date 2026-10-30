-- Message guard lockdown:
-- All writes must go through the message-guard Edge Function (service role).
-- Run this ONLY after the Edge Function is deployed and the frontend is live.

-- Direct anon inserts are no longer allowed.
revoke insert on public.messages from anon;
revoke insert (name, content, anonymous) on public.messages from anon;
revoke update, delete on public.messages from anon;

-- The old permissive insert policy is no longer needed.
drop policy if exists "visitors can insert messages" on public.messages;

-- Public read policy and SELECT grant stay in place.
