"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link"; // Asegúrate de importar Link si lo vas a usar para ir al detalle
import { Button } from "@/components/ui/button";

interface Payment {
  id: string;
  date: string;
  amount: number;
  status: string;
  tripId: string; // Referencia al viaje asociado
}

export default function PaymentList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para mockear la carga de pagos
  useEffect(() => {
    const fetchMockPayments = async () => {
      setIsLoading(true);
      setError(null);
      // Simula una llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockData: Payment[] = [
        { id: "pay_001", date: "2026-05-29", amount: 150.00, status: "Completado", tripId: "trip_ABC" },
        { id: "pay_002", date: "2026-05-28", amount: 120.50, status: "Completado", tripId: "trip_DEF" },
        { id: "pay_003", date: "2026-05-27", amount: 200.00, status: "Completado", tripId: "trip_GHI" },
        // Puedes dejar este array vacío para probar el estado sin pagos:
        // []
      ];

      if (mockData.length > 0) {
        setPayments(mockData);
      } else {
        // En un caso real, podrías simular un error o simplemente devolver un array vacío
        setPayments([]);
      }
      setIsLoading(false);
    };

    fetchMockPayments();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 bg-slate-900/70 rounded-lg shadow-lg border border-slate-800">
        <p className="text-slate-400">Cargando liquidaciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg text-center bg-red-600/20 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 text-center">
        <p className="text-slate-400 text-lg">Aún no tienes liquidaciones. ¡Es hora de empezar a remolcar!</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800">
      <ul className="space-y-4">
        {payments.map((payment) => (
          <li key={payment.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-white text-lg font-semibold">-${payment.amount.toFixed(2)}</p>
              <p className="text-slate-400 text-sm">{payment.date} - {payment.status}</p>
            </div>
            <Link href={`/payments/${payment.id}`}>
              <Button variant="secondary" size="sm">
                Ver Detalles
              </Button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
