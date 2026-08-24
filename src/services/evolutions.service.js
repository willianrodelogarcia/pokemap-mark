const { evolutionsRepository } = require('../repositories');

function buildPokemonMap(chainRows) {
  const pokemonById = {};
  for (const row of chainRows) {
    if (row.from_pokemon_id !== null && row.from_pokemon) {
      pokemonById[row.from_pokemon_id] = row.from_pokemon;
    }
    if (row.to_pokemon) {
      pokemonById[row.to_pokemon_id] = row.to_pokemon;
    }
  }
  return pokemonById;
}

function findRootId(chainRows) {
  const baseRow = chainRows.find(r => r.from_pokemon_id === null);
  if (baseRow) return baseRow.to_pokemon_id;

  const toIds = new Set(chainRows.map(r => r.to_pokemon_id));
  for (const row of chainRows) {
    if (row.from_pokemon_id !== null && !toIds.has(row.from_pokemon_id)) {
      return row.from_pokemon_id;
    }
  }

  const minStage = Math.min(...chainRows.map(r => r.stage));
  const minRow = chainRows.find(r => r.stage === minStage);
  return minRow.from_pokemon_id ?? minRow.to_pokemon_id;
}

function buildChainTree(chainId, chainRows) {
  const pokemonById = buildPokemonMap(chainRows);
  const rootId = findRootId(chainRows);

  function buildNode(id) {
    const info = pokemonById[id] || {};
    const children = chainRows.filter(r => r.from_pokemon_id === id);
    return {
      pokemon_id: id,
      dex_number: info.dex_number,
      name: info.name,
      sprite: info.pokemon_sprite,
      evolves_to: children.map(c => ({
        stage: c.stage,
        methods: c.methods,
        ...buildNode(c.to_pokemon_id),
      })),
    };
  }

  return {
    evolution_chain_id: chainId,
    chain: buildNode(rootId),
  };
}

async function listEvolutions({ limit, offset }) {
  const allChainIds = await evolutionsRepository.findDistinctChainIds();
  const pageChainIds = allChainIds.slice(offset, offset + limit);

  const chains = await Promise.all(
    pageChainIds.map(async chainId => {
      const chainRows = await evolutionsRepository.findByChainId(chainId);
      return buildChainTree(chainId, chainRows);
    }),
  );

  return { data: chains, count: allChainIds.length };
}

async function getDirectEvolutions(pokemonId) {
  const rows = await evolutionsRepository.findByFromPokemonId(pokemonId);

  return rows.map(row => ({
    pokemon_id: row.to_pokemon_id,
    dex_number: row.to_pokemon?.dex_number,
    name: row.to_pokemon?.name,
    sprite: row.to_pokemon?.pokemon_sprite,
    stage: row.stage,
    methods: row.methods,
  }));
}

async function getEvolutionChain(pokemonId) {
  const chainId = await evolutionsRepository.findChainIdForPokemon(pokemonId);
  if (chainId === null) return null;

  const chainRows = await evolutionsRepository.findByChainId(chainId);
  return buildChainTree(chainId, chainRows);
}

async function createEvolution(payload) {
  const { evolution_chain_id, from_pokemon_id, to_pokemon_id, stage, methods } =
    payload;

  if (!evolution_chain_id || !to_pokemon_id || !stage) {
    const err = new Error(
      'evolution_chain_id, to_pokemon_id y stage son obligatorios',
    );
    err.status = 400;
    throw err;
  }

  return evolutionsRepository.insert({
    evolution_chain_id,
    from_pokemon_id: from_pokemon_id ?? null,
    to_pokemon_id,
    stage,
    methods: methods ?? [],
  });
}

module.exports = {
  listEvolutions,
  getDirectEvolutions,
  getEvolutionChain,
  createEvolution,
};
