import { appConfig } from './config.js';
import { createApp } from './app.js';
import { createCelebrationCopyGenerator } from './celebration-generator.js';

const generateCopy = createCelebrationCopyGenerator(process.env.OPENAI_API_KEY, appConfig.openAiModel);
const app = createApp({ publicPath: appConfig.publicPath, storagePath: appConfig.storagePath, generateCopy });

if (process.env.NODE_ENV !== 'test') {
  app.listen(appConfig.port, () => {
    console.log(JSON.stringify({ event: 'server_started', port: appConfig.port }));
  });
}
