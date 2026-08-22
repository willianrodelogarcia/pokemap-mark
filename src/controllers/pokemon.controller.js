const { pokemonService } = require('../services');

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
    const { mapName } = req.body;

    const result = await pokemonService.getPokemonMapByDexNumber(
      Number(dexNumber),
      mapName,
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
};
