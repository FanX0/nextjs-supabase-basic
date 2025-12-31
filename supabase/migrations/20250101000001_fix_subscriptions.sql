-- Add missing columns to subscriptions table
alter table public.subscriptions 
add column if not exists stripe_subscription_id text unique,
add column if not exists stripe_customer_id text;

-- Ensure RLS is enabled (redundant but safe)
alter table public.subscriptions enable row level security;
