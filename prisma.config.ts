import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// Charge explicitement les variables du fichier .env dans process.env
dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});