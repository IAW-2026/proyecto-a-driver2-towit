"use client";

import React from "react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, LabelList } from "recharts";

export default function WeeklyEarningsChart() {
  // Datos mockeados para los últimos 7 días, incluyendo hoy.
  // El último elemento será el día actual.
  const earningsData = [
    { day: "Lun", valor: 120 },
    { day: "Mar", valor: 150 },
    { day: "Mié", valor: 90 },
    { day: "Jue", valor: 180 },
    { day: "Vie", valor: 220 },
    { day: "Sáb", valor: 250 },
    { day: "Dom", valor: 300 }, // Hoy
  ];

  const totalEarnings = earningsData.reduce((sum, d) => sum + d.valor, 0);

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 flex flex-col h-full">
      <h3 className="text-lg font-bold text-white mb-4">Ganancias de la última semana</h3>
      <div className="flex-1 flex justify-center items-center mt-4">
        <AreaChart
          width={700} // Ajusta el ancho según sea necesario o usa ResponsiveContainer si lo añades más tarde
          height={192} // h-48 es 192px
          data={earningsData}
          margin={{ top: 30, right: 20, left: 20, bottom: 0 }} // Aumentado el margen superior para evitar el recorte de la etiqueta del valor máximo
        >
          <defs>
            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.741 0.17 91.8)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="oklch(0.741 0.17 91.8)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="day" stroke="oklch(0.708 0 0)" tickLine={false} axisLine={false} />
          <YAxis hide={true} domain={['dataMin', 'dataMax']} /> {/* YAxis oculta para tooltip */}
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.205 0 0)" opacity={0.5} />
          <Area
            type="step" // Usamos "linear" según tu solicitud anterior
            dataKey="valor"
            stroke="oklch(0.741 0.17 91.8)"
            fill="url(#colorEarnings)"
            strokeWidth={2}
          >
            <LabelList
              dataKey="valor"
              position="top"
              // Acepta valores de distinto tipo (number | string | null | undefined) que vienen de Recharts
              formatter={(value: any) => {
                const num = typeof value === "number" ? value : Number(value ?? 0);
                return `$${num.toFixed(0)}`;
              }}
              fill="oklch(0.985 0 0)" // Color blanco para las etiquetas
              fontSize={12}
            />
          </Area>
        </AreaChart>
      </div>
      <p className="text-center text-sm text-slate-500 mt-4">Total: ${totalEarnings.toFixed(2)}</p>
    </div>
  );
}
