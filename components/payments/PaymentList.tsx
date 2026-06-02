"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link"; // Asegúrate de importar Link si lo vas a usar para ir al detalle
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; // Importa el locale español para format
import { Button } from "@/components/ui/button";
import mockPaymentsData from '@/lib/mocks/payments.json'; // Importa el archivo JSON

interface Payment {
  id: string; // Para mostrar en la tabla, puede ser external_id o un ID interno si lo necesitamos
  valor: number;
  fecha: string;
  estado: string; // Siempre "Completado" según la descripción
  external_id: string;
  status: string;
  trip_id: string; // Referencia al viaje asociado
}

export default function PaymentList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Como es un mock local, la carga es instantánea
    setIsLoading(true);
    setError(null);
    try {
      // Usar los datos importados directamente
      setPayments(mockPaymentsData as Payment[]); // Castear para asegurar el tipo
      setIsLoading(false);
    } catch (err: any) {
      setError("Error al cargar las liquidaciones: " + err.message);
      setIsLoading(false);
    }
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
              <p className="text-white text-lg font-semibold">-${payment.valor.toFixed(2)}</p>
              <p className="text-slate-400 text-sm">
                {format(new Date(payment.fecha), 'dd/MM/yyyy', { locale: es })} - {payment.estado}
              </p>
              <p className="text-slate-400 text-xs mt-1">ID Transacción: {payment.external_id}</p>
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
