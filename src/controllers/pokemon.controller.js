const { pokemonService } = require('../services');
const {
  parseEvolutionChain,
  flattenEvolutionChain,
} = require('../utils/evolutionParser');

const getPokemon = async (req, res) => {
  const result = await pokemonService.getPokemonData();
  res.json(result).status(200);
};

const createPokemonDb = async (req, res) => {
  const pokemon = req.body;

  try {
    const result = await pokemonService.createPokemonDb(pokemon);
    res.json(result).status(201);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllPokemonDb = async (req, res) => {
  try {
    const result = await pokemonService.getAllPokemonDb();
    res.json(result).status(201);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPokemonMap = async (req, res) => {
  const pokemon = req.body;

  try {
    const result = await pokemonService.createPokemonMap(pokemon);
    res.json(result).status(201);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const syncPokemonDb = async (req, res) => {
  try {
    const result = await pokemonService.syncPokemonDb(req.body || {});
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllPokemonMap = async (req, res) => {
  try {
    const result = await pokemonService.getAllPokemonMap();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPokemonMapbyDexNumber = async (req, res) => {
  try {
    const { dexNumber } = req.params;

    const result = await pokemonService.getPokemonMapByDexNumber(
      Number(dexNumber),
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPokemonEvolutionChain = async (req, res, next) => {
  try {
    const { pokemon } = req.params;
    const { format } = req.query;

    if (!pokemon) {
      return res
        .status(400)
        .json({ error: 'Debes indicar el nombre o id del Pokémon' });
    }

    const species = await pokemonService.getPokemonSpecies(pokemon);
    const rawChain = await pokemonService.getEvolutionChainByUrl(
      species.evolution_chain.url,
    );
    const evolutionTree = parseEvolutionChain(rawChain);

    const responseBody = {
      requestedPokemon: pokemon,
      chainId: rawChain.id,
      isBaby: species.is_baby,
      evolvesFromSpecies: species.evolves_from_species
        ? species.evolves_from_species.name
        : null,
    };

    if (format === 'flat') {
      responseBody.evolutions = flattenEvolutionChain(evolutionTree);
    } else {
      responseBody.evolutionChain = evolutionTree;
    }

    return res.status(200).json(responseBody);
  } catch (error) {
    return next(error);
  }
};

const getAllEvolutionChainDb = async (req, res) => {
  const { dexNumber } = req.params;
  try {
    const result = await pokemonService.getAllEvolutionChainDb(
      parseInt(dexNumber),
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPokemon,
  createPokemonDb,
  getAllPokemonDb,
  createPokemonMap,
  syncPokemonDb,
  getAllPokemonMap,
  getPokemonMapbyDexNumber,
  getPokemonEvolutionChain,
  getAllEvolutionChainDb,
};
