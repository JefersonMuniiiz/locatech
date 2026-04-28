import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { Loader2, ExternalLink, Copy, CheckCircle, CreditCard, QrCode, FileText } from 'lucide-react'
import { formatCurrency } from '../../utils'

const BILLING_TYPES = [
  { value: 'BOLETO',      label: 'Boleto Bancário', icon: FileText,   color: 'border-slate-400 text-slate-700' },
  { value: 'PIX',         label: 'PIX',             icon: QrCode,     color: 'border-green-400 text-green-700' },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito', icon: CreditCard, color: 'border-blue-400 text-blue-700' },
  { value: 'UNDEFINED',   label: 'Todos os meios',  icon: CheckCircle, color: 'border-purple-400 text-purple-700' },
]

export default function BillingModal({ open, onClose, rental }) {
  const qc = useQueryClient()
  const [billingType, setBillingType] = useState('BOLETO')
  const [dueDate, setDueDate] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  const generate = useMutation({
    mutationFn: () => api.post(`/billing/${rental.id}/charge`, { billingType, dueDate: dueDate || undefined }),
    onSuccess: (res) => {
      setResult(res.data)
      qc.invalidateQueries(['rentals'])
      toast.success('Cobrança gerada com sucesso! ✅')
    },
    onError: err => toast.error(err.response?.data?.error || 'Erro ao gerar cobrança'),
  })

  const copyText = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copiado!')
  }

  const handleClose = () => { setResult(null); setCopied(false); onClose() }

  if (!rental) return null

  return (
    <Modal open={open} onClose={handleClose} title="Gerar Cobrança" size="md">
      {!result ? (
        <div className="space-y-5">
          <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1">
            <p>Cliente: <strong>{rental.client?.name}</strong></p>
            <p>Valor total: <strong className="text-lg text-blue-600">{formatCurrency(rental.payment?.totalAmount || rental.totalAmount)}</strong></p>
            {Number(rental.payment?.damageAmount) > 0 && (
              <p className="text-orange-600">Inclui multa por danos: {formatCurrency(rental.payment.damageAmount)}</p>
            )}
            {Number(rental.fineAmount) > 0 && (
              <p className="text-red-600">Inclui multa por atraso: {formatCurrency(rental.fineAmount)}</p>
            )}
          </div>

          <div>
            <label className="label">Forma de Pagamento</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {BILLING_TYPES.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBillingType(value)}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    billingType === value ? `${color} bg-opacity-10 bg-current` : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Vencimento (opcional)</label>
            <input
              type="date"
              className="input"
              min={minDateStr}
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              placeholder="Padrão: 3 dias a partir de hoje"
            />
            <p className="text-xs text-slate-400 mt-1">Deixe em branco para vencer em 3 dias</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1 justify-center" onClick={handleClose}>Cancelar</button>
            <button
              className="btn-primary flex-1 justify-center"
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
            >
              {generate.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Gerar Cobrança'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700">
            <CheckCircle size={20} />
            <div>
              <p className="font-semibold">Cobrança gerada com sucesso!</p>
              <p className="text-sm">Valor: {formatCurrency(result.value)} · Vencimento: {result.dueDate}</p>
            </div>
          </div>

          {/* Boleto */}
          {result.bankSlipUrl && (
            <div className="p-4 border border-slate-200 rounded-lg space-y-2">
              <p className="font-medium text-slate-700 flex items-center gap-2"><FileText size={16} /> Boleto Bancário</p>
              <div className="flex gap-2">
                <a href={result.bankSlipUrl} target="_blank" rel="noreferrer" className="btn-primary flex-1 justify-center text-sm">
                  <ExternalLink size={14} /> Abrir Boleto PDF
                </a>
                <a href={result.invoiceUrl} target="_blank" rel="noreferrer" className="btn-secondary flex-1 justify-center text-sm">
                  <ExternalLink size={14} /> Ver Fatura
                </a>
              </div>
            </div>
          )}

          {/* PIX */}
          {result.pixCopyPaste && (
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg space-y-3">
              <p className="font-medium text-green-700 flex items-center gap-2"><QrCode size={16} /> PIX Copia e Cola</p>
              {result.pixQrCode && (
                <img
                  src={`data:image/png;base64,${result.pixQrCode}`}
                  alt="QR Code PIX"
                  className="w-36 h-36 mx-auto rounded-lg border border-green-200"
                />
              )}
              <div className="flex gap-2">
                <input className="input text-xs flex-1" readOnly value={result.pixCopyPaste} />
                <button
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                  onClick={() => copyText(result.pixCopyPaste)}
                >
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* Link genérico */}
          {result.invoiceUrl && !result.bankSlipUrl && !result.pixCopyPaste && (
            <div className="p-4 border border-blue-200 rounded-lg">
              <p className="font-medium text-blue-700 mb-2">Link de Pagamento</p>
              <a href={result.invoiceUrl} target="_blank" rel="noreferrer" className="btn-primary w-full justify-center">
                <ExternalLink size={14} /> Abrir Link de Pagamento
              </a>
            </div>
          )}

          <button className="btn-secondary w-full justify-center" onClick={handleClose}>Fechar</button>
        </div>
      )}
    </Modal>
  )
}
