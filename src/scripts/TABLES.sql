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


CREATE INDEX idx_mapas_pokemon_id
    ON pokemon_maps(pokemon_id);