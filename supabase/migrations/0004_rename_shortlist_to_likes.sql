alter table shortlist_entries rename to likes;
alter policy "users manage their own shortlist" on likes rename to "users manage their own likes";
