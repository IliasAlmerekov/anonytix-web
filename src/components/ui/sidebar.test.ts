import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"

describe("Sidebar", () => {
  it("pushes page content in sync with the desktop offcanvas panel", () => {
    const markup = renderToStaticMarkup(
      createElement(
        SidebarProvider,
        { defaultOpen: false },
        createElement(Sidebar)
      )
    )

    expect(markup).toContain('data-slot="sidebar-gap"')
    expect(markup).toContain("w-(--sidebar-width)")
    expect(markup).toContain("transition-[width]")
    expect(markup).toContain("group-data-[collapsible=offcanvas]:w-0")
    expect(markup).toContain("transition-transform")
    expect(markup).toContain("transform-gpu")
    expect(markup).toContain("group-data-[collapsible=offcanvas]:-translate-x-full")
    expect(markup).not.toContain("transition-[left,right,width]")
    expect(markup).not.toContain("will-change-transform")
  })
})
