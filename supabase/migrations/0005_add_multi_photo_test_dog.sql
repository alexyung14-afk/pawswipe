update dogs
set photos = array[
  'https://images.dog.ceo/breeds/labrador/n02099712_1096.jpg',
  'https://images.dog.ceo/breeds/labrador/n02099712_4645.jpg',
  'https://images.dog.ceo/breeds/labrador/n02099712_3960.jpg'
]
where source_provider = 'seed-test' and name = 'Biscuit';
