import React from 'react';

export default function JourneyConversionCard({ stages: propStages, dropoffAlert }) {
  const defaultFunnelStages = [
    {
      id: 'visit',
      name: 'Buka Bio',
      percentage: 100,
      clients: '212 rb klik',
      barColor: 'bg-[#ddd6fe] hover:bg-[#c4b5fd]',
      textColor: 'text-slate-800',
    },
    {
      id: 'explore',
      name: 'Eksplor Link',
      percentage: 84,
      clients: '178 rb klik',
      barColor: 'bg-[#ddd6fe] hover:bg-[#c4b5fd]',
      textColor: 'text-slate-800',
    },
    {
      id: 'select',
      name: 'Pilih Produk',
      percentage: 58,
      clients: '123 rb klik',
      barColor: 'bg-[#f59e0b] hover:bg-[#d97706]', // Highlighting biggest drop in amber
      textColor: 'text-amber-800 font-bold',
      isWarning: true,
    },
    {
      id: 'whatsapp_buy',
      name: 'Klik WA / Beli',
      percentage: 55,
      clients: '117 rb klik',
      barColor: 'bg-[#ddd6fe] hover:bg-[#c4b5fd]',
      textColor: 'text-slate-800',
    },
    {
      id: 'form_fill',
      name: 'Isi Pesanan',
      percentage: 53,
      clients: '112 rb klik',
      barColor: 'bg-[#ddd6fe] hover:bg-[#c4b5fd]',
      textColor: 'text-slate-800',
    },
    {
      id: 'checkout',
      name: 'Checkout',
      percentage: 53,
      clients: '112 rb klik',
      barColor: 'bg-[#ddd6fe] hover:bg-[#c4b5fd]',
      textColor: 'text-slate-800',
    },
    {
      id: 'payment_success',
      name: 'Bayar Sukses',
      percentage: 47,
      clients: '100 rb order',
      barColor: 'bg-[#ddd6fe] hover:bg-[#c4b5fd]',
      textColor: 'text-slate-800',
    },
    {
      id: 'repeat_order',
      name: 'Repeat Order',
      percentage: 36,
      clients: '76 rb buyer',
      barColor: 'bg-[#bef264] hover:bg-[#a3e635]', // Target conversion outcome in fresh lime
      textColor: 'text-emerald-900 font-bold',
      isSuccess: true,
    },
  ];

  const funnelStages = (propStages && propStages.length > 0)
    ? propStages.map((s) => {
        const isWarning = s.isWarning ?? s.is_warning ?? false;
        const isSuccess = s.isSuccess ?? s.is_success ?? false;
        const barColor = s.barColor || s.bar_color || (isWarning ? 'bg-[#f59e0b] hover:bg-[#d97706]' : isSuccess ? 'bg-[#bef264] hover:bg-[#a3e635]' : 'bg-[#ddd6fe] hover:bg-[#c4b5fd]');
        return {
          ...s,
          isWarning,
          isSuccess,
          barColor,
        };
      })
    : defaultFunnelStages;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      {/* Header with Alert Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Corong Konversi Pengunjung</h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Persentase alur interaksi audiens bio link hingga menyelesaikan pesanan
          </p>
        </div>

        {/* Highlighted Warning Pill */}
        <span className="self-start sm:self-auto text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full shadow-2xs">
          {dropoffAlert || 'Penurunan Terbesar: Eksplor Link → Pilih Produk'}
        </span>
      </div>

      {/* Funnel Bar Chart */}
      <div className="pt-6 overflow-x-auto scrollbar-none">
        <div className="min-w-[520px] flex items-end justify-between gap-2.5 sm:gap-3.5 h-[200px] pb-2">
          {funnelStages.map((stage) => {
            const barHeightPx = Math.round((stage.percentage / 100) * 155);

            return (
              <div
                key={stage.id}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              >
                {/* Percentage label above the bar */}
                <span
                  className={`text-[11px] font-bold mb-1.5 transition-transform group-hover:-translate-y-0.5 ${
                    stage.isWarning
                      ? 'text-amber-700'
                      : stage.isSuccess
                      ? 'text-emerald-800'
                      : 'text-slate-700'
                  }`}
                >
                  {stage.percentage}%
                </span>

                {/* Vertical Bar */}
                <div
                  className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 shadow-2xs ${stage.barColor}`}
                  style={{ height: `${barHeightPx}px` }}
                />

                {/* Stage Title */}
                <span className="text-[11px] font-bold text-slate-800 mt-2.5 truncate max-w-[62px] text-center">
                  {stage.name}
                </span>

                {/* Stage Count Subtitle */}
                <span className="text-[9px] text-slate-400 font-medium truncate max-w-[62px] text-center font-mono">
                  {stage.clients}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
