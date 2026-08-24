const cors = require('cors');
const express = require('express');
const app = express();

const { pokemonRoute, evolutionRoute } = require('./routers');

const PORT = process.env.PORT || 3000;

const start = async () => {
  app.use(cors());
  app.use(express.json());
  app.use('/api/pokemon', pokemonRoute);
  app.use('/api/evolutions', evolutionRoute);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

start();
