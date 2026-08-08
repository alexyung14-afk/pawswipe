-- Support the rough-day flow: an application that couldn't reach the shelter is saved
-- as 'pending' (queued) or 'failed' (send attempt failed), not lost.
alter table applications drop constraint if exists applications_status_check;
alter table applications add constraint applications_status_check
  check (status in ('pending', 'submitted', 'failed', 'no_response', 'update_received'));
alter table applications alter column status set default 'pending';
