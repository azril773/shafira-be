import { configDotenv } from 'dotenv';
configDotenv()

import { runSeeders } from 'typeorm-extension';
import dataSource from '@config/database';
import { app, configureApp } from './app';

(async () => {
  const PORT = process.env.APP_PORT || 8080;

  await configureApp(app);
  
  dataSource
  .initialize()
  .then(async () => {
      await dataSource.dropDatabase()
      await dataSource.synchronize();
      if (process.env.RUN_SEEDERS === 'true') {
        await runSeeders(dataSource);
      }
      app.listen(PORT, () => {
        console.log('Server is running on port', PORT);
      });
    })
    .catch((err) => {
      console.error('Error during Data Source initialization', err);
      process.exit(1);
    });
})();
