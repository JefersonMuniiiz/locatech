import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'
import Badge from '../components/ui/Badge'
import { MessageCircle, Send, RefreshCw, CheckCircle, XCircle, Loader2, Bell, Clock, DollarSign, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatDate, RENTAL_STATUS } from '../utils'

export default function WhatsAppPage() {
  const qc = useQueryClient()
  const [sending, setSending] = useState({})

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['wa-status'],
    queryFn: () => api.get('/notifications/status').then(r => r.data),
    refetchInterval: 30_000,
  })

  const { data: rentals, isLoading: rentalsLoading } = useQuery({
    queryKey: ['rentals-wa'],
    queryFn: () => api.get('/rentals').then(r => r.data),
  })

  const sendMsg = async (type, rentalId) => {
    setSending(p => ({ ...p, [`${type}-${rentalId}`]: true }))
    try {
      const endpoints = {
        cobranca: `/notifications/cobranca/${rentalId}`,
        atrasada: `/notifications/atrasada/${rentalId}`,
      }
      await api.post(endpoints[type])
      toast.success('Mensagem enviada via WhatsApp! ✅')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao enviar mensagem')
    } finally {
      setSending(p => ({ ...p, [`${type}-${rentalId}`]: false }))
    }
  }

  const sendLembretes = useMutation({
    mutationFn: () => api.post('/notifications/lembretes'),
    onSuccess: (res) => toast.success(`${res.data.total} lembrete(s) enviado(s)! ✅`),
    onError: err => toast.error(err.response?.data?.error || 'Erro ao enviar lembretes'),
  })

  const delayed = rentals?.filter(r => r.status === 'DELAYED') || []
  const unpaid = rentals?.filter(r =>
    (r.status === 'COMPLETED' || r.status === 'DELAYED') &&
    r.payment?.status !== 'PAID'
  ) || []

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(23, 59, 59)
  const dueTomorrow = rentals?.filter(r => {
    if (r.status !== 'ACTIVE') return false
    const end = new Date(r.endDate)
    return end <= tomorrow && end >= new Date()
  }) || []

  const BtnSend = ({ type, rentalId, label, icon: Icon, color }) => {
    const key = `${type}-${rentalId}`
    const isLoading = sending[key]
    return (
      <button
        onClick={() => sendMsg(type, rentalId)}
        disabled={isLoading || !status?.connected}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${color}`}
        title={!status?.connected ? 'WhatsApp desconectado' : `Enviar ${label}`}
      >
        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
        {label}
      </button>
    )
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <MessageCircle size={24} className="text-green-500" /> WhatsApp
      </h1>

      {/* Connection status */}
      <div className={`card p-5 border-l-4 ${status?.connected ? 'border-green-500' : 'border-red-400'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${status?.connected ? 'bg-green-100' : 'bg-red-100'}`}>
              {statusLoading ? <Loader2 size={20} className="animate-spin text-slate-400" /> :
                status?.connected
                  ? <CheckCircle size={20} className="text-green-600" />
                  : <XCircle size={20} className="text-red-500" />
              }
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                {statusLoading ? 'Verificando...' : status?.connected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
              </p>
              <p className="text-sm text-slate-500">
                {status?.connected
                  ? 'Pronto para enviar mensagens'
                  : 'Configure a Evolution API para ativar os envios'
                }
              </p>
            </div>
          </div>
          <button onClick={() => refetchStatus()} className="btn-secondary text-sm">
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>

        {!status?.connected && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 space-y-1">
            <p className="font-medium">Como configurar:</p>
            <p>1. Instale a <strong>Evolution API</strong>: <code className="bg-slate-200 px-1 rounded">docker run -p 8080:8080 atendai/evolution-api</code></p>
            <p>2. Crie uma instância e conecte seu número pelo QR Code em <code className="bg-slate-200 px-1 rounded">http://localhost:8080</code></p>
            <p>3. Adicione no <code className="bg-slate-200 px-1 rounded">.env</code> do backend:</p>
            <code className="block bg-slate-200 p-2 rounded text-xs">
              EVOLUTION_API_URL=http://localhost:8080<br />
              EVOLUTION_API_KEY=sua-chave-aqui<br />
              EVOLUTION_INSTANCE=locatech
            </code>
            <p>4. Reinicie o backend</p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={18} className="text-blue-500" />
            <h2 className="font-semibold text-slate-800">Lembretes de Devolução</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Envia automaticamente para todos os clientes com devolução prevista para amanhã.
            <strong className="text-blue-600"> {dueTomorrow.length} cliente(s)</strong> nesta situação.
          </p>
          <button
            className="btn-primary w-full justify-center"
            onClick={() => sendLembretes.mutate()}
            disabled={sendLembretes.isPending || !status?.connected}
          >
            {sendLembretes.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Enviar Lembretes Agora
          </button>
          <p className="text-xs text-slate-400 mt-2 text-center">Também enviado automaticamente às 8h todo dia</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={18} className="text-green-500" />
            <h2 className="font-semibold text-slate-800">Envio Automático</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <CheckCircle size={14} className="text-green-500 shrink-0" />
              Confirmação ao criar locação
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <CheckCircle size={14} className="text-green-500 shrink-0" />
              Lembrete de devolução (8h todo dia)
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock size={14} className="shrink-0" />
              Cobrança e atraso: envio manual abaixo
            </div>
          </div>
        </div>
      </div>

      {/* Delayed rentals */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" />
          <h2 className="font-semibold text-slate-800">Locações Atrasadas</h2>
          <span className="ml-auto text-sm font-bold text-red-600">{delayed.length}</span>
        </div>
        {delayed.length === 0
          ? <p className="py-6 text-center text-slate-400 text-sm">Nenhuma locação atrasada 🎉</p>
          : delayed.map(r => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
              <div>
                <p className="font-medium text-slate-800">{r.client?.name}</p>
                <p className="text-xs text-slate-400">📞 {r.client?.phone} · Venceu {formatDate(r.endDate)}</p>
              </div>
              <div className="flex gap-2">
                <BtnSend type="atrasada" rentalId={r.id} label="Avisar Atraso" icon={AlertTriangle} color="bg-red-50 text-red-700 hover:bg-red-100" />
                <BtnSend type="cobranca" rentalId={r.id} label="Cobrar" icon={DollarSign} color="bg-orange-50 text-orange-700 hover:bg-orange-100" />
              </div>
            </div>
          ))
        }
      </div>

      {/* Unpaid */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <DollarSign size={16} className="text-yellow-500" />
          <h2 className="font-semibold text-slate-800">Pagamentos Pendentes</h2>
          <span className="ml-auto text-sm font-bold text-yellow-600">{unpaid.length}</span>
        </div>
        {unpaid.length === 0
          ? <p className="py-6 text-center text-slate-400 text-sm">Nenhum pagamento pendente 🎉</p>
          : unpaid.map(r => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
              <div>
                <p className="font-medium text-slate-800">{r.client?.name}</p>
                <p className="text-xs text-slate-400">📞 {r.client?.phone} · {formatCurrency(r.payment?.totalAmount)}</p>
              </div>
              <BtnSend type="cobranca" rentalId={r.id} label="Enviar Cobrança" icon={DollarSign} color="bg-yellow-50 text-yellow-700 hover:bg-yellow-100" />
            </div>
          ))
        }
      </div>
    </div>
  )
}
