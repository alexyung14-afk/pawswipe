-- Test data to verify the Species filter (Dogs / Cats / Other) actually narrows the deck.

update animals set species = 'dog' where source_provider = 'seed-test';

insert into animals (name, species, breed, age_years, size, photos, description, source_provider, source_listing_id, status, shelter_name, location)
values
  ('Waffles', 'cat', 'Domestic Shorthair', 2, 'small',
   array['https://cdn2.thecatapi.com/images/51j.jpg'],
   'Waffles is a chatty tabby who supervises everything you do, especially cooking. Litter-trained, good with other cats, indifferent to dogs.',
   'seed-test', 'seed-cat-1', 'available', 'Second Chance Shelter', 'Portland, OR'),

  ('Juniper', 'cat', 'Maine Coon Mix', 4, 'medium',
   array['https://cdn2.thecatapi.com/images/56i.jpg'],
   'Juniper is a gentle giant who thinks she is a lap cat despite being enormous. Loves a sunny windowsill and slow blinks.',
   'seed-test', 'seed-cat-2', 'available', 'Golden Years Rescue', 'Denver, CO'),

  ('Biscuit the Rabbit', 'other', null, 1, 'small', array[]::text[],
   'A friendly Holland Lop who loves leafy greens and flopping dramatically when content. No photo yet.',
   'seed-test', 'seed-other-1', 'available', 'Riverside Animal Rescue', 'Austin, TX');
