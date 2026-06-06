import * as React from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import { IconClipboardText, IconDashboard, IconSparkles } from "@tabler/icons-react"

import logoFront from "@/assets/logo2-sidebar.png"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navMain = [
  { title: "Surveys", url: "/", icon: IconClipboardText },
  { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
  { title: "AI Overview", url: "/ai-overview", icon: IconSparkles },
]

const user = {
  name: "HR Team",
  email: "hr@anonytix.example",
  avatar: "",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation()
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="p-1">
        <SidebarMenu>
          <SidebarMenuItem className="flex justify-center">
            <SidebarMenuButton
              asChild
              className="h-auto! w-full justify-center data-[slot=sidebar-menu-button]:p-0!"
            >
              <Link
                to="/"
                className="flex min-h-10 w-full items-center justify-center text-center"
              >
                <img
                  src={logoFront}
                  alt="Anonytix"
                  width={888}
                  height={204}
                  decoding="async"
                  draggable={false}
                  className="block h-auto w-full max-w-[7.5rem] object-contain dark:invert"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {navMain.map((item) => {
                const isActive =
                  item.url === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                      <NavLink to={item.url} end={item.url === "/"}>
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
