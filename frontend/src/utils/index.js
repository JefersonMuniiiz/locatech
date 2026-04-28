import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const formatCurrency = (val) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0)

export const formatDate = (d) => {
  if (!d) return '—'
  try { return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR }) }
  catch { return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }) }
}

export const RENTAL_STATUS = {
  ACTIVE:    { label: 'Ativa',      color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Finalizada', color: 'bg-green-100 text-green-700' },
  DELAYED:   { label: 'Atrasada',   color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelada',  color: 'bg-slate-100 text-slate-600' },
}

export const PAYMENT_STATUS = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  PAID:    { label: 'Pago',     color: 'bg-green-100 text-green-700' },
  OVERDUE: { label: 'Vencido',  color: 'bg-red-100 text-red-700' },
  PARTIAL: { label: 'Parcial',  color: 'bg-orange-100 text-orange-700' },
}

export const EQUIPMENT_STATUS = {
  AVAILABLE:   { label: 'Disponível',  color: 'bg-green-100 text-green-700' },
  RENTED:      { label: 'Locado',      color: 'bg-blue-100 text-blue-700' },
  MAINTENANCE: { label: 'Manutenção',  color: 'bg-yellow-100 text-yellow-700' },
}

export const EQUIPMENT_TYPES = {
  SCAFFOLD:       'Andaime',
  PROP:           'Escora',
  CONCRETE_MIXER: 'Betoneira',
  MACHINE:        'Máquina',
  TOOL:           'Ferramenta',
  OTHER:          'Outro',
}

export const PAYMENT_METHODS = {
  CASH:          'Dinheiro',
  PIX:           'PIX',
  CREDIT_CARD:   'Cartão de Crédito',
  DEBIT_CARD:    'Cartão de Débito',
  BANK_TRANSFER: 'Transferência',
  BOLETO:        'Boleto',
}
