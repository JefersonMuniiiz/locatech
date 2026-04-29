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
  const startDate = new Date(rental.startDate).toLocaleDateString('pt-BR')
  const endDate = new Date(rental.endDate).toLocaleDateString('pt-BR')
  const today = new Date().toLocaleDateString('pt-BR')
  const contractRef = rental.id.slice(-6).toUpperCase()

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Contrato #${contractRef}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; color: #1a1a1a; font-size: 13px; line-height: 1.8; }
    @page { margin: 20mm; size: A4; }
    @media print { .no-print { display: none !important; } }
    .page { max-width: 800px; margin: 0 auto; padding: 30px; }
    .print-btn { position: fixed; top: 20px; right: 20px; background: #1e40af; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; }
    .header h1 { font-size: 16px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
    .header p { font-size: 12px; color: #444; }
    .contract-ref { text-align: right; font-size: 11px; color: #666; margin-bottom: 20px; }
    .intro { text-align: justify; margin-bottom: 24px; line-height: 2; }
    .clause { margin-bottom: 20px; }
    .clause-title { font-weight: bold; font-size: 13px; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    .clause p { text-align: justify; margin-bottom: 6px; padding-left: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th { background: #f1f5f9; padding: 7px 10px; text-align: left; font-size: 12px; border: 1px solid #ccc; }
    td { padding: 7px 10px; font-size: 12px; border: 1px solid #ccc; }
    .total-row td { font-weight: bold; background: #f8fafc; }
    .signatures-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
    .sig-line { border-top: 1px solid #1a1a1a; padding-top: 8px; margin-top: 40px; text-align: center; font-size: 12px; line-height: 1.6; }
    .date-line { text-align: center; margin-top: 30px; font-size: 13px; }
    .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #ccc; text-align: center; font-size: 10px; color: #888; }
  </style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
<div class="page">

  <div class="header">
    <h1>Contrato de Locação de Equipamentos</h1>
    <p>${company?.name || 'Locadora'} · CNPJ: ${company?.document || '—'}</p>
  </div>

  <div class="contract-ref">Contrato Nº ${contractRef} · Emitido em ${today}</div>

  <div class="intro">
    Pelo presente instrumento particular, de um lado, <strong>${company?.name || 'LOCADORA'}</strong>,
    pessoa jurídica inscrita no CNPJ nº <strong>${company?.document || '—'}</strong>,
    com sede em <strong>${company?.address || '—'}</strong>,
    doravante denominada <strong>LOCADORA</strong>, e, de outro lado,
    o(a) Sr(a). <strong>${rental.client?.name}</strong>,
    CPF/CNPJ nº <strong>${rental.client?.document}</strong>,
    residente/sediado em <strong>${rental.client?.address}, ${rental.client?.city} – ${rental.client?.state}</strong>,
    doravante denominado <strong>LOCATÁRIO</strong>, têm entre si justo e acordado o presente
    contrato de locação de equipamentos, mediante as seguintes cláusulas e condições:
  </div>

  <div class="clause">
    <div class="clause-title">1. Objeto do Contrato</div>
    <p><strong>1.1.</strong> O presente contrato tem como objeto a locação do(s) seguinte(s) equipamento(s):</p>
    <table>
      <thead><tr><th>Equipamento</th><th>Qtd</th><th>Diária Unit.</th><th>Dias</th><th>Subtotal</th></tr></thead>
      <tbody>
        ${rental.items?.map(item => `
          <tr>
            <td>${item.equipment?.name || '—'}</td>
            <td>${item.quantity}</td>
            <td>${Number(item.dailyRate).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>${rental.totalDays}</td>
            <td>${Number(item.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
          </tr>`).join('')}
        ${fineAmount > 0 ? `<tr><td colspan="4" style="color:#dc2626">Multa por atraso</td><td style="color:#dc2626">${fineAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>` : ''}
        <tr class="total-row"><td colspan="4">TOTAL</td><td>${grandTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>
      </tbody>
    </table>
    <p><strong>1.2.</strong> O LOCATÁRIO recebe o equipamento em plenas condições de funcionamento e se compromete a devolvê-lo no mesmo estado em que recebeu, salvo desgaste natural pelo uso adequado.</p>
  </div>

  <div class="clause">
    <div class="clause-title">2. Prazo de Locação</div>
    <p><strong>2.1.</strong> O prazo de locação será de <strong>${rental.totalDays} dias</strong>, iniciando-se em <strong>${startDate}</strong> e finalizando em <strong>${endDate}</strong>.</p>
    <p><strong>2.2.</strong> Caso haja necessidade de prorrogação do prazo, o LOCATÁRIO deverá comunicar a LOCADORA com antecedência mínima de 72 horas.</p>
    <p><strong>2.3.</strong> O não cumprimento do prazo de devolução acarretará cobrança de multa diária acrescida de 10% por dia de atraso, até a efetiva devolução dos equipamentos.</p>
  </div>

  <div class="clause">
    <div class="clause-title">3. Responsabilidade do Locatário</div>
    <p><strong>3.1.</strong> O LOCATÁRIO assume total responsabilidade pelo equipamento durante o período de locação, incluindo qualquer dano, extravio, roubo ou furto.</p>
    <p><strong>3.2.</strong> Em caso de danos causados por mau uso, negligência ou uso inadequado, o LOCATÁRIO se compromete a arcar com os custos de reparo ou reposição do equipamento.</p>
    <p><strong>3.3.</strong> O equipamento não poderá ser transportado ou utilizado fora do local previamente acordado sem autorização expressa da LOCADORA.</p>
    <p><strong>3.4.</strong> O equipamento deverá ser devolvido limpo. Caso contrário, será cobrada uma taxa de limpeza no valor de <strong>R$ 100,00</strong>.</p>
  </div>

  <div class="clause">
    <div class="clause-title">4. Obrigações da Locadora</div>
    <p><strong>4.1.</strong> A LOCADORA se compromete a fornecer o equipamento em perfeitas condições de uso.</p>
    <p><strong>4.2.</strong> Caso o equipamento apresente defeito de fabricação durante o período de locação, a LOCADORA providenciará sua substituição, desde que constatado que o defeito não foi causado pelo LOCATÁRIO.</p>
  </div>

  <div class="clause">
    <div class="clause-title">5. Pagamento</div>
    <p><strong>5.1.</strong> O valor total da locação é de <strong>${grandTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>.</p>
    <p><strong>5.2.</strong> O pagamento deverá ser efetuado conforme acordado entre as partes, podendo ser realizado via PIX, boleto bancário, dinheiro ou outro meio previamente combinado.</p>
    <p><strong>5.3.</strong> O atraso no pagamento sujeitará o LOCATÁRIO ao pagamento de multa de 2% sobre o valor em aberto, acrescido de juros de 1% ao mês.</p>
  </div>

  <div class="clause">
    <div class="clause-title">6. Endereço de Entrega</div>
    <p><strong>6.1.</strong> Os equipamentos serão entregues no seguinte endereço: <strong>${rental.address}</strong>.</p>
    <p><strong>6.2.</strong> Qualquer alteração no endereço de entrega deverá ser comunicada à LOCADORA com antecedência mínima de 24 horas.</p>
  </div>

  <div class="clause">
    <div class="clause-title">7. Disposições Gerais</div>
    <p><strong>7.1.</strong> O presente contrato constitui título executivo extrajudicial nos termos do artigo 784 do Código de Processo Civil.</p>
    <p><strong>7.2.</strong> Fica eleito o foro da comarca de <strong>${company?.address?.split(',').pop()?.trim() || 'domicílio da LOCADORA'}</strong> para dirimir quaisquer questões oriundas do presente contrato.</p>
    <p><strong>7.3.</strong> E, por estarem justos e acordados, assinam o presente contrato em duas vias de igual teor e forma.</p>
    ${rental.notes ? `<p><strong>7.4.</strong> Observações: ${rental.notes}</p>` : ''}
  </div>

  <div class="date-line">${today}</div>

  <div class="signatures-grid">
    <div>
      <div class="sig-line">
        <p><strong>${company?.name || 'LOCADORA'}</strong></p>
        <p>CNPJ: ${company?.document || '—'}</p>
        <p>LOCADORA</p>
      </div>
    </div>
    <div>
      <div class="sig-line">
        <p><strong>${rental.client?.name}</strong></p>
        <p>CPF/CNPJ: ${rental.client?.document}</p>
        <p>LOCATÁRIO</p>
      </div>
    </div>
  </div>

  <div class="signatures-grid" style="margin-top: 20px;">
    <div><div class="sig-line"><p>Testemunha 1</p><p>CPF: ___________________</p></div></div>
    <div><div class="sig-line"><p>Testemunha 2</p><p>CPF: ___________________</p></div></div>
  </div>

  <div class="footer">Documento gerado em ${new Date().toLocaleString('pt-BR')} · ${company?.name || 'LocaTech'}</div>
</div>
</body>
</html>`
}

export function openPrintWindow(html) {
  const win = window.open('', '_blank', 'width=900,height=700')
  win.document.write(html)
  win.document.close()
}
