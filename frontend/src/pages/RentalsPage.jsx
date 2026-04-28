import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import Table from '../components/ui/Table'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { Plus, Search, Eye, CheckCircle, CreditCard, Loader2, FileText as FilePdf } from 'lucide-react'
import { formatCurrency, formatDate, RENTAL_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from '../utils'
import { generateContractHTML, generateReceiptHTML, openPrintWindow } from '../utils/pdfGenerator'
import { useAuth } from '../context/AuthContext'
import BillingModal from '../components/ui/BillingModal'
import DamageFinesModal from '../components/ui/DamageFinesModal'

export default function RentalsPage() {
  const { company } = useAuth()
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [detailModal, setDetailModal] = useState(null)
  const [paymentModal, setPaymentModal] = useState(null)
  const [billingModal, setBillingModal] = useState(null)
  const [damageModal, setDamageModal] = useState(null)
  const [payForm, setPayForm] = useState({ status: 'PAID', method: 'PIX', notes: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['rentals', statusFilter],
    queryFn: () => api.get('/rentals', { params: { status: statusFilter || undefined } }).then(r => r.data),
  })

  const complete = useMutation({
    mutationFn: id => api.patch(`/rentals/${id}/complete`),
    onSuccess: () => { toast.success('Locação finalizada!'); qc.invalidateQueries(['rentals']); qc.invalidateQueries(['dashboard']); setDetailModal(null) },
    onError: err => toast.error(err.response?.data?.error || 'Erro ao finalizar'),
  })

  const updatePayment = useMutation({
    mutationFn: ({ id, ...d }) => api.patch(`/rentals/${id}/payment`, d),
    onSuccess: () => { toast.success('Pagamento atualizado!'); qc.invalidateQueries(['rentals']); qc.invalidateQueries(['dashboard']); setPaymentModal(null) },
    onError: err => toast.error(err.response?.data?.error || 'Erro ao atualizar pagamento'),
  })

  const columns = [
    {
      header: 'Cliente',
      render: r => <div><p className="font-medium text-slate-800">{r.client?.name}</p><p className="text-xs text-slate-400">{r.items?.length} item(s)</p></div>
    },
    { header: 'Início', render: r => formatDate(r.startDate) },
    { header: 'Fim Previsto', render: r => formatDate(r.endDate) },
    { header: 'Total', render: r => <span className="font-semibold">{formatCurrency(r.totalAmount)}</span> },
    { header: 'Status', render: r => <Badge {...RENTAL_STATUS[r.status]} /> },
    {
      header: 'Pagamento',
      render: r => r.payment ? <Badge {...PAYMENT_STATUS[r.payment.status]} /> : '—'
    },
    {
      header: '', className: 'w-28',
      render: r => (
        <div className="flex gap-1">
          <button onClick={() => setDetailModal(r)} className="p-1.5 hover:bg-slate-100 rounded-lg" title="Detalhes">
            <Eye size={14} className="text-slate-500" />
          </button>
          {(r.status === 'ACTIVE' || r.status === 'DELAYED') && (
            <button onClick={() => { if (confirm('Finalizar esta locação?')) complete.mutate(r.id) }} className="p-1.5 hover:bg-green-50 rounded-lg" title="Finalizar">
              <CheckCircle size={14} className="text-green-600" />
            </button>
          )}
          {r.payment && r.payment.status !== 'PAID' && (
            <button onClick={() => { setPaymentModal(r); setPayForm({ status: 'PAID', method: 'PIX', notes: '' }) }} className="p-1.5 hover:bg-blue-50 rounded-lg" title="Registrar pagamento">
              <CreditCard size={14} className="text-blue-600" />
            </button>
          )}
          <button onClick={() => openPrintWindow(generateContractHTML(r, company))} className="p-1.5 hover:bg-slate-100 rounded-lg" title="Gerar Contrato PDF">
            <FilePdf size={14} className="text-slate-500" />
          </button>
          <button onClick={() => setBillingModal(r)} className="p-1.5 hover:bg-green-50 rounded-lg" title="Gerar Boleto/PIX">
            <CreditCard size={14} className="text-green-600" />
          </button>
          <button onClick={() => setDamageModal(r)} className="p-1.5 hover:bg-orange-50 rounded-lg" title="Multas por Danos">
            <span className="text-orange-500 text-xs font-bold">R$</span>
          </button>
        </div>
      )
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Locações</h1>
        <Link to="/rentals/new" className="btn-primary"><Plus size={16} /> Nova Locação</Link>
      </div>

      <div className="card p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(RENTAL_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="card">
        <Table
          columns={columns}
          data={data?.filter(r => !search || r.client?.name.toLowerCase().includes(search.toLowerCase()))}
          loading={isLoading}
        />
      </div>

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Detalhes da Locação" size="lg">
        {detailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Cliente:</span> <span className="font-medium">{detailModal.client?.name}</span></div>
              <div><span className="text-slate-500">Status:</span> <Badge {...RENTAL_STATUS[detailModal.status]} /></div>
              <div><span className="text-slate-500">Início:</span> {formatDate(detailModal.startDate)}</div>
              <div><span className="text-slate-500">Fim:</span> {formatDate(detailModal.endDate)}</div>
              <div><span className="text-slate-500">Dias:</span> {detailModal.totalDays}</div>
              <div><span className="text-slate-500">Endereço:</span> {detailModal.address}</div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Itens</p>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {detailModal.items?.map((item, i) => (
                  <div key={i} className="flex justify-between px-4 py-2.5 text-sm border-b border-slate-100 last:border-0">
                    <span>{item.equipment?.name} × {item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.totalAmount)}</span>
                  </div>
                ))}
                {detailModal.fineAmount > 0 && (
                  <div className="flex justify-between px-4 py-2.5 text-sm bg-red-50 text-red-700">
                    <span>Multa por atraso</span>
                    <span className="font-medium">{formatCurrency(detailModal.fineAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-2.5 text-sm font-bold bg-slate-50">
                  <span>Total</span>
                  <span>{formatCurrency(Number(detailModal.totalAmount) + Number(detailModal.fineAmount))}</span>
                </div>
              </div>
            </div>

            {detailModal.payment && (
              <div className="p-3 bg-slate-50 rounded-lg text-sm">
                <span className="text-slate-500">Pagamento: </span>
                <Badge {...PAYMENT_STATUS[detailModal.payment.status]} />
                {detailModal.payment.paidAt && <span className="text-slate-500 ml-2">em {formatDate(detailModal.payment.paidAt)}</span>}
              </div>
            )}

            {detailModal.notes && (
              <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                <strong>Obs:</strong> {detailModal.notes}
              </div>
            )}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button className="btn-secondary flex-1 justify-center text-xs" onClick={() => openPrintWindow(generateContractHTML(detailModal, company))}>
                <FilePdf size={14} /> Contrato PDF
              </button>
              {detailModal.payment?.status === 'PAID' && (
                <button className="btn-secondary flex-1 justify-center text-xs" onClick={() => openPrintWindow(generateReceiptHTML(detailModal, company))}>
                  <FilePdf size={14} /> Recibo PDF
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal open={!!paymentModal} onClose={() => setPaymentModal(null)} title="Registrar Pagamento">
        {paymentModal && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p>Cliente: <strong>{paymentModal.client?.name}</strong></p>
              <p>Valor: <strong>{formatCurrency(paymentModal.payment?.totalAmount)}</strong></p>
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

      <BillingModal
        open={!!billingModal}
        onClose={() => setBillingModal(null)}
        rental={billingModal}
      />

      <DamageFinesModal
        open={!!damageModal}
        onClose={() => setDamageModal(null)}
        rental={damageModal}
      />
    </div>
  )
}
