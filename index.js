import express from 'express';
import cors from 'cors';

import config from './config.js';
import eventRoute from './Routes/eventRoute.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', eventRoute);

app.listen(config.port, () =>
  console.log(`Server is live @ ${config.hostUrl}`),
);