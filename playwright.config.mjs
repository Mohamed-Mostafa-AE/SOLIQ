import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir:'./e2e',
  workers:1,
  retries:0,
  timeout:30000,
  globalTimeout:600000,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4173',browserName:'chromium',trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'node dev-server.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:20000},
});
