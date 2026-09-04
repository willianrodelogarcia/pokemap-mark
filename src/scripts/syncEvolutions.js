const supabase = require('../config/supabase');
const pokeApiService = require('../services/pokemon.service');
const {
  describeEvolutionDetail,
} = require('../utils/evolutionParser');

function collectEvolutionRows(
  chainLink,
  fromName,
  chainId,
  pokemonIdByName,
  stage = 1,
  isRegionalForm = false,
) {
  const rows = [];

  for (const nextLink of chainLink.evolves_to) {
    const matchingDetails = nextLink.evolution_details.filter(detail =>
      detail.base_form
        ? isRegionalForm && detail.base_form.name === fromName
        : !isRegionalForm,
    );
    const detailsByTarget = new Map();

    for (const detail of matchingDetails) {
      const toName = detail.evolved_form?.name || nextLink.species.name;
      const target = detailsByTarget.get(toName) || {
        methods: [],
        isRegionalForm: Boolean(detail.evolved_form),
      };
      target.methods.push(describeEvolutionDetail(detail));
      detailsByTarget.set(toName, target);
    }

    for (const [toName, target] of detailsByTarget) {
      const fromPokemonId = pokemonIdByName.get(fromName);
      const toPokemonId = pokemonIdByName.get(toName);

      if (!fromPokemonId || !toPokemonId) {
        console.warn(
          `- Se omite ${fromName} → ${toName}: falta en la tabla pokemon`,
        );
        continue;
      }

      rows.push({
        evolution_chain_id: chainId,
        from_pokemon_id: fromPokemonId,
        to_pokemon_id: toPokemonId,
        stage: stage + 1,
        methods: target.methods,
      });
      rows.push(
        ...collectEvolutionRows(
          nextLink,
          toName,
          chainId,
          pokemonIdByName,
          stage + 1,
          target.isRegionalForm,
        ),
      );
    }
  }

  return rows;
}

function findRegionalRootName(chainLink, pokemonName) {
  const parentByForm = new Map();

  function visit(link) {
    for (const nextLink of link.evolves_to) {
      for (const detail of nextLink.evolution_details) {
        if (detail.base_form) {
          const evolvedName =
            detail.evolved_form?.name || nextLink.species.name;
          parentByForm.set(evolvedName, detail.base_form.name);
        }
      }
      visit(nextLink);
    }
  }

  visit(chainLink);

  let rootName = pokemonName;
  while (parentByForm.has(rootName)) {
    rootName = parentByForm.get(rootName);
  }
  return rootName;
}

async function syncPokemonChain(
  pokemon,
  pokemonIdByName,
  processedChains,
  evolutionChainsByUrl,
) {
  const pokemonData = await pokeApiService.getPokemonByName(pokemon.name);
  const species = await pokeApiService.getPokemonSpeciesByUrl(
    pokemonData.species.url,
  );
  const chainId = Number(species.evolution_chain.url.match(/\/(\d+)\/?$/)[1]);
  let rawChain = evolutionChainsByUrl.get(species.evolution_chain.url);
  if (!rawChain) {
    rawChain = await pokeApiService.getEvolutionChainByUrl(
      species.evolution_chain.url,
    );
    evolutionChainsByUrl.set(species.evolution_chain.url, rawChain);
  }
  const isRegionalForm = pokemonData.is_default === false;
  const rootName = isRegionalForm
    ? findRegionalRootName(rawChain.chain, pokemon.name)
    : pokemon.name;
  const processedKey = `${chainId}:${isRegionalForm ? rootName : 'default'}`;

  if (processedChains.has(processedKey)) return;
  processedChains.add(processedKey);

  const evolutionRows = collectEvolutionRows(
    rawChain.chain,
    rootName,
    chainId,
    pokemonIdByName,
    1,
    isRegionalForm,
  );

  if (evolutionRows.length === 0) {
    console.log(
      `- "${species.name}" no tiene evoluciones que registrar (chain ${chainId})`,
    );
    return;
  }

  const { error } = await supabase
    .from('evolutions')
    .upsert(evolutionRows, { onConflict: 'from_pokemon_id,to_pokemon_id' });

  if (error) throw error;

  console.log(`✔ Sincronizada cadena de "${species.name}" (chain ${chainId})`);
}

async function run() {
  const processedChains = new Set();
  const evolutionChainsByUrl = new Map();

  // Trae todos los ids que ya tienes en tu tabla "pokemon"
  const { data: pokemonRows, error } = await supabase
    .from('pokemon')
    .select('id, dex_number, name');
  if (error) throw error;

  const pokemonIdByName = new Map(
    pokemonRows.map(({ id, name }) => [name, id]),
  );

  for (const pokemon of pokemonRows) {
    try {
      await syncPokemonChain(
        pokemon,
        pokemonIdByName,
        processedChains,
        evolutionChainsByUrl,
      );
    } catch (err) {
      console.error(
        `✘ Error con Pokémon ${pokemon.dex_number}: ${err.message}`,
      );
    }
  }

  console.log('Sincronización completa.');
  process.exit(0);
}

run();
