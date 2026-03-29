import { NavLink } from "./nav-link";

export function DashboardLinks() {
  return (
    <nav className="flex flex-wrap items-center gap-2">
      <NavLink href="/dashboard" label="Overview" />
      <NavLink href="/dashboard/discover" label="Discover" />
      <NavLink href="/dashboard/inbox" label="Inbox" />
      <NavLink href="/dashboard/settings" label="Settings" />
    </nav>
  );
}
