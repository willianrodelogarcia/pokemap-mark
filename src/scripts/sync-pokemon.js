const { pokemonService } = require('../services');

const limit = process.argv[2] === undefined ? undefined : Number(process.argv[2]);

pokemonService
  .syncPokemonDb({ limit })
  .then(({ synced, available, offset }) => {
    console.log(`Sincronización completada: ${synced} Pokémon (disponibles: ${available}, offset: ${offset}).`);
  })
  .catch(error => {
    console.error(`La sincronización falló: ${error.message}`);
    process.exitCode = 1;
  });
