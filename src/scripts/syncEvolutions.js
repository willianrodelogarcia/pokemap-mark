const supabase = require('../config/supabase');
const pokeApiService = require('../services/pokemon.service');
const {
  parseEvolutionChain,
  flattenEvolutionChain,
} = require('../utils/evolutionParser');

async function syncPokemonChain(nameOrId, processedChains) {
  const species = await pokeApiService.getPokemonSpecies(nameOrId);
  const chainId = Number(species.evolution_chain.url.match(/\/(\d+)\/?$/)[1]);

  if (processedChains.has(chainId)) return;
  processedChains.add(chainId);

  const rawChain = await pokeApiService.getEvolutionChainByUrl(
    species.evolution_chain.url,
  );
  const tree = parseEvolutionChain(rawChain);
  const flatList = flattenEvolutionChain(tree);

  const evolutionRows = flatList
    .filter(node => node.evolvesFrom)
    .map(node => {
      const fromNode = flatList.find(n => n.name === node.evolvesFrom);
      return {
        evolution_chain_id: chainId,
        from_pokemon_id: fromNode.id,
        to_pokemon_id: node.id,
        stage: node.stage,
        methods: node.evolutionMethods,
      };
    });

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

  // Trae todos los ids que ya tienes en tu tabla "pokemon"
  const { data: pokemonRows, error } = await supabase
    .from('pokemon')
    .select('id');
  if (error) throw error;

  for (const { id } of pokemonRows) {
    try {
      await syncPokemonChain(id, processedChains);
    } catch (err) {
      console.error(`✘ Error con Pokémon ${id}: ${err.message}`);
    }
  }

  console.log('Sincronización completa.');
  process.exit(0);
}

run();
