// Utilitário para gerar PDFs via impressão do navegador
// Não precisa de biblioteca externa - usa window.print() com CSS otimizado

import { formatCurrency, formatDate, PAYMENT_METHODS } from './index'

const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; color: #1e293b; background: white; font-size: 13px; line-height: 1.5; }
  @page { margin: 15mm 15mm; size: A4; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  .page { max-width: 800px; margin: 0 auto; padding: 20px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #2563eb; margin-bottom: 24px; }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-icon { width: 40px; height: 40px; background: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 16px; }
  .logo-text h1 { font-size: 20px; font-weight: 700; color: #1e40af; }
  .logo-text p { font-size: 11px; color: #64748b; }
  .doc-info { text-align: right; }
  .doc-info h2 { font-size: 18px; font-weight: 700; color: #1e40af; }
  .doc-info p { font-size: 11px; color: #64748b; }
  .doc-number { font-size: 12px; font-weight: 600; color: #475569; margin-top: 4px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .field label { font-size: 10px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
  .field p { font-size: 13px; color: #1e293b; font-weight: 500; margin-top: 1px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #f1f5f9; }
  thead th { padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }
  tbody tr { border-bottom: 1px solid #f1f5f9; }
  tbody td { padding: 10px 12px; font-size: 13px; }
  .text-right { text-align: right; }
  .totals { margin-top: 12px; display: flex; justify-content: flex-end; }
  .totals-table { width: 280px; }
  .totals-table tr td { padding: 5px 8px; font-size: 13px; }
  .totals-table tr td:last-child { text-align: right; font-weight: 600; }
  .total-final { background: #1e40af; color: white; border-radius: 6px; }
  .total-final td { padding: 8px 12px !important; font-size: 14px !important; font-weight: 700 !important; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .status-active { background: #dbeafe; color: #1d4ed8; }
  .status-completed { background: #dcfce7; color: #15803d; }
  .status-delayed { background: #fee2e2; color: #dc2626; }
  .status-paid { background: #dcfce7; color: #15803d; }
  .status-pending { background: #fef9c3; color: #a16207; }
  .fine-row td { color: #dc2626; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
  .signature-line { border-top: 1px solid #94a3b8; padding-top: 8px; text-align: center; font-size: 11px; color: #64748b; }
  .terms { font-size: 11px; color: #94a3b8; line-height: 1.6; margin-top: 16px; }
  .print-btn { position: fixed; top: 20px; right: 20px; background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; z-index: 999; display: flex; align-items: center; gap: 8px; }
  .print-btn:hover { background: #1d4ed8; }
  .alert-fine { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; color: #dc2626; font-size: 12px; font-weight: 500; }
`

export function generateContractHTML(rental, company) {
  const fineAmount = Number(rental.fineAmount) || 0
  const totalAmount = Number(rental.totalAmount) || 0
  const grandTotal = totalAmount + fineAmount

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Contrato de Locação #${rental.id.slice(-6).toUpperCase()}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
<div class="page">

  <div class="header">
    <div class="logo">
      <div class="logo-icon">LT</div>
      <div class="logo-text">
        <h1>${company?.name || 'LocaTech'}</h1>
        <p>Locação de Equipamentos</p>
      </div>
    </div>
    <div class="doc-info">
      <h2>CONTRATO DE LOCAÇÃO</h2>
      <p class="doc-number">Nº ${rental.id.slice(-6).toUpperCase()}</p>
      <p>Emitido em: ${formatDate(new Date().toISOString())}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dados do Locatário</div>
    <div class="grid-3">
      <div class="field"><label>Nome / Razão Social</label><p>${rental.client?.name}</p></div>
      <div class="field"><label>CPF / CNPJ</label><p>${rental.client?.document}</p></div>
      <div class="field"><label>Telefone</label><p>${rental.client?.phone}</p></div>
      <div class="field"><label>E-mail</label><p>${rental.client?.email || '—'}</p></div>
      <div class="field" style="grid-column: span 2"><label>Endereço</label><p>${rental.client?.address}, ${rental.client?.city} – ${rental.client?.state}</p></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dados da Locação</div>
    <div class="grid-3">
      <div class="field"><label>Data de Início</label><p>${formatDate(rental.startDate)}</p></div>
      <div class="field"><label>Data de Devolução</label><p>${formatDate(rental.endDate)}</p></div>
      <div class="field"><label>Total de Dias</label><p>${rental.totalDays} dias</p></div>
      <div class="field" style="grid-column: span 3"><label>Endereço de Entrega</label><p>${rental.address}</p></div>
      ${rental.notes ? `<div class="field" style="grid-column: span 3"><label>Observações</label><p>${rental.notes}</p></div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Equipamentos Locados</div>
    <table>
      <thead>
        <tr>
          <th>Equipamento</th>
          <th class="text-right">Qtd</th>
          <th class="text-right">Diária Unit.</th>
          <th class="text-right">Dias</th>
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rental.items?.map(item => `
          <tr>
            <td>${item.equipment?.name || '—'}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.dailyRate)}</td>
            <td class="text-right">${rental.totalDays}</td>
            <td class="text-right">${formatCurrency(item.totalAmount)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="totals">
      <table class="totals-table">
        <tr><td>Subtotal</td><td>${formatCurrency(totalAmount)}</td></tr>
        ${fineAmount > 0 ? `<tr class="fine-row"><td>Multa por atraso</td><td>${formatCurrency(fineAmount)}</td></tr>` : ''}
        <tr class="total-final"><td>TOTAL</td><td>${formatCurrency(grandTotal)}</td></tr>
      </table>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Cláusulas e Condições</div>
    <div class="terms">
      <p><strong>1. OBJETO:</strong> O presente contrato tem por objeto a locação dos equipamentos descritos acima, pelo prazo estipulado.</p>
      <p><strong>2. RESPONSABILIDADE:</strong> O LOCATÁRIO é responsável pela guarda, conservação e uso adequado dos equipamentos durante o período de locação.</p>
      <p><strong>3. DANOS:</strong> Em caso de danos, perda ou furto dos equipamentos, o LOCATÁRIO arcará com o valor de reposição integral.</p>
      <p><strong>4. DEVOLUÇÃO:</strong> Os equipamentos deverão ser devolvidos na data acordada, limpos e em perfeitas condições de uso.</p>
      <p><strong>5. MULTA POR ATRASO:</strong> O atraso na devolução sujeitará o LOCATÁRIO ao pagamento de multa de R$ 50,00 por dia de atraso por contrato, além do valor proporcional da diária.</p>
      <p><strong>6. PAGAMENTO:</strong> O pagamento deverá ser efetuado conforme acordado entre as partes, podendo ser à vista ou parcelado conforme negociação.</p>
    </div>
  </div>

  <div class="footer">
    <div class="signatures">
      <div>
        <div class="signature-line">${company?.name || 'Locadora'}<br>LOCADOR(A)</div>
      </div>
      <div>
        <div class="signature-line">${rental.client?.name}<br>LOCATÁRIO(A)</div>
      </div>
    </div>
    <p style="text-align:center; margin-top: 20px; font-size: 10px; color: #94a3b8;">
      Documento gerado em ${new Date().toLocaleString('pt-BR')} · LocaTech Sistema de Gestão
    </p>
  </div>

</div>
</body>
</html>`
}

export function generateReceiptHTML(rental, company) {
  const payment = rental.payment
  const fineAmount = Number(payment?.fineAmount) || 0
  const totalAmount = Number(payment?.totalAmount) || 0

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Recibo #${rental.id.slice(-6).toUpperCase()}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
<div class="page">

  <div class="header">
    <div class="logo">
      <div class="logo-icon">LT</div>
      <div class="logo-text">
        <h1>${company?.name || 'LocaTech'}</h1>
        <p>Locação de Equipamentos</p>
      </div>
    </div>
    <div class="doc-info">
      <h2>RECIBO DE PAGAMENTO</h2>
      <p class="doc-number">Ref. Contrato Nº ${rental.id.slice(-6).toUpperCase()}</p>
      <p>Emitido em: ${formatDate(new Date().toISOString())}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dados do Pagamento</div>
    <div class="grid-3">
      <div class="field"><label>Cliente</label><p>${rental.client?.name}</p></div>
      <div class="field"><label>CPF / CNPJ</label><p>${rental.client?.document}</p></div>
      <div class="field"><label>Status</label><p><span class="status-badge ${payment?.status === 'PAID' ? 'status-paid' : 'status-pending'}">${payment?.status === 'PAID' ? 'PAGO' : 'PENDENTE'}</span></p></div>
      <div class="field"><label>Período</label><p>${formatDate(rental.startDate)} → ${formatDate(rental.endDate)}</p></div>
      <div class="field"><label>Data do Pagamento</label><p>${payment?.paidAt ? formatDate(payment.paidAt) : '—'}</p></div>
      <div class="field"><label>Forma de Pagamento</label><p>${payment?.method ? PAYMENT_METHODS[payment.method] : '—'}</p></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Itens</div>
    <table>
      <thead>
        <tr>
          <th>Equipamento</th>
          <th class="text-right">Qtd</th>
          <th class="text-right">Diária</th>
          <th class="text-right">Dias</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rental.items?.map(item => `
          <tr>
            <td>${item.equipment?.name || '—'}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.dailyRate)}</td>
            <td class="text-right">${rental.totalDays}</td>
            <td class="text-right">${formatCurrency(item.totalAmount)}</td>
          </tr>
        `).join('')}
        ${fineAmount > 0 ? `
          <tr class="fine-row">
            <td colspan="4">Multa por atraso na devolução</td>
            <td class="text-right">${formatCurrency(fineAmount)}</td>
          </tr>
        ` : ''}
      </tbody>
    </table>
    <div class="totals">
      <table class="totals-table">
        <tr><td>Valor da Locação</td><td>${formatCurrency(payment?.amount)}</td></tr>
        ${fineAmount > 0 ? `<tr class="fine-row"><td>Multa por Atraso</td><td>${formatCurrency(fineAmount)}</td></tr>` : ''}
        <tr class="total-final"><td>TOTAL PAGO</td><td>${formatCurrency(totalAmount)}</td></tr>
      </table>
    </div>
  </div>

  <div class="footer">
    <p style="font-size: 12px; color: #475569; text-align: center; margin-bottom: 32px;">
      Declaro ter recebido o pagamento referente à locação dos equipamentos acima discriminados.
    </p>
    <div class="signatures">
      <div><div class="signature-line">${company?.name || 'Locadora'}<br>LOCADOR(A)</div></div>
      <div><div class="signature-line">${rental.client?.name}<br>LOCATÁRIO(A)</div></div>
    </div>
    <p style="text-align:center; margin-top: 20px; font-size: 10px; color: #94a3b8;">
      Documento gerado em ${new Date().toLocaleString('pt-BR')} · LocaTech Sistema de Gestão
    </p>
  </div>

</div>
</body>
</html>`
}

export function openPrintWindow(html) {
  const win = window.open('', '_blank', 'width=900,height=700')
  win.document.write(html)
  win.document.close()
}
