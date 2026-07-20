import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflareConfig = defineCloudflareConfig({
  incrementalCache: "dummy",
});

const openNextConfig = {
  ...cloudflareConfig,
  buildCommand: "next build",
};

export default openNextConfig;
