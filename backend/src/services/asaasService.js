// Integração com Asaas - Boleto, PIX e Cartão
// Docs: https://docs.asaas.com
// Crie sua conta em https://asaas.com e pegue a API Key no painel

const ASAAS_URL = process.env.ASAAS_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3'

const ASAAS_KEY = process.env.ASAAS_API_KEY || ''

async function request(method, path, body = null) {
  const res = await fetch(`${ASAAS_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_KEY,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json()
  if (!res.ok) {
    const msg = data.errors?.[0]?.description || data.message || 'Erro Asaas'
    throw { status: res.status, message: msg }
  }
  return data
}

// ── Clientes no Asaas ──────────────────────────────────────────

async function findOrCreateCustomer(client) {
  // Tenta encontrar pelo CPF/CNPJ
  const cpfCnpj = client.document.replace(/\D/g, '')
  const existing = await request('GET', `/customers?cpfCnpj=${cpfCnpj}`)
  if (existing.data?.length > 0) return existing.data[0]

  // Cria novo cliente
  return request('POST', '/customers', {
    name: client.name,
    cpfCnpj,
    email: client.email || undefined,
    phone: client.phone?.replace(/\D/g, '') || undefined,
    address: client.address || undefined,
    addressNumber: 'S/N',
    province: client.city || undefined,
    postalCode: client.zipCode?.replace(/\D/g, '') || undefined,
  })
}

// ── Cobranças ─────────────────────────────────────────────────

async function createCharge({ client, rental, billingType, dueDate, description }) {
  const customer = await findOrCreateCustomer(client)
  const value = Number(rental.payment?.totalAmount || rental.totalAmount)
  const due = dueDate || getDefaultDueDate()

  const payload = {
    customer: customer.id,
    billingType, // BOLETO | PIX | CREDIT_CARD | UNDEFINED (todos)
    value,
    dueDate: due,
    description: description || `Locação #${rental.id.slice(-6).toUpperCase()} - ${rental.address}`,
    externalReference: rental.id,
    fine: { value: 2 },        // 2% de multa após vencimento
    interest: { value: 1 },    // 1% ao mês de juros
    postalService: false,
  }

  return request('POST', '/payments', payload)
}

async function getCharge(asaasId) {
  return request('GET', `/payments/${asaasId}`)
}

async function getChargeStatus(asaasId) {
  const charge = await getCharge(asaasId)
  return {
    id: charge.id,
    status: charge.status,           // PENDING | RECEIVED | CONFIRMED | OVERDUE | REFUNDED | CANCELLED
    value: charge.value,
    netValue: charge.netValue,
    billingType: charge.billingType,
    dueDate: charge.dueDate,
    paymentDate: charge.paymentDate,
    invoiceUrl: charge.invoiceUrl,   // Link do boleto/fatura
    bankSlipUrl: charge.bankSlipUrl, // PDF do boleto
    pixQrCode: charge.pixTransaction?.qrCode?.encodedImage,
    pixCopyPaste: charge.pixTransaction?.qrCode?.payload,
  }
}

async function cancelCharge(asaasId) {
  return request('DELETE', `/payments/${asaasId}`)
}

async function getPixQrCode(asaasId) {
  return request('GET', `/payments/${asaasId}/pixQrCode`)
}

// ── Helpers ───────────────────────────────────────────────────

function getDefaultDueDate(daysFromNow = 3) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0] // YYYY-MM-DD
}

function mapAsaasStatus(status) {
  const map = {
    PENDING:   'PENDING',
    RECEIVED:  'PAID',
    CONFIRMED: 'PAID',
    OVERDUE:   'OVERDUE',
    REFUNDED:  'PENDING',
    CANCELLED: 'PENDING',
  }
  return map[status] || 'PENDING'
}

module.exports = {
  findOrCreateCustomer,
  createCharge,
  getCharge,
  getChargeStatus,
  cancelCharge,
  getPixQrCode,
  mapAsaasStatus,
}
