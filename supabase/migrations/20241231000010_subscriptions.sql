-- Create subscriptions table
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  status text,
  metadata jsonb,
  price_id text,
  quantity integer,
  cancel_at_period_end boolean,
  created timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_end timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone default timezone('utc'::text, now()),
  cancel_at timestamp with time zone default timezone('utc'::text, now()),
  canceled_at timestamp with time zone default timezone('utc'::text, now()),
  trial_start timestamp with time zone default timezone('utc'::text, now()),
  trial_end timestamp with time zone default timezone('utc'::text, now())
);

alter table public.subscriptions enable row level security;

create policy "Can only view own subscription data." on public.subscriptions for select using (auth.uid() = user_id);

-- Optional: Add stripe_customer_id to profiles or create a separate customers table
-- For simplicity, we can store it in profiles or a new customers table.
-- Let's add it to profiles for easy access.
alter table public.profiles add column stripe_customer_id text;
