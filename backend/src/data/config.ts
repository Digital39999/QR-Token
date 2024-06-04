import env from 'dotenv';
import { z } from 'zod';

// Load .env file.
env.config();

// Export config.
const config: z.infer<typeof ConfigSchema> = {
	port: process.env.PORT || '',
	authKey: process.env.AUTH_KEY || '',
};

export default config;

export type ConfigType = Readonly<typeof config>;
export const ConfigSchema = z.object({
	port: z.string(),
	authKey: z.string(),
});
