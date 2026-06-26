import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface MonthlyTripsSummaryProps {
  currentMonthCount: number;
  previousMonthCount: number;
}

export default function MonthlyTripsSummary({ currentMonthCount, previousMonthCount }: MonthlyTripsSummaryProps) {
  // Calcula el porcentaje de cambio. Maneja el caso de previousMonthCount ser cero para evitar división por cero.
  const percentageChange = previousMonthCount > 0
    ? ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100
    : (currentMonthCount > 0 ? 100 : 0); // Si el mes anterior fue 0 y este no, es 100% de aumento. Si ambos 0, es 0%.
  const isIncrease = percentageChange >= 0;

  return (
    <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border border-slate-800 h-full flex flex-col">
      <h3 className="text-lg font-bold text-white mb-4">Viajes este mes</h3>
      <div className="flex items-center justify-between lg:justify-around text-sm flex-1 flex-wrap">
        <p className="text-4xl font-extrabold text-yellow-500">{currentMonthCount}</p>
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
