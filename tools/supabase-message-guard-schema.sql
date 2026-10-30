-- Message guard: rate-limit storage + RPC, required before deploying the Edge Function.
-- Safe to run before switching the frontend: does not revoke anon inserts yet.

create table if not exists public.message_rate_limits (
  ip_hash text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

alter table public.message_rate_limits enable row level security;

revoke all on public.message_rate_limits from public;
revoke all on public.message_rate_limits from anon;
revoke all on public.message_rate_limits from authenticated;
grant select, insert, update, delete on public.message_rate_limits to service_role;

create or replace function public.check_message_rate(
  p_ip_hash text,
  p_limit integer default 5,
  p_window_seconds integer default 600
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_cutoff timestamptz := now() - make_interval(secs => greatest(1, least(p_window_seconds, 86400)));
  v_count integer;
begin
  if p_ip_hash is null or length(p_ip_hash) = 0 then
    return false;
  end if;

  insert into public.message_rate_limits as rl (ip_hash, window_start, count)
  values (p_ip_hash, v_now, 1)
  on conflict (ip_hash) do update
    set count = case
          when rl.window_start < v_cutoff then 1
          else rl.count + 1
        end,
        window_start = case
          when rl.window_start < v_cutoff then v_now
          else rl.window_start
        end
  returning rl.count into v_count;

  return v_count <= greatest(1, least(p_limit, 100));
end;
$$;

revoke all on function public.check_message_rate(text, integer, integer) from public;
revoke all on function public.check_message_rate(text, integer, integer) from anon;
revoke all on function public.check_message_rate(text, integer, integer) from authenticated;
grant execute on function public.check_message_rate(text, integer, integer) to service_role;
