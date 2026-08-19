import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { sb, ok, fail } from "./_client";

export default defineTool({
  name: "mark_sold",
  title: "Mark sold",
  description:
    "Close a listing. The price is what it actually fetched, which is rarely the asking price — pass null only when it genuinely is not known.",
  inputSchema: {
    listingId: z.string(),
    price: z.number().nullable().describe("What it sold for, in euros."),
    soldAt: z.string().optional().describe("ISO timestamp, when it was not today."),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ listingId, price, soldAt }) => {
    const { error } = await sb()
      .from("listings")
      .update({ sold_at: soldAt ?? new Date().toISOString(), sold_price: price })
      .eq("id", listingId);
    if (error) return fail(error.message);
    return ok({ listingId, soldPrice: price });
  },
});
