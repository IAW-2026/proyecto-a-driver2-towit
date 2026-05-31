"use client";

import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";

export default function RecentPaymentsList() {
  // Datos mockeados
  const recentPayments = [
    { id: "pay_001", date: "2026-05-29", amount: 150.00, status: "Completado" },
    { id: "pay_002", date: "2026-05-28", amount: 120.50, status: "Completado" },
    { id: "pay_003", date: "2026-05-27", amount: 95.75, status: "Completado" },
  ];

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 flex flex-col h-full">
      <h3 className="text-lg font-bold text-white mb-4">Últimas liquidaciones</h3>
      <ul className="space-y-3 flex-1">
        {recentPayments.map((payment) => (
          <li key={payment.id} className="border-b border-slate-800 pb-3 last:border-b-0 last:pb-0">
            <p className="text-white text-base">-${payment.amount.toFixed(2)}</p>
            <p className="text-slate-400 text-sm">{payment.date} - {payment.status}</p>
          </li>
        ))}
      </ul>
      <Link href="/payments" className="mt-6 w-full">
        <Button className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold">
          Ver todas las liquidaciones
        </Button>
      </Link>
    </div>
  );
}
