import { Redis } from '@upstash/redis';

// Inicializa el cliente de Upstash Redis usando las variables de entorno
// Asegúrate de que UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN estén definidos en tu .env
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
