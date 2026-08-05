-- Generalize from dogs-only to any animal (dog/cat/other), with species as a filterable field.

alter table dogs rename to animals;
alter policy "dogs are publicly readable" on animals rename to "animals are publicly readable";

alter table animals add column species text not null default 'dog' check (species in ('dog', 'cat', 'other'));

alter table likes rename column dog_id to animal_id;
alter table applications rename column dog_id to animal_id;
