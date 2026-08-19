import { redirect } from "next/navigation";

// Superseded by the public /discover (finding a pro doesn't require an
// account — only requesting a quote or messaging does). Kept as a
// redirect so any existing links here keep working.
export default function OwnerDiscoverRedirect() {
  redirect("/discover");
}
