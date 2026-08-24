CREATE TABLE pokemon (
    id BIGSERIAL PRIMARY KEY,
    dex_number INTEGER NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pokemon_dex_positive
        CHECK (dex_number > 0)
);


CREATE TABLE pokemon_maps (
    id BIGSERIAL PRIMARY KEY,

    pokemon_id BIGINT NOT NULL
        REFERENCES pokemon(id)
        ON DELETE CASCADE,

    map_name VARCHAR(150) NOT NULL,

    map_url TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

create table evolutions (
  id serial primary key,
  evolution_chain_id integer not null,
  from_pokemon_id integer references pokemon(id),   -- null si es la forma base
  to_pokemon_id integer not null references pokemon(id),
  stage integer not null,
  methods jsonb not null default '[]',               -- array de strings, ej: ["Subir al nivel 16"]
  created_at timestamptz default now(),
  unique (from_pokemon_id, to_pokemon_id)
);

create index idx_evolutions_chain on evolutions(evolution_chain_id);
create index idx_evolutions_from on evolutions(from_pokemon_id);
create index idx_evolutions_to on evolutions(to_pokemon_id);


CREATE INDEX idx_mapas_pokemon_id
    ON pokemon_maps(pokemon_id);