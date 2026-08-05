-- Test data for building Phase 5 (swipe UI) before the RescueGroups sync is live.
-- Tagged source_provider = 'seed-test' so it's easy to find and delete later:
--   delete from dogs where source_provider = 'seed-test';

insert into dogs (name, breed, age_years, size, photos, description, source_provider, source_listing_id, status, shelter_name)
values
  ('Biscuit', 'Labrador Retriever Mix', 2, 'large',
   array['https://images.dog.ceo/breeds/labrador/n02099712_1096.jpg'],
   'Biscuit is a goofy, tail-wagging love machine who thinks every human is his best friend. Great with kids, loves belly rubs, still working on "sit."',
   'seed-test', 'seed-1', 'available', 'Riverside Animal Rescue'),

  ('Nova', 'Border Collie', 3, 'medium',
   array['https://images.dog.ceo/breeds/collie-border/n02106166_1191.jpg'],
   'Nova is whip-smart and needs a job to do -- fetch, agility, puzzle toys, all of it. Not a couch potato. Previous owner said she "basically trained herself."',
   'seed-test', 'seed-2', 'available', 'Second Chance Shelter'),

  ('Pretzel', 'Chihuahua Mix', 8, 'small',
   array['https://images.dog.ceo/breeds/chihuahua/tumblr_n7kx9zSSOr1qzu2n3o1_1280.jpg'],
   'A senior gentleman who mostly wants a warm lap and a slow evening walk. House-trained, quiet, gets along with other small dogs.',
   'seed-test', 'seed-3', 'available', 'Golden Years Rescue'),

  ('Ranger', 'German Shepherd', 1, 'large', array[]::text[],
   'Ranger is a young, high-energy pup still growing into his paws. No photo yet -- he just came in and hasn''t had his photoshoot.',
   'seed-test', 'seed-4', 'available', 'Riverside Animal Rescue'),

  ('Mochi', 'Shih Tzu', 5, 'small',
   array['https://images.dog.ceo/breeds/shihtzu/n02086240_913.jpg'],
   'Mochi showed up as a stray with a big personality and an even bigger underbite. She snores. She does not care what you think about it. She would like a nap and possibly a snack, in that order, and honestly she has very strong opinions about the order in which things happen in her day and will let you know about it at length if you get it wrong, which is charming exactly once.',
   'seed-test', 'seed-5', 'available', 'Second Chance Shelter'),

  ('Duke', 'Boxer Mix', 4, 'large',
   array['https://images.dog.ceo/breeds/boxer/n02108089_11322.jpg'],
   null,
   'seed-test', 'seed-6', 'available', 'Golden Years Rescue');
