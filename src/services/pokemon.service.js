const { pokemonRepository } = require('../repositories');
const { buildChain } = require('../utils/evolutionParser');

const getPokemonData = async () => {
  const result = await pokemonRepository.getPokemonApi();
  return result;
};

const createPokemonDb = async pokemon => {
  const result = await pokemonRepository.createPokemonDb(pokemon);
  return result;
};

const createPokemonMap = async pokemon => {
  const result = await pokemonRepository.createPokemonMap(pokemon);
  return result;
};

const getAllPokemonDb = async () => {
  const result = await pokemonRepository.getAllPokemonDb();
  return result;
};

const parseDexNumber = url => {
  const match = url.match(/\/pokemon\/(\d+)\/?$/);
  if (!match) {
    throw new Error(`No se pudo obtener el número de Pokédex desde: ${url}`);
  }

  return Number(match[1]);
};

const syncPokemonDb = async ({ limit, offset = 0, batchSize = 100 } = {}) => {
  const normalizedOffset = Number(offset);
  const normalizedLimit = limit === undefined ? undefined : Number(limit);
  const normalizedBatchSize = Number(batchSize);

  if (!Number.isInteger(normalizedOffset) || normalizedOffset < 0) {
    throw new Error('offset debe ser un entero mayor o igual a 0');
  }
  if (
    normalizedLimit !== undefined &&
    (!Number.isInteger(normalizedLimit) || normalizedLimit < 1)
  ) {
    throw new Error('limit debe ser un entero mayor o igual a 1');
  }
  if (
    !Number.isInteger(normalizedBatchSize) ||
    normalizedBatchSize < 1 ||
    normalizedBatchSize > 500
  ) {
    throw new Error('batchSize debe ser un entero entre 1 y 500');
  }

  const firstPage = await pokemonRepository.getPokemonApiPage({
    limit: Math.min(
      normalizedBatchSize,
      normalizedLimit || normalizedBatchSize,
    ),
    offset: normalizedOffset,
  });
  const available = Math.max(0, firstPage.count - normalizedOffset);
  const total = Math.min(normalizedLimit || available, available);
  let synced = 0;
  let page = firstPage;

  while (synced < total) {
    const remaining = total - synced;
    const results = page.results.slice(0, remaining);
    const pokemon = results.map(({ name, url }) => ({
      dex_number: parseDexNumber(url),
      name,
      pokemon_sprite_gif: `https://github.com/WillianRodelo/SpriteApi/blob/master/pokemon/${name}.gif?raw=true`,
      pokemon_sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${parseDexNumber(url)}.png`,
    }));

    await pokemonRepository.upsertPokemonDb(pokemon);
    synced += pokemon.length;

    if (synced >= total || pokemon.length === 0) break;

    page = await pokemonRepository.getPokemonApiPage({
      limit: Math.min(normalizedBatchSize, total - synced),
      offset: normalizedOffset + synced,
    });
  }

  return { synced, available, offset: normalizedOffset };
};

const getAllPokemonMap = async () => {
  const result = await pokemonRepository.getAllPokemonMap();
  return result;
};

const getPokemonMapByDexNumber = async dexNumber => {
  const result = await pokemonRepository.getPokemonMapByDexNumber(dexNumber);
  return result;
};

const getPokemonSpecies = async pokemon => {
  const result = await pokemonRepository.getPokemonSpecies(pokemon);
  return result;
};

const getEvolutionChainByUrl = async url => {
  const result = await pokemonRepository.getEvolutionChainByUrl(url);
  return result;
};

const getAllEvolutionChainDb = async dexNumber => {
  const result = await pokemonRepository.getAllEvolutionChainDb(dexNumber);
  let rootId = dexNumber;
  let parentRow = result.find(e => e.evolves_to_id === rootId);
  while (parentRow) {
    rootId = parentRow.pokemon_id;
    parentRow = result.find(e => e.evolves_to_id === rootId);
  }

  const chain = buildChain(result, rootId);

  return chain;
};

module.exports = {
  getPokemonData,
  createPokemonDb,
  createPokemonMap,
  getAllPokemonDb,
  syncPokemonDb,
  getAllPokemonMap,
  getPokemonMapByDexNumber,
  getPokemonSpecies,
  getEvolutionChainByUrl,
  getAllEvolutionChainDb,
};
