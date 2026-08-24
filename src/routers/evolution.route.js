const express = require('express');
const { evolutionsController } = require('../controllers');
const router = express.Router();

router.get('/list', evolutionsController.list);
router.get('/:pokemonId', evolutionsController.getDirect);
router.get('/chain/:pokemonId', evolutionsController.getChain);
router.post('/create', evolutionsController.create);

module.exports = router;
