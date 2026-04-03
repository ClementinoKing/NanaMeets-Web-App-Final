alter table public.subscription
  add column if not exists tx_ref text,
  add column if not exists payment_reference text,
  add column if not exists payment_status text,
  add column if not exists amount numeric,
  add column if not exists currency text,
  add column if not exists verified_at timestamptz;

create unique index if not exists subscription_tx_ref_key
  on public.subscription (tx_ref);
