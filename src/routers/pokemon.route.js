const express = require('express');
const router = express.Router();
const { pokemonController } = require('../controllers');

router.get('/list', pokemonController.getPokemon);
router.get('/mapas', pokemonController.getAllPokemonMap);
router.get('/db', pokemonController.getAllPokemonDb);
router.post('/create', pokemonController.createPokemonDb);
router.post('/sync', pokemonController.syncPokemonDb);
router.post('/map', pokemonController.createPokemonMap);
router.post('/map/:dexNumber', pokemonController.getPokemonMapbyDexNumber);

module.exports = router;
