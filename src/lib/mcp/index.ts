import { defineMcp } from "@lovable.dev/mcp-js";
import listListings from "./tools/list-listings";
import addListing from "./tools/add-listing";
import updatePhase from "./tools/update-phase";
import markSold from "./tools/mark-sold";

export default defineMcp({
  name: "kleinanzeigen-mcp",
  title: "Kleinanzeigen",
  version: "0.1.0",
  instructions:
    "Tools for a personal secondhand-selling tracker. Every listing carries a ladder of phases: a price, how many days that price should run, and the move on the platform that starts it. Use `list_listings` to see what is running and what is overdue, `add_listing` once an ad is online, `update_phase` to change a price or confirm that a re-post has happened, and `mark_sold` when the item is gone. A phase only counts as started when the ad actually exists at that price.",
  tools: [listListings, addListing, updatePhase, markSold],
});
