"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Transaction } from "@/app/lib/types"

interface IncomeExpenseChartProps {
  transactions: Transaction[]
}

const chartConfig = {
  income: {
    label: "Receitas",
    color: "hsl(var(--chart-5))",
  },
  expense: {
    label: "Despesas",
    color: "hsl(var(--chart-4))",
  },
}

export function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const chartData = React.useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      return {
        name: d.toLocaleString("default", { month: "short" }),
        year: d.getFullYear(),
        month: d.getMonth(),
        income: 0,
        expense: 0,
      }
    }).reverse()

    transactions.forEach((t) => {
      const transactionDateMs = t.dateMs
      if (!transactionDateMs) return

      const transactionDate = new Date(transactionDateMs)
      const monthIndex = months.findIndex(
        (m) =>
          m.year === transactionDate.getFullYear() &&
          m.month === transactionDate.getMonth()
      )

      if (monthIndex !== -1) {
        if (t.type === "income" && t.status === "paid") {
          months[monthIndex].income += t.amount
        } else if (t.type === "expense") {
          months[monthIndex].expense += t.amount
        }
      }
    })

    return months
  }, [transactions])

  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 md:h-80 text-muted-foreground">
        <p>Sem dados para exibir o gráfico.</p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="income" fill="var(--color-income)" radius={4} />
        <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
