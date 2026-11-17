-- Journey milestones the owner can see on the dashboard: the letter opened,
-- the bouquet seen, the final message read. Added after the first release, so
-- this file upgrades existing databases in place.

alter table visitors add column if not exists bouquet_opened_at timestamptz;
alter table visitors add column if not exists final_opened_at timestamptz;
