import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { Truck, MapPin, Package, Phone, Calendar } from 'lucide-react'
import { formatDate, EQUIPMENT_TYPES } from '../utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function DeliveriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['deliveries-today'],
    queryFn: () => api.get('/rentals/deliveries/today').then(r => r.data),
    refetchInterval: 120_000,
  })

  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Entregas do Dia</h1>
        <p className="text-slate-500 text-sm mt-0.5 capitalize">{today}</p>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-slate-400">Carregando entregas...</div>
      ) : data?.length === 0 ? (
        <div className="card p-12 text-center">
          <Truck size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma entrega programada para hoje</p>
          <p className="text-slate-400 text-sm mt-1">Locações com início hoje aparecerão aqui</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map(rental => (
            <div key={rental.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{rental.client?.name}</h3>
                  {rental.client?.phone && (
                    <a href={`tel:${rental.client.phone}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline mt-0.5">
                      <Phone size={12} /> {rental.client.phone}
                    </a>
                  )}
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                  {rental.totalDays} dias
                </span>
              </div>

              <div className="flex items-start gap-2 text-sm text-slate-600 mb-3">
                <MapPin size={15} className="text-slate-400 mt-0.5 shrink-0" />
                <span>{rental.address}</span>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Package size={12} /> Equipamentos
                </p>
                {rental.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                    <span className="text-slate-700">{item.equipment?.name}</span>
                    <span className="font-bold text-slate-800">× {item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                <Calendar size={12} />
                Retorno: {formatDate(rental.endDate)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
