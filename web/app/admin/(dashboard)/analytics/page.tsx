import { redirect } from "next/navigation";

/** Old Analytics bookmarks land on Dashboard. */
export default function AdminAnalyticsRedirectPage() {
  redirect("/admin");
}
