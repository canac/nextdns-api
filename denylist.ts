import { z } from "https://deno.land/x/zod@v3.19.1/mod.ts";

const ruleSchema = z.object({ id: z.string(), active: z.boolean() });
type Rule = z.infer<typeof ruleSchema>;

const denylistSchema = z.object({
  data: z.array(ruleSchema),
});

async function getRules(apiKey: string, profileId: string): Promise<Rule[]> {
  const res = await fetch(
    `https://api.nextdns.io/profiles/${profileId}/denylist`,
    {
      headers: {
        "X-Api-Key": apiKey,
      },
    },
  );
  const body = await denylistSchema.parseAsync(await res.json());
  return body.data;
}

async function setRuleActive(
  apiKey: string,
  profileId: string,
  ruleId: string,
  active: boolean,
): Promise<void> {
  const res = await fetch(
    `https://api.nextdns.io/profiles/${profileId}/denylist/${ruleId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({ active }),
    },
  );
  await res.text();
}

export async function setAllRulesActive(
  apiKey: string,
  profileId: string,
  active: boolean,
): Promise<void> {
  const rules = await getRules(apiKey, profileId);
  await Promise.all(
    rules.filter((rule) => rule.active !== active).map((rule) =>
      setRuleActive(apiKey, profileId, rule.id, active)
    ),
  );
}
