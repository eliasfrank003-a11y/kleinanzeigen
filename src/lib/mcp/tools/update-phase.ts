import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { sb, ok, fail, type PhaseRow } from "./_client";

export default defineTool({
  name: "update_phase",
  title: "Change or start a phase",
  description:
    "Change one phase of a listing — its price, runtime, type or label — and optionally stamp it as started, which is what happens when the ad has actually been re-posted at that price. Call list_listings first to get the index.",
  inputSchema: {
    listingId: z.string().describe("Listing id from list_listings."),
    phaseIndex: z.number().int().min(0).describe("Zero-based position in the ladder."),
    price: z.number().nullable().optional(),
    priceType: z.enum(["VB", "FP"]).optional(),
    days: z.number().int().min(0).optional(),
    action: z.string().optional(),
    start: z
      .boolean()
      .optional()
      .describe("Stamp this phase as started now. Only true once the new ad is actually online."),
    clearStart: z
      .boolean()
      .optional()
      .describe("Undo a start stamp that was set by mistake."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ listingId, phaseIndex, price, priceType, days, action, start, clearStart }) => {
    const supabase = sb();
    const { data, error } = await supabase
      .from("listings")
      .select("phases")
      .eq("id", listingId)
      .single();
    if (error) return fail(error.message);

    const phases: PhaseRow[] = Array.isArray(data?.phases) ? data.phases : [];
    if (phaseIndex >= phases.length) {
      return fail(`Listing has ${phases.length} phases, no index ${phaseIndex}.`);
    }

    const next = phases.map((p, i) =>
      i !== phaseIndex
        ? p
        : {
            ...p,
            ...(price !== undefined ? { price } : {}),
            ...(priceType !== undefined ? { priceType } : {}),
            ...(days !== undefined ? { days } : {}),
            ...(action !== undefined ? { action } : {}),
            ...(start ? { startedAt: new Date().toISOString() } : {}),
            ...(clearStart ? { startedAt: null } : {}),
          },
    );

    const { error: writeError } = await supabase
      .from("listings")
      .update({ phases: next })
      .eq("id", listingId);
    if (writeError) return fail(writeError.message);

    return ok({ listingId, phase: next[phaseIndex] });
  },
});
