import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import mockPaymentsData from '@/lib/mocks/payments.json';
import AppHeader from '@/components/layout/AppHeader'; // Asumo que AppHeader está en esta ruta
import AppFooter from '@/components/layout/AppFooter'; // Asumo que AppFooter está en esta ruta
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Payment {
  id: string;
  valor: number;
  fecha: string;
  estado: string;
  external_id: string;
  status: string;
  trip_id: string;
}

export default async function PaymentDetailPage({ params }: { params: { payment_id: string } }) {
  const { payment_id } = await params;

  const payment = mockPaymentsData.find((p) => p.id === payment_id) as Payment | undefined;

  if (!payment) {
    // Si la liquidación no se encuentra, se redirige a una página 404
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-900/50 text-slate-100 flex flex-col">
      <AppHeader />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-slate-900/70 p-8 rounded-lg shadow-lg border border-slate-800">
          <h1 className="text-3xl font-bold text-white mb-8 border-b border-slate-800 pb-4">
            Detalle de Liquidación <span className="text-yellow-500">#{payment.id}</span>
          </h1>

          <div className="space-y-6">
            <div>
              <p className="text-slate-400 text-sm">Fecha:</p>
              <p className="text-white text-lg font-semibold">
                {format(new Date(payment.fecha), 'dd/MM/yyyy - HH:mm', { locale: es })}
              </p>
            </div>

            <div>
              <p className="text-slate-400 text-sm">Valor:</p>
              <p className="text-white text-xl font-bold">
                ${payment.valor.toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-slate-400 text-sm">Estado:</p>
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                payment.estado === 'Completado' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'
              }`}>
                {payment.estado}
              </span>
            </div>

            <div>
              <p className="text-slate-400 text-sm">ID de Transacción Externa:</p>
              <p className="text-white text-lg">{payment.external_id}</p>
            </div>

            <div>
              <p className="text-slate-400 text-sm">Estado de Transacción (interno):</p>
              <p className="text-white text-lg">{payment.status}</p>
            </div>

            <div>
              <p className="text-slate-400 text-sm">ID del Viaje Asociado:</p>
              <Link href={`/trips/${payment.trip_id}`}>
                <Button variant="link" className="p-0 h-auto text-lg text-yellow-500 hover:text-yellow-400">
                  {payment.trip_id}
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-10 flex justify-end">
            <Link href="/payments">
              <Button className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold rounded-lg transition-colors">
                Volver a Liquidaciones
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
