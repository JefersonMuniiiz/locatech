import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'
import Badge from '../components/ui/Badge'
import { Bell, AlertTriangle, Clock, CheckCircle, CreditCard, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate, RENTAL_STATUS, PAYMENT_STATUS } from '../utils'
import { differenceInDays, addDays } from 'date-fns'
import { useState } from 'react'
import Modal from '../components/ui/Modal'

export default function AlertsPage() {
  const qc = useQueryClient()
  const [paymentModal, setPaymentModal] = useState(null)
  const [payForm, setPayForm] = useState({ status: 'PAID', method: 'PIX', notes: '' })

  const { data: rentals, isLoading } = useQuery({
    queryKey: ['rentals-alerts'],
    queryFn: () => api.get('/rentals').then(r => r.data),
    refetchInterval: 60_000,
  })

  const complete = useMutation({
    mutationFn: id => api.patch(`/rentals/${id}/complete`),
    onSuccess: () => { toast.success('Locação finalizada!'); qc.invalidateQueries(['rentals-alerts']); qc.invalidateQueries(['dashboard']) },
    onError: err => toast.error(err.response?.data?.error || 'Erro'),
  })

  const updatePayment = useMutation({
    mutationFn: ({ id, ...d }) => api.patch(`/rentals/${id}/payment`, d),
    onSuccess: () => { toast.success('Pagamento registrado!'); qc.invalidateQueries(['rentals-alerts']); setPaymentModal(null) },
    onError: err => toast.error(err.response?.data?.error || 'Erro'),
  })

  const now = new Date()
  const in3days = addDays(now, 3)

  const delayed = rentals?.filter(r => r.status === 'DELAYED') || []
  const dueSoon = rentals?.filter(r => {
    if (r.status !== 'ACTIVE') return false
    const end = new Date(r.endDate)
    return end >= now && end <= in3days
  }) || []
  const unpaid = rentals?.filter(r =>
    (r.status === 'COMPLETED' || r.status === 'DELAYED') &&
    r.payment?.status !== 'PAID'
  ) || []

  const totalAlerts = delayed.length + dueSoon.length + unpaid.length

  const Section = ({ icon: Icon, color, title, count, children }) => (
    <div className="card overflow-hidden">
      <div className={`p-4 border-b flex items-center gap-3 ${color}`}>
        <Icon size={18} />
        <h2 className="font-semibold">{title}</h2>
        <span className="ml-auto text-sm font-bold">{count}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {count === 0
          ? <p className="py-6 text-center text-slate-400 text-sm">Nenhum alerta nesta categoria 🎉</p>
          : children
        }
      </div>
    </div>
  )

  const RentalRow = ({ r, showDaysLate, showDueIn }) => {
    const daysLate = showDaysLate ? differenceInDays(now, new Date(r.endDate)) : null
    const dueIn = showDueIn ? differenceInDays(new Date(r.endDate), now) : null

    return (
      <div className="flex items-center justify-between p-4 hover:bg-slate-50">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800">{r.client?.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Venceu em {formatDate(r.endDate)}
            {daysLate !== null && <span className="ml-1 text-red-600 font-semibold">{daysLate} dia(s) atrasado</span>}
            {dueIn !== null && <span className="ml-1 text-yellow-600 font-semibold">vence em {dueIn} dia(s)</span>}
          </p>
          <p className="text-xs text-slate-500">{formatCurrency(r.payment?.totalAmount)}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Badge {...RENTAL_STATUS[r.status]} />
          {(r.status === 'ACTIVE' || r.status === 'DELAYED') && (
            <button onClick={() => { if (confirm('Finalizar locação?')) complete.mutate(r.id) }}
              className="p-1.5 hover:bg-green-50 rounded-lg" title="Finalizar">
              <CheckCircle size={15} className="text-green-600" />
            </button>
          )}
          {r.payment?.status !== 'PAID' && (
            <button onClick={() => { setPaymentModal(r); setPayForm({ status: 'PAID', method: 'PIX', notes: '' }) }}
              className="p-1.5 hover:bg-blue-50 rounded-lg" title="Registrar pagamento">
              <CreditCard size={15} className="text-blue-600" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Alertas</h1>
        {totalAlerts > 0 && (
          <span className="bg-red-100 text-red-700 text-sm font-bold px-2.5 py-0.5 rounded-full">
            {totalAlerts}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-slate-400">Carregando alertas...</div>
      ) : totalAlerts === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium text-lg">Tudo em ordem! 🎉</p>
          <p className="text-slate-400 text-sm mt-1">Nenhum alerta pendente no momento</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Section icon={AlertTriangle} color="bg-red-50 text-red-700 border-red-100" title="Locações Atrasadas" count={delayed.length}>
            {delayed.map(r => <RentalRow key={r.id} r={r} showDaysLate />)}
          </Section>

          <Section icon={Clock} color="bg-yellow-50 text-yellow-700 border-yellow-100" title="Vencem nos Próximos 3 Dias" count={dueSoon.length}>
            {dueSoon.map(r => <RentalRow key={r.id} r={r} showDueIn />)}
          </Section>

          <Section icon={CreditCard} color="bg-blue-50 text-blue-700 border-blue-100" title="Pagamentos Pendentes (locações encerradas)" count={unpaid.length}>
            {unpaid.map(r => <RentalRow key={r.id} r={r} />)}
          </Section>
        </div>
      )}

      <Modal open={!!paymentModal} onClose={() => setPaymentModal(null)} title="Registrar Pagamento">
        {paymentModal && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1">
              <p>Cliente: <strong>{paymentModal.client?.name}</strong></p>
              <p>Total: <strong>{formatCurrency(paymentModal.payment?.totalAmount)}</strong></p>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={payForm.status} onChange={e => setPayForm(p => ({ ...p, status: e.target.value }))}>
                <option value="PAID">Pago</option>
                <option value="PARTIAL">Parcial</option>
              </select>
            </div>
            <div>
              <label className="label">Forma de Pagamento</label>
              <select className="input" value={payForm.method} onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))}>
                <option value="PIX">PIX</option>
                <option value="CASH">Dinheiro</option>
                <option value="CREDIT_CARD">Cartão de Crédito</option>
                <option value="DEBIT_CARD">Cartão de Débito</option>
                <option value="BANK_TRANSFER">Transferência</option>
                <option value="BOLETO">Boleto</option>
              </select>
            </div>
            <div>
              <label className="label">Observações</label>
              <textarea className="input resize-none" rows={2} value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setPaymentModal(null)}>Cancelar</button>
              <button className="btn-primary flex-1 justify-center" disabled={updatePayment.isPending}
                onClick={() => updatePayment.mutate({ id: paymentModal.id, ...payForm })}>
                {updatePayment.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
