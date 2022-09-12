import { serve } from "https://deno.land/std@0.154.0/http/server.ts";
import { memoize } from "https://deno.land/x/froebel@v0.21.3/mod.ts";
import { setAllRulesActive } from "./denylist.ts";

const port = parseInt(Deno.env.get("PORT") ?? "");

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`${name} environment variable isn't set`);
  }
  return value;
}

const getEnvAll = memoize(() => ({
  apiKey: getEnv("API_KEY"),
  nextDnsApiKey: getEnv("NEXTDNS_API_KEY"),
}));

serve(async (req) => {
  const { apiKey, nextDnsApiKey } = getEnvAll();

  if (req.headers.get("Authorization") !== `Bearer ${apiKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Found", { status: 405 });
  }

  const pattern = new URLPattern({
    pathname: "/:profileId/denylist/:command",
  });
  const matches = pattern.exec(req.url);
  if (!matches) {
    return new Response("Not Found", { status: 404 });
  }

  const { profileId, command } = matches.pathname.groups;
  if (command === "enable-all") {
    await setAllRulesActive(nextDnsApiKey, profileId, true);
  } else if (command === "disable-all") {
    await setAllRulesActive(nextDnsApiKey, profileId, false);
  } else {
    return new Response("Not Found", { status: 404 });
  }

  return new Response("Success");
}, { port: Number.isNaN(port) ? undefined : port });
