alter table dogs add column if not exists location text;

update dogs set location = 'Austin, TX' where source_provider = 'seed-test' and name in ('Biscuit', 'Ranger');
update dogs set location = 'Portland, OR' where source_provider = 'seed-test' and name in ('Nova', 'Mochi');
update dogs set location = 'Denver, CO' where source_provider = 'seed-test' and name in ('Pretzel', 'Duke');
