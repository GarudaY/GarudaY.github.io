import { localCmsClient } from "./cms-local-test-client.mjs";
import { volunteerOpportunities } from "../src/content/mock/volunteer-opportunities.ts";

// Local Playground only. Preserve any editorial draft or publication with the same code.
const client = await localCmsClient("volunteer");
const existing = new Set((await client.api()).items.map((item) => item.data.slug));
let imported = 0;
for (const task of volunteerOpportunities) {
  if (existing.has(task.id)) continue;
  await client.api("", {
    action: "publish",
    data: {
      slug: task.id,
      title: task.title,
      description: task.description,
      time: task.time,
      location: task.location,
      icon: task.icon,
      order: task.order,
    },
  });
  imported++;
}
console.log(`Local volunteer tasks imported: ${imported}; existing records preserved.`);
