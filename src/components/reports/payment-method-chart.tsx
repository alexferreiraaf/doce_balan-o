"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Transaction, PaymentMethod } from "@/app/lib/types"
import { formatCurrency } from "@/lib/utils"

const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  fiado: "Fiado",
}

interface PaymentMethodChartProps {
  transactions: Transaction[]
}

export function PaymentMethodChart({ transactions }: PaymentMethodChartProps) {
  const chartData = React.useMemo(() => {
    const incomeByMethod = transactions
      .filter((t) => t.type === "income" && t.paymentMethod)
      .reduce((acc, t) => {
        const method = t.paymentMethod!
        if (!acc[method]) {
          acc[method] = 0
        }
        acc[method] += t.amount
        return acc
      }, {} as { [key in PaymentMethod]?: number })

    return (Object.keys(incomeByMethod) as PaymentMethod[])
      .map((method, index) => ({
        name: PAYMENT_METHOD_NAMES[method],
        value: incomeByMethod[method] || 0,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`,
      }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  const totalValue = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0)
  }, [chartData])

  const chartConfig = React.useMemo(() => {
    return chartData.reduce((acc, { name, fill }) => {
      acc[name] = { label: name, color: fill };
      return acc;
    }, {} as any)
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 md:h-80 text-muted-foreground">
        <p>Sem dados de receitas para exibir.</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center">
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[300px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="name" formatter={(value) => formatCurrency(value as number)}/>}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius="60%"
          strokeWidth={5}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {formatCurrency(totalValue)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      Total
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
    </div>
  )
}
