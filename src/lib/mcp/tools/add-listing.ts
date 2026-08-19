import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { sb, uid, ok, fail } from "./_client";

const phase = z.object({
  action: z
    .string()
    .describe('What has to happen on the platform first, e.g. "Neu einstellen".'),
  price: z
    .number()
    .nullable()
    .describe("Price in euros, or null for a step that is not a price, such as giving the item away."),
  priceType: z.enum(["VB", "FP"]).default("VB"),
  days: z
    .number()
    .int()
    .min(0)
    .describe("How long this price should run before the next step is owed. 0 means it never falls due, which is how a plan ends."),
});

export default defineTool({
  name: "add_listing",
  title: "Add a listing",
  description:
    "Add an item to the tracker together with its whole price ladder. Use startedAt when the ad went live earlier than now, so the first phase counts from the right day.",
  inputSchema: {
    title: z.string().min(1).describe("Shown on the card; the item, not the ad headline."),
    phases: z.array(phase).min(1).describe("The ladder, in order, starting with the price it is listed at now."),
    startNow: z
      .boolean()
      .default(true)
      .describe("True when the ad is already online, so the first phase starts running immediately."),
    startedAt: z
      .string()
      .optional()
      .describe("ISO timestamp the first phase started. Overrides startNow."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ title, phases, startNow, startedAt }) => {
    const stamp = startedAt ?? new Date().toISOString();
    const running = Boolean(startedAt) || startNow;

    const row = {
      id: uid(),
      title,
      photo: null,
      created_at: stamp,
      phases: phases.map((p, i) => ({
        id: uid(),
        action: p.action,
        price: p.price,
        priceType: p.priceType,
        days: p.days,
        startedAt: i === 0 && running ? stamp : null,
      })),
      sold_at: null,
      sold_price: null,
    };

    const { error } = await sb().from("listings").insert(row);
    if (error) return fail(error.message);

    return ok({ id: row.id, title: row.title, phases: row.phases });
  },
});
