import env from 'dotenv';
import { z } from 'zod';

// Load .env file.
env.config();

// Export config.
const config: z.infer<typeof ConfigSchema> = {
	authKey: process.env.AUTH_KEY || '',
};

export default config;

export type ConfigType = Readonly<typeof config>;
export const ConfigSchema = z.object({
	authKey: z.string(),
});
