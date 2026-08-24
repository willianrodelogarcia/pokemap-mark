const { evolutionsService } = require('../services');

async function list(req, res) {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const { data, count } = await evolutionsService.listEvolutions({
      limit,
      offset,
    });
    res.json({ data, count, limit, offset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getDirect(req, res) {
  const pokemonId = parseInt(req.params.pokemonId);
  if (Number.isNaN(pokemonId)) {
    return res.status(400).json({ error: 'pokemonId debe ser un número' });
  }

  try {
    const evolutions = await evolutionsService.getDirectEvolutions(pokemonId);
    res.json({ pokemon_id: pokemonId, evolutions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getChain(req, res) {
  const pokemonId = parseInt(req.params.pokemonId);
  if (Number.isNaN(pokemonId)) {
    return res.status(400).json({ error: 'pokemonId debe ser un número' });
  }

  try {
    const chain = await evolutionsService.getEvolutionChain(pokemonId);
    if (chain === null) {
      return res
        .status(404)
        .json({ error: 'No se encontró cadena evolutiva para ese pokemonId' });
    }
    res.json(chain);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const created = await evolutionsService.createEvolution(req.body);
    res.status(201).json({ data: created });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  list,
  getDirect,
  getChain,
  create,
};
