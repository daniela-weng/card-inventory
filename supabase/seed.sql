-- Optional seed. Inserts today's placeholder USD→TWD rate. Idempotent per rate_date.
insert into exchange_rates (rate_date, usd_to_twd_rate, source, notes)
values (current_date, 32.5000, 'seed', 'placeholder rate — replace with real data')
on conflict (rate_date) do nothing;
