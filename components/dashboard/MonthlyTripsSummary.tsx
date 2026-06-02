"use client";

import React from "react";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"; // Asumiendo que usas lucide-react

export default function MonthlyTripsSummary() {
  // Datos mockeados
  const currentMonthTrips = 45;
  const previousMonthTrips = 38;
  const percentageChange = ((currentMonthTrips - previousMonthTrips) / previousMonthTrips) * 100;
  const isIncrease = percentageChange >= 0;

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 h-full flex flex-col">
      <h3 className="text-lg font-bold text-white mb-4">Viajes este mes</h3>
      <div className="flex items-center justify-between lg:justify-around text-sm flex-1 flex-wrap">
        <p className="text-4xl font-extrabold text-yellow-500">{currentMonthTrips}</p>
        <div className="flex">
          {isIncrease ? (
            <ArrowUpIcon className="size-4.5 text-green-500 mr-1" />
          ) : (
            <ArrowDownIcon className="size-4.5 text-red-500 mr-1" />
          )}
          <span className={isIncrease ? "text-green-500" : "text-red-500"}>
            {percentageChange.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
