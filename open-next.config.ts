import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflareConfig = defineCloudflareConfig({
  incrementalCache: "dummy",
});

export default {
  ...cloudflareConfig,
  buildCommand: "next build",
};
