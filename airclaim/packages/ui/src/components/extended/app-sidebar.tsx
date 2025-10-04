import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@vector/ui/components/primitives/sidebar";
import { AppNavGroup } from "./app-sidebar-nav-group";

export interface AppSidebarProps {
  groups: AppNavGroup[];
}

export function AppSidebar({ groups }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <AppNavGroup key={group.title} group={group} />
        ))}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
