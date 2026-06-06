import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { BarChart } from "recharts"
import { describe, expect, it } from "vitest"

import { ChartContainer } from "@/components/ui/chart"

describe("ChartContainer", () => {
  it("debounces responsive resize work during layout animations", () => {
    const markup = renderToStaticMarkup(
      createElement(
        ChartContainer,
        {
          config: {},
          children: createElement(BarChart, { data: [] }),
        }
      )
    )

    expect(markup).toContain('data-chart-resize-debounce="300"')
  })
})
