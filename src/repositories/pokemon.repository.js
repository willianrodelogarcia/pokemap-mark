const axios = require('axios');
const supabase = require('../config/supabase');
const { POKEAPI_URL } = process.env;

const getPokemonApi = async () => {
  const { data } = await axios.get(POKEAPI_URL);

  return data;
};

const getPokemonApiUrl = () => {
  const configuredUrl =
    process.env.POKEAPI_POKEMON_URL ||
    POKEAPI_URL ||
    'https://pokeapi.co/api/v2/pokemon';
  const url = new URL(configuredUrl);

  // POKEAPI_URL used to point directly at the Pokémon resource. Keep that
  // configuration working, while allowing POKEAPI_POKEMON_URL to override it.
  const normalizedPath = url.pathname.replace(/\/$/, '');
  url.pathname = normalizedPath.endsWith('/pokemon')
    ? normalizedPath
    : `${normalizedPath}/pokemon`;

  return url;
};

const getPokemonApiPage = async ({ limit, offset }) => {
  const url = getPokemonApiUrl();
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  console.log(url.toString());

  const { data } = await axios.get(url.toString(), { timeout: 30000 });
  return data;
};

const createPokemonDb = async pokemon => {
  const { dexNumber, name } = pokemon;
  const { data, error } = await supabase
    .from('pokemon')
    .insert({
      dex_number: dexNumber,
      name,
      pokemon_sprite_gif: `https://github.com/WillianRodelo/SpriteApi/blob/master/pokemon/${name}.gif?raw=true`,
      pokemon_sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNumber}.png`,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const createPokemonMap = async pokemon => {
  const { pokemon_id, map_name, map_url } = pokemon;
  const { data, error } = await supabase
    .from('pokemon_maps')
    .insert({
      pokemon_id,
      map_name,
      map_url,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const getAllPokemonDb = async () => {
  const { data, error } = await supabase
    .from('pokemon')
    .select('*')
    .order('dex_number', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const upsertPokemonDb = async pokemon => {
  const { error } = await supabase.from('pokemon').upsert(pokemon, {
    onConflict: 'dex_number',
  });

  if (error) {
    throw new Error(error.message);
  }

  return pokemon.length;
};

const getPokemonDbByDexNumber = async dexNumber => {
  const { data, error } = await supabase
    .from('pokemon')
    .select('*')
    .eq('dex_number', dexNumber)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const getAllPokemonMap = async () => {
  const { data, error } = await supabase
    .from('pokemon')
    .select(
      `
            id,
            dex_number,
            name,
            pokemon_sprite_gif,
            pokemon_sprite,
            pokemon_maps (
                id,
                pokemon_id,
                map_url,
                map_name
            )
        `,
    )
    .order('dex_number', { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const getPokemonMapByDexNumber = async (dexNumber, mapName) => {
  const { data, error } = await supabase
    .from('pokemon')
    .select(
      `
            id,
            dex_number,
            name,
            pokemon_sprite_gif,
            pokemon_sprite,
            pokemon_maps (
                id,
                pokemon_id,
                map_url,
                map_name
            )
        `,
    )
    .eq('dex_number', dexNumber)
    .eq('pokemon_maps.map_name', mapName)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

module.exports = {
  getPokemonApi,
  getPokemonApiPage,
  createPokemonDb,
  createPokemonMap,
  getAllPokemonDb,
  upsertPokemonDb,
  getPokemonDbByDexNumber,
  getAllPokemonMap,
  getPokemonMapByDexNumber,
};
