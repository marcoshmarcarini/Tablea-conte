"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface MonthlyChartItem {
  rawMonth: string;
  formattedMonth: string;
  criadas: number;
  adaptadas: number;
  faturamento: number;
}

interface AgencyChartItem {
  name: string;
  value: number;
  fill: string;
  piecesCount: number;
}

interface DashboardChartsProps {
  monthlyChartData: MonthlyChartItem[];
  agencyChartData: AgencyChartItem[];
}

export default function DashboardCharts({ monthlyChartData, agencyChartData }: DashboardChartsProps) {
  return (
    <div id="dashboard-charts-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Plot 1: Monthly distribution */}
      <div id="chart-monthly-distribution" className="lg:col-span-2 space-y-4">
        <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
          Volume mensal de peças desenvolvidas (Criadas x Adaptadas)
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyChartData}
              margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="formattedMonth" 
                stroke="#94a3b8" 
                fontSize={10} 
                fontWeight="bold" 
                tickLine={false} 
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                fontWeight="bold" 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: "#fff", 
                  borderColor: "#e2e8f0", 
                  borderRadius: "12px", 
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" 
                }}
              />
              <Legend 
                iconType="circle" 
                wrapperStyle={{ fontSize: 11, fontWeight: "bold", paddingTop: 10 }}
              />
              <Bar 
                dataKey="criadas" 
                name="Peças Criadas" 
                fill="#6204bd" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={45}
              />
              <Bar 
                dataKey="adaptadas" 
                name="Peças Adaptadas" 
                fill="#f07507" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={45} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Plot 2: Pie distribution */}
      <div id="chart-agency-distribution" className="space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-5 lg:pt-0 lg:pl-6">
        <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
          Investimento Governamental por Município (Líquido)
        </h3>
        {agencyChartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 p-4">
            <p className="text-xs font-semibold">Sem faturamento no período.</p>
            <p className="text-[10px] text-slate-350 mt-1">Crie investimentos via propostas para alimentar o mapa financeiro.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={agencyChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {agencyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 select-none">
              {agencyChartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="font-bold text-slate-650">{item.name}</span>
                  </div>
                  <div>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(item.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sparkline trend lines */}
      <div id="chart-trendlines" className="lg:col-span-3 border-t border-slate-100 pt-5 space-y-3">
        <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
          Linha de Tendência de Faturamento Mensal
        </h3>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyChartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
              <XAxis dataKey="formattedMonth" stroke="#ccd6e0" fontSize={10} fontWeight="bold" tickLine={false} />
              <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              <Line 
                type="monotone" 
                dataKey="faturamento" 
                stroke="#6204bd" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
