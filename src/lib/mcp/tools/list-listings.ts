import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { sb, ok, fail, type PhaseRow } from "./_client";

const DAY = 86_400_000;

export default defineTool({
  name: "list_listings",
  title: "List listings",
  description:
    "List the items being sold, each with its price ladder, which phase is currently running, and how many days that phase is past its planned runtime. Read this before changing anything.",
  inputSchema: {
    includeSold: z
      .boolean()
      .default(false)
      .describe("Also return items already marked sold."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ includeSold }) => {
    const supabase = sb();
    // Every column except `photo`. The photo is a base64 data URL of some
    // hundred kilobytes, and an assistant reading this list has no use for the
    // pixels — pulling them would bury the answer in encoded image.
    let query = supabase
      .from("listings")
      .select("id,title,created_at,phases,sold_at,sold_price")
      .order("created_at", { ascending: false });
    if (!includeSold) query = query.is("sold_at", null);

    const { data, error } = await query;
    if (error) return fail(error.message);

    const now = Date.now();
    const listings = (data ?? []).map((row) => {
      const phases: PhaseRow[] = Array.isArray(row.phases) ? row.phases : [];
      let active = -1;
      phases.forEach((p, i) => {
        if (p.startedAt) active = i;
      });
      const running = active >= 0 ? phases[active] : null;
      // A phase with no runtime is a last resort and never falls due.
      const overdueDays =
        running && running.days && running.startedAt
          ? Math.floor((now - Date.parse(running.startedAt)) / DAY) - running.days
          : null;

      return {
        id: row.id,
        title: row.title,
        soldAt: row.sold_at,
        soldPrice: row.sold_price,
        activePhaseIndex: active,
        currentPrice: running ? running.price : null,
        currentPriceType: running ? running.priceType : null,
        overdueDays,
        due: overdueDays !== null && overdueDays >= 0,
        phases,
      };
    });

    return ok({ listings, count: listings.length });
  },
});
