import { getDb } from "../lib/db";
import { createLead, listLeads } from "../lib/repo/leads";

// Running this file triggers the lazy SQLite migration in lib/db.ts, then
// seeds one real prospecting lead so the app isn't empty on first run.
getDb();

const existing = listLeads();
const alreadySeeded = existing.some((l) => l.name === "Mashaweer Rest & Cafe");

if (!alreadySeeded) {
  createLead({
    name: "Mashaweer Rest & Cafe",
    category: "Grill Restaurant",
    city: "Riyadh",
    country: "Saudi Arabia",
    instagram: "mashaweerrest",
    hasWebsite: false,
    evidence:
      "Found via Facebook (facebook.com/Mashaweerrest) and general restaurant listings for Al-Balad, Riyadh; no independent website turned up in search results — only social media and third-party directory pages. Verify directly before outreach.",
    sourceUrls: ["https://www.facebook.com/Mashaweerrest"],
    notes:
      "Real candidate found while researching Saudi restaurants without a website, for a demo-site outreach flow. Confirm phone/WhatsApp before contacting.",
    status: "new",
  });
  console.log("Seeded lead: Mashaweer Rest & Cafe");
} else {
  console.log("Lead already present, skipping seed.");
}

console.log("Database ready at", process.env.DATABASE_PATH || "./data/app.db");
