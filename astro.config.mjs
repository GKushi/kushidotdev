// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';

import sitemap from '@astrojs/sitemap';

import react from '@astrojs/react';

import vercel from '@astrojs/vercel/static';

// https://astro.build/config
export default defineConfig({
  site: 'https://kushi.dev',
  integrations: [tailwind(), sitemap(), react()],
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
});
