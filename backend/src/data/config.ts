import env from 'dotenv';
import { z } from 'zod';

// Load .env file.
env.config();

// Export config.
const config: z.infer<typeof ConfigSchema> = {
	port: process.env.PORT || '',
	authQuery: process.env.AUTH_QUERY || '',
};

export default config;

export type ConfigType = Readonly<typeof config>;
export const ConfigSchema = z.object({
	port: z.string(),
	authQuery: z.string(),
});
