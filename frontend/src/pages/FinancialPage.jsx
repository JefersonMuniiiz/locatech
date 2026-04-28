import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'
import Table from '../components/ui/Table'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { DollarSign, TrendingUp, Clock, AlertCircle, CreditCard, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate, PAYMENT_STATUS, PAYMENT_METHODS, RENTAL_STATUS } from '../utils'

export default function FinancialPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentModal, setPaymentModal] = useState(null)
  const [payForm, setPayForm] = useState({ status: 'PAID', method: 'PIX', notes: '' })

  const { data: rentals, isLoading } = useQuery({
    queryKey: ['rentals-financial', statusFilter],
    queryFn: () => api.get('/rentals').then(r => r.data),
  })

  const updatePayment = useMutation({
    mutationFn: ({ id, ...d }) => api.patch(`/rentals/${id}/payment`, d),
    onSuccess: () => { toast.success('Pagamento atualizado!'); qc.invalidateQueries(['rentals-financial']); qc.invalidateQueries(['dashboard']); setPaymentModal(null) },
    onError: err => toast.error(err.response?.data?.error || 'Erro'),
  })

  const allPayments = rentals?.filter(r => r.payment) || []
  const filtered = statusFilter ? allPayments.filter(r => r.payment?.status === statusFilter) : allPayments

  const totalPaid = allPayments.filter(r => r.payment?.status === 'PAID').reduce((s, r) => s + Number(r.payment.totalAmount), 0)
  const totalPending = allPayments.filter(r => r.payment?.status === 'PENDING').reduce((s, r) => s + Number(r.payment.totalAmount), 0)
  const totalOverdue = allPayments.filter(r => r.payment?.status === 'OVERDUE').reduce((s, r) => s + Number(r.payment.totalAmount), 0)

  const columns = [
    { header: 'Cliente', render: r => <span className="font-medium">{r.client?.name}</span> },
    { header: 'Período', render: r => `${formatDate(r.startDate)} → ${formatDate(r.endDate)}` },
    { header: 'Valor', render: r => formatCurrency(r.payment?.amount) },
    { header: 'Multa', render: r => r.payment?.fineAmount > 0 ? <span className="text-red-600 font-medium">{formatCurrency(r.payment.fineAmount)}</span> : '—' },
    { header: 'Total', render: r => <span className="font-bold">{formatCurrency(r.payment?.totalAmount)}</span> },
    { header: 'Status', render: r => <Badge {...PAYMENT_STATUS[r.payment?.status]} /> },
    {
      header: '', className: 'w-16',
      render: r => r.payment?.status !== 'PAID' && (
        <button
          onClick={() => { setPaymentModal(r); setPayForm({ status: 'PAID', method: 'PIX', notes: '' }) }}
          className="p-1.5 hover:bg-blue-50 rounded-lg"
          title="Registrar pagamento"
        >
          <CreditCard size={14} className="text-blue-600" />
        </button>
      )
    },
  ]

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">Financeiro</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><TrendingUp size={20} className="text-green-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Recebido</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg"><Clock size={20} className="text-yellow-600" /></div>
            <div>
              <p className="text-sm text-slate-500">A Receber</p>
              <p className="text-xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg"><AlertCircle size={20} className="text-red-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Vencidos</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <select className="input w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos os pagamentos</option>
          {Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="card">
        <Table columns={columns} data={filtered} loading={isLoading} emptyMsg="Nenhum pagamento encontrado" />
      </div>

      <Modal open={!!paymentModal} onClose={() => setPaymentModal(null)} title="Registrar Pagamento">
        {paymentModal && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1">
              <p>Cliente: <strong>{paymentModal.client?.name}</strong></p>
              <p>Valor base: <strong>{formatCurrency(paymentModal.payment?.amount)}</strong></p>
              {paymentModal.payment?.fineAmount > 0 && (
                <p className="text-red-600">Multa: <strong>{formatCurrency(paymentModal.payment.fineAmount)}</strong></p>
              )}
              <p>Total: <strong className="text-lg">{formatCurrency(paymentModal.payment?.totalAmount)}</strong></p>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={payForm.status} onChange={e => setPayForm(p => ({ ...p, status: e.target.value }))}>
                {Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Forma de Pagamento</label>
              <select className="input" value={payForm.method} onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))}>
                {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Observações</label>
              <textarea className="input resize-none" rows={2} value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setPaymentModal(null)}>Cancelar</button>
              <button
                className="btn-primary flex-1 justify-center"
                disabled={updatePayment.isPending}
                onClick={() => updatePayment.mutate({ id: paymentModal.id, ...payForm })}
              >
                {updatePayment.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
