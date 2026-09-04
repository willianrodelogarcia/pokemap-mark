const { pokemonRepository, evolutionsRepository } = require('../repositories');
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

const getDescription = species => {
  const entries = species.flavor_text_entries || [];
  const entry =
    entries.find(({ language }) => language.name === 'es') ||
    entries.find(({ language }) => language.name === 'en');

  return entry ? entry.flavor_text.replace(/[\n\f\r]+/g, ' ').trim() : null;
};

const mapPokemonApiData = async ({ name, url }) => {
  const details = await pokemonRepository.getPokemonApiDetails(url);
  const species = await pokemonRepository.getPokemonSpeciesByUrl(
    details.species.url,
  );
  const dexNumber = details.id;

  return {
    dex_number: dexNumber,
    name,
    pokemon_sprite_gif: `https://github.com/WillianRodelo/SpriteApi/blob/master/pokemon/${name}.gif?raw=true`,
    pokemon_sprite:
      details.sprites.front_default ||
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNumber}.png`,
    pokemon_sprite_official_artwork:
      details.sprites.other?.['official-artwork']?.front_default || null,
    pokemon_sprite_shiny: details.sprites.front_shiny || null,
    pokemon_types: details.types
      .sort((first, second) => first.slot - second.slot)
      .map(({ type }) => type.name),
    pokemon_description: getDescription(species),
    height: details.height,
    weight: details.weight,
  };
};

const mapWithConcurrency = async (items, limit, callback) => {
  const results = new Array(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await callback(items[currentIndex]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
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
    const pokemon = await mapWithConcurrency(results, 10, mapPokemonApiData);

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

const getAllPokemonMap = async ({ limit, offset } = {}) => {
  const hasPagination = limit !== undefined || offset !== undefined;

  if (!hasPagination) {
    const { data, count } = await pokemonRepository.getAllPokemonMap({});
    return { data, count, limit: null, offset: null };
  }

  const normalizedLimit = limit === undefined ? 100 : Number(limit);
  const normalizedOffset = offset === undefined ? 0 : Number(offset);

  if (
    !Number.isInteger(normalizedLimit) ||
    normalizedLimit < 1 ||
    normalizedLimit > 1000
  ) {
    const error = new Error('limit debe ser un entero entre 1 y 1000');
    error.status = 400;
    throw error;
  }
  if (!Number.isInteger(normalizedOffset) || normalizedOffset < 0) {
    const error = new Error('offset debe ser un entero mayor o igual a 0');
    error.status = 400;
    throw error;
  }

  const { data, count } = await pokemonRepository.getAllPokemonMap({
    limit: normalizedLimit,
    offset: normalizedOffset,
  });
  return { data, count, limit: normalizedLimit, offset: normalizedOffset };
};

const getPokemonMapByDexNumber = async dexNumber => {
  const result = await pokemonRepository.getPokemonMapByDexNumber(dexNumber);
  return result;
};

const getPokemonSpecies = async pokemon => {
  const result = await pokemonRepository.getPokemonSpecies(pokemon);
  return result;
};

const getPokemonByName = async pokemon => {
  const result = await pokemonRepository.getPokemonByName(pokemon);
  return result;
};

const getPokemonSpeciesByUrl = async url => {
  const result = await pokemonRepository.getPokemonSpeciesByUrl(url);
  return result;
};

const getEvolutionChainByUrl = async url => {
  const result = await evolutionsRepository.getEvolutionChainByUrl(url);
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
  getPokemonByName,
  getPokemonSpeciesByUrl,
  getEvolutionChainByUrl,
  getAllEvolutionChainDb,
};
