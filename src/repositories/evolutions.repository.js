const axios = require('axios');
const supabase = require('../config/supabase');

const TABLE = 'evolutions';

const POKEMON_FIELDS = 'dex_number, name, pokemon_sprite';
const SELECT_WITH_POKEMON = `
  *,
  from_pokemon:pokemon!from_pokemon_id ( ${POKEMON_FIELDS} ),
  to_pokemon:pokemon!to_pokemon_id ( ${POKEMON_FIELDS} )
`;

async function findAll({ limit = 100, offset = 0 } = {}) {
  const { data, error, count } = await supabase
    .from(TABLE)
    .select(SELECT_WITH_POKEMON, { count: 'exact' })
    .order('evolution_chain_id', { ascending: true })
    .order('stage', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data, count };
}

async function findByFromPokemonId(pokemonId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_WITH_POKEMON)
    .eq('from_pokemon_id', pokemonId);

  if (error) throw error;
  return data;
}

async function findChainIdForPokemon(pokemonId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('evolution_chain_id')
    .or(`from_pokemon_id.eq.${pokemonId},to_pokemon_id.eq.${pokemonId}`)
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? data[0].evolution_chain_id : null;
}

async function findByChainId(chainId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_WITH_POKEMON)
    .eq('evolution_chain_id', chainId)
    .order('stage', { ascending: true });

  if (error) throw error;
  return data;
}

async function findDistinctChainIds() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('evolution_chain_id')
    .order('evolution_chain_id', { ascending: true });

  if (error) throw error;

  const seen = new Set();
  const ids = [];
  for (const row of data) {
    if (!seen.has(row.evolution_chain_id)) {
      seen.add(row.evolution_chain_id);
      ids.push(row.evolution_chain_id);
    }
  }
  return ids;
}

async function insert(evolution) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([evolution])
    .select();

  if (error) throw error;
  return data[0];
}

const getEvolutionChainByUrl = async evolutionChainUrl => {
  const { data } = await axios.get(evolutionChainUrl);
  return data;
};

const getEvolutionChainByPokemonDb = async dexNumber => {
  const { data, error } = await supabase
    .from('evolutions')
    .select('evolution_chain_id')
    .or(`from_pokemon_id.eq.${dexNumber},to_pokemon_id.eq.${dexNumber}`)
    .limit(1);
  if (error) throw new Error(error.message);
  return data;
};

module.exports = {
  findAll,
  findByFromPokemonId,
  findChainIdForPokemon,
  findByChainId,
  insert,
  findDistinctChainIds,
  getEvolutionChainByUrl,
  getEvolutionChainByPokemonDb,
};
