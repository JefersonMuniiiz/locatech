import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { formatCurrency, formatDate, PAYMENT_METHODS, EQUIPMENT_TYPES } from '../utils'
import { FileText, TrendingUp, TrendingDown, DollarSign, Package, Users, Printer } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function generateReportHTML(data, month, company) {
  const monthLabel = format(new Date(month + '-01'), "MMMM 'de' yyyy", { locale: ptBR })

  const BASE = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;color:#1e293b;background:white;font-size:12px;line-height:1.5}
    @page{margin:15mm;size:A4}
    @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.no-print{display:none!important}}
    .page{max-width:800px;margin:0 auto;padding:20px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #2563eb;margin-bottom:28px}
    .logo-icon{width:44px;height:44px;background:#2563eb;border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:18px}
    h1{font-size:22px;font-weight:800;color:#1e40af}
    .subtitle{font-size:12px;color:#64748b;text-transform:capitalize}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
    .stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px}
    .stat label{font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
    .stat p{font-size:18px;font-weight:800;color:#1e293b;margin-top:4px}
    .stat.green{border-left:3px solid #22c55e}.stat.green p{color:#15803d}
    .stat.blue{border-left:3px solid #3b82f6}.stat.blue p{color:#1d4ed8}
    .stat.red{border-left:3px solid #ef4444}.stat.red p{color:#dc2626}
    .stat.purple{border-left:3px solid #a855f7}.stat.purple p{color:#7c3aed}
    .section{margin-bottom:24px}
    .section-title{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e2e8f0}
    table{width:100%;border-collapse:collapse}
    thead tr{background:#f1f5f9}
    thead th{padding:8px 12px;text-align:left;font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em}
    tbody tr{border-bottom:1px solid #f8fafc}
    tbody tr:hover{background:#f8fafc}
    tbody td{padding:9px 12px;font-size:12px}
    .text-right{text-align:right}
    .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600}
    .badge-paid{background:#dcfce7;color:#15803d}
    .badge-pending{background:#fef9c3;color:#a16207}
    .badge-overdue{background:#fee2e2;color:#dc2626}
    .totals{margin-top:10px;display:flex;justify-content:flex-end}
    .totals-table{width:260px}
    .totals-table td{padding:5px 8px;font-size:12px}
    .totals-table td:last-child{text-align:right;font-weight:600}
    .total-row{background:#1e40af;color:white;border-radius:6px}
    .total-row td{padding:8px 12px!important;font-size:14px!important;font-weight:700!important}
    .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-size:10px;color:#94a3b8}
    .print-btn{position:fixed;top:20px;right:20px;background:#2563eb;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;z-index:999}
  `

  const statusBadge = s => {
    const map = { PAID: ['badge-paid', 'Pago'], PENDING: ['badge-pending', 'Pendente'], OVERDUE: ['badge-overdue', 'Vencido'] }
    const [cls, label] = map[s] || ['', s]
    return `<span class="badge ${cls}">${label}</span>`
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><title>Relatório ${monthLabel}</title><style>${BASE}</style></head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
<div class="page">

  <div class="header">
    <div style="display:flex;align-items:center;gap:12px">
      <div class="logo-icon">LT</div>
      <div>
        <h1>${company?.name || 'LocaTech'}</h1>
        <p class="subtitle">Relatório de Faturamento — ${monthLabel}</p>
      </div>
    </div>
    <div style="text-align:right;font-size:11px;color:#64748b">
      <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat green"><label>Receita Recebida</label><p>${formatCurrency(data.totalPaid)}</p></div>
    <div class="stat blue"><label>A Receber</label><p>${formatCurrency(data.totalPending)}</p></div>
    <div class="stat red"><label>Multas</label><p>${formatCurrency(data.totalFines)}</p></div>
    <div class="stat purple"><label>Locações</label><p>${data.rentals.length}</p></div>
  </div>

  <div class="section">
    <div class="section-title">Locações do Mês</div>
    <table>
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Período</th>
          <th class="text-right">Valor</th>
          <th class="text-right">Multa</th>
          <th class="text-right">Total</th>
          <th>Pagamento</th>
        </tr>
      </thead>
      <tbody>
        ${data.rentals.map(r => `
          <tr>
            <td style="font-weight:500">${r.client?.name}</td>
            <td style="color:#64748b">${formatDate(r.startDate)} → ${formatDate(r.endDate)}</td>
            <td class="text-right">${formatCurrency(r.payment?.amount)}</td>
            <td class="text-right" style="color:${Number(r.payment?.fineAmount) > 0 ? '#dc2626' : '#94a3b8'}">${Number(r.payment?.fineAmount) > 0 ? formatCurrency(r.payment.fineAmount) : '—'}</td>
            <td class="text-right" style="font-weight:600">${formatCurrency(r.payment?.totalAmount)}</td>
            <td>${r.payment ? statusBadge(r.payment.status) : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="totals">
      <table class="totals-table">
        <tr><td>Total Bruto</td><td>${formatCurrency(data.totalBruto)}</td></tr>
        <tr><td>Multas</td><td style="color:#dc2626">${formatCurrency(data.totalFines)}</td></tr>
        <tr class="total-row"><td>TOTAL GERAL</td><td>${formatCurrency(data.totalGeral)}</td></tr>
      </table>
    </div>
  </div>

  ${data.topEquipments.length > 0 ? `
  <div class="section">
    <div class="section-title">Equipamentos Mais Locados</div>
    <table>
      <thead><tr><th>Equipamento</th><th>Tipo</th><th class="text-right">Qtd Locações</th><th class="text-right">Receita Total</th></tr></thead>
      <tbody>
        ${data.topEquipments.map(e => `
          <tr>
            <td style="font-weight:500">${e.name}</td>
            <td style="color:#64748b">${EQUIPMENT_TYPES[e.type] || e.type}</td>
            <td class="text-right">${e.count}</td>
            <td class="text-right" style="font-weight:600">${formatCurrency(e.revenue)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <div class="footer">
    <p>Relatório gerado pelo LocaTech · ${new Date().toLocaleString('pt-BR')} · Uso interno</p>
  </div>

</div>
</body>
</html>`
}

export default function ReportPage() {
  const { company } = useAuth()
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))

  const { data: rentals, isLoading } = useQuery({
    queryKey: ['rentals-report', month],
    queryFn: () => api.get('/rentals').then(r => r.data),
  })

  const reportData = (() => {
    if (!rentals) return null
    const start = startOfMonth(new Date(month + '-01'))
    const end = endOfMonth(new Date(month + '-01'))

    const filtered = rentals.filter(r => {
      const d = r.payment?.paidAt ? new Date(r.payment.paidAt) : new Date(r.startDate)
      return d >= start && d <= end
    })

    const totalPaid = filtered.filter(r => r.payment?.status === 'PAID').reduce((s, r) => s + Number(r.payment.totalAmount), 0)
    const totalPending = filtered.filter(r => r.payment?.status === 'PENDING').reduce((s, r) => s + Number(r.payment.totalAmount), 0)
    const totalFines = filtered.reduce((s, r) => s + Number(r.payment?.fineAmount || 0), 0)
    const totalBruto = filtered.reduce((s, r) => s + Number(r.totalAmount), 0)
    const totalGeral = filtered.reduce((s, r) => s + Number(r.payment?.totalAmount || 0), 0)

    // top equipments
    const eqMap = {}
    filtered.forEach(r => {
      r.items?.forEach(item => {
        const id = item.equipmentId
        if (!eqMap[id]) eqMap[id] = { name: item.equipment?.name, type: item.equipment?.type, count: 0, revenue: 0 }
        eqMap[id].count += item.quantity
        eqMap[id].revenue += Number(item.totalAmount)
      })
    })
    const topEquipments = Object.values(eqMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    return { rentals: filtered, totalPaid, totalPending, totalFines, totalBruto, totalGeral, topEquipments }
  })()

  const handlePrint = () => {
    const html = generateReportHTML(reportData, month, company)
    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(html)
    win.document.close()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Relatório de Faturamento</h1>
        <button className="btn-primary" onClick={handlePrint} disabled={!reportData}>
          <Printer size={16} /> Gerar PDF
        </button>
      </div>

      <div className="card p-4 flex items-center gap-4">
        <label className="label mb-0">Mês de referência:</label>
        <input
          type="month"
          className="input w-44"
          value={month}
          max={format(new Date(), 'yyyy-MM')}
          onChange={e => setMonth(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-slate-400">Carregando dados...</div>
      ) : reportData ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border-l-4 border-green-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg"><TrendingUp size={20} className="text-green-600" /></div>
                <div><p className="text-sm text-slate-500">Receita Recebida</p><p className="text-xl font-bold text-green-600">{formatCurrency(reportData.totalPaid)}</p></div>
              </div>
            </div>
            <div className="card p-5 border-l-4 border-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg"><DollarSign size={20} className="text-blue-600" /></div>
                <div><p className="text-sm text-slate-500">A Receber</p><p className="text-xl font-bold text-blue-600">{formatCurrency(reportData.totalPending)}</p></div>
              </div>
            </div>
            <div className="card p-5 border-l-4 border-red-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg"><TrendingDown size={20} className="text-red-600" /></div>
                <div><p className="text-sm text-slate-500">Multas</p><p className="text-xl font-bold text-red-600">{formatCurrency(reportData.totalFines)}</p></div>
              </div>
            </div>
            <div className="card p-5 border-l-4 border-purple-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg"><FileText size={20} className="text-purple-600" /></div>
                <div><p className="text-sm text-slate-500">Locações</p><p className="text-xl font-bold text-purple-600">{reportData.rentals.length}</p></div>
              </div>
            </div>
          </div>

          {reportData.rentals.length === 0 ? (
            <div className="card p-10 text-center text-slate-400">Nenhuma locação neste período</div>
          ) : (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">Locações do Período</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3 px-4 text-left font-semibold text-slate-600">Cliente</th>
                      <th className="py-3 px-4 text-left font-semibold text-slate-600">Período</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-600">Valor</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-600">Multa</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-600">Total</th>
                      <th className="py-3 px-4 text-left font-semibold text-slate-600">Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rentals.map(r => (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium">{r.client?.name}</td>
                        <td className="py-3 px-4 text-slate-500 text-xs">{formatDate(r.startDate)} → {formatDate(r.endDate)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(r.payment?.amount)}</td>
                        <td className="py-3 px-4 text-right text-red-600">{Number(r.payment?.fineAmount) > 0 ? formatCurrency(r.payment.fineAmount) : '—'}</td>
                        <td className="py-3 px-4 text-right font-bold">{formatCurrency(r.payment?.totalAmount)}</td>
                        <td className="py-3 px-4">
                          {r.payment && (
                            <span className={`badge ${r.payment.status === 'PAID' ? 'bg-green-100 text-green-700' : r.payment.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {r.payment.status === 'PAID' ? 'Pago' : r.payment.status === 'OVERDUE' ? 'Vencido' : 'Pendente'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 flex justify-end">
                <div className="text-sm space-y-1 text-right">
                  <p className="text-slate-500">Total Bruto: <span className="font-semibold text-slate-700">{formatCurrency(reportData.totalBruto)}</span></p>
                  {reportData.totalFines > 0 && <p className="text-red-600">Multas: <span className="font-semibold">{formatCurrency(reportData.totalFines)}</span></p>}
                  <p className="text-lg font-bold text-slate-800">Total Geral: {formatCurrency(reportData.totalGeral)}</p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
