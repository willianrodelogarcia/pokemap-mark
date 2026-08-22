const express = require('express');
const router = express.Router();
const { pokemonController } = require('../controllers');

router.get('/pokemon', pokemonController.getPokemon);
router.get('/pokemon/mapas', pokemonController.getAllPokemonMap);
router.get('/pokemon/db', pokemonController.getAllPokemonDb);
router.post('/pokemon', pokemonController.createPokemonDb);
router.post('/pokemon/sync', pokemonController.syncPokemonDb);
router.post('/pokemon/map', pokemonController.createPokemonMap);
router.post(
  '/pokemon/map/:dexNumber',
  pokemonController.getPokemonMapbyDexNumber,
);

module.exports = router;
