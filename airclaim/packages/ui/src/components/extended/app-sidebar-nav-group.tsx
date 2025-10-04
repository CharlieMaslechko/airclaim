"use client";

import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@vector/ui/components/primitives/sidebar";

export interface AppNavGroup {
  title: string;
  items: AppNavMenu[];
}

export interface AppNavMenu {
  title: string;
  isActive: boolean;
  icon: LucideIcon;
  renderLink: () => React.ReactNode;
}

export function AppNavGroup({ group }: { group: AppNavGroup }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{group.title}</SidebarGroupLabel>

      <SidebarMenu>
        {group.items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={item.isActive}
              tooltip={item.title}
              asChild
            >
              <div>
                {item.icon && <item.icon />}
                {item.renderLink()}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
