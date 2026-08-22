const cors = require('cors');
const express = require('express');
const app = express();

const { pokemonRoute } = require('./routers');

const PORT = process.env.PORT || 3000;

const start = async () => {
  app.use(cors());
  app.use(express.json());
  app.use('/api', pokemonRoute);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

start();
