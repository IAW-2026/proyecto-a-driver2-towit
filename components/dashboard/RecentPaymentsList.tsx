"use client";

import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import mockPaymentsData from '@/lib/mocks/payments.json'; // Importa el archivo JSON

interface Payment {
  id: string;
  valor: number;
  fecha: string;
  estado: string;
}

export default function RecentPaymentsList() {
  // Obtener las últimas 2 liquidaciones del JSON
  const recentPayments: Payment[] = mockPaymentsData
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()) // Ordenar por fecha descendente
    .slice(0, 2) as Payment[]; // Tomar las dos más recientes

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 flex flex-col h-full">
      <h3 className="text-lg font-bold text-white mb-4">Últimas liquidaciones</h3>
      <ul className="space-y-3 flex-1">
        {recentPayments.map((payment) => (
          <li key={payment.id} className="border-b border-slate-800 pb-3 last:border-b-0 last:pb-0">
            <p className="text-white text-base">-${payment.valor.toFixed(2)}</p>
            <p className="text-slate-400 text-sm">{format(new Date(payment.fecha), 'dd/MM/yyyy', { locale: es })} - {payment.estado}</p>
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
