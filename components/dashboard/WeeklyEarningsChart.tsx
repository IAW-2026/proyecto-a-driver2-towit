"use client";

import React from "react";

export default function WeeklyEarningsChart() {
  // Datos mockeados para los últimos 7 días, incluyendo hoy.
  // El último elemento será el día actual.
  const earningsData = [
    { day: "Lun", amount: 120 },
    { day: "Mar", amount: 150 },
    { day: "Mié", amount: 90 },
    { day: "Jue", amount: 180 },
    { day: "Vie", amount: 220 },
    { day: "Sáb", amount: 250 },
    { day: "Dom", amount: 300 }, // Hoy
  ];

  const maxAmount = Math.max(...earningsData.map(d => d.amount));
  const todayIndex = earningsData.length - 1;

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 col-span-full md:col-span-2 flex flex-col h-full">
      <h3 className="text-lg font-bold text-white mb-4">Ganancias de la última semana</h3>
      <div className="flex flex-1 items-end justify-around h-48 mt-4">
        {earningsData.map((data, index) => (
          <div key={data.day} className="flex flex-col items-center h-full justify-end group">
            <div
              className={`w-6 rounded-t-md transition-all duration-300 ${
                index === todayIndex ? "bg-yellow-500" : "bg-blue-500 hover:bg-blue-400"
              }`}
              style={{ height: `${(data.amount / maxAmount) * 90 + 10}%` }} // Altura relativa con un mínimo para visibilidad
            ></div>
            <span className="mt-2 text-xs text-slate-400 group-hover:text-white transition-colors">{data.day}</span>
            <span className="absolute text-xs text-white translate-y-[-120%] opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 px-2 py-1 rounded">
              ${data.amount}
            </span>
          </div>
        ))}
      </div>
      <p className="text-right text-sm text-slate-500 mt-4">Total: ${earningsData.reduce((sum, d) => sum + d.amount, 0)}</p>
    </div>
  );
}
