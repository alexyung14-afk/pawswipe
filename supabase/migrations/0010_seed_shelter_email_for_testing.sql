update animals
set shelter_contact = jsonb_build_object('email', 'alexyung14@gmail.com')
where source_provider = 'seed-test' and name = 'Biscuit';
