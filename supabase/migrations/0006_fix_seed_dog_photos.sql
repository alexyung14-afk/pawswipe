-- The photo URLs in 0002 and 0005 were guessed filenames, not real ones -- all 404. Fixing with
-- URLs actually returned by the dog.ceo API.

update dogs set photos = array[
  'https://images.dog.ceo/breeds/labrador/n02099712_7049.jpg',
  'https://images.dog.ceo/breeds/labrador/n02099712_1660.jpg',
  'https://images.dog.ceo/breeds/labrador/n02099712_2174.jpg'
] where source_provider = 'seed-test' and name = 'Biscuit';

update dogs set photos = array['https://images.dog.ceo/breeds/collie-border/n02106166_739.jpg']
  where source_provider = 'seed-test' and name = 'Nova';

update dogs set photos = array['https://images.dog.ceo/breeds/chihuahua/n02085620_7436.jpg']
  where source_provider = 'seed-test' and name = 'Pretzel';

update dogs set photos = array['https://images.dog.ceo/breeds/shihtzu/oscar.jpg']
  where source_provider = 'seed-test' and name = 'Mochi';

update dogs set photos = array['https://images.dog.ceo/breeds/boxer/n02108089_7319.jpg']
  where source_provider = 'seed-test' and name = 'Duke';
