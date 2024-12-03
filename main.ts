import { setAllRulesActive } from "./denylist.ts";

const port = parseInt(Deno.env.get("PORT") ?? "");

Deno.serve({ port: port || undefined }, async (req) => {
  const apiKey = req.headers.get("X-Api-Key");
  if (!apiKey) {
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
  try {
    if (profileId && command === "enable-all") {
      await setAllRulesActive(apiKey, profileId, true);
    } else if (profileId && command === "disable-all") {
      await setAllRulesActive(apiKey, profileId, false);
    } else {
      return new Response("Not Found", { status: 404 });
    }
  } catch (err) {
    // Handle error responses thrown by setAllRulesActive
    if (err instanceof Response) {
      return err;
    }
    throw err;
  }

  return new Response("Success");
});
