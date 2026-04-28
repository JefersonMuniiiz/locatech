import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Building2, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    companyName: '', companyDocument: '', companyEmail: '', companyPhone: '',
    userName: '', userEmail: '', password: '', confirmPassword: '',
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) return toast.error('Senhas não coincidem')
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500 rounded-2xl mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">LocaTech</h1>
          <p className="text-slate-400 mt-1">Cadastre sua empresa gratuitamente</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Dados da Empresa</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Nome da Empresa</label>
                  <input className="input" required value={form.companyName} onChange={e => set('companyName', e.target.value)} />
                </div>
                <div>
                  <label className="label">CNPJ / CPF</label>
                  <input className="input" required value={form.companyDocument} onChange={e => set('companyDocument', e.target.value)} />
                </div>
                <div>
                  <label className="label">Telefone</label>
                  <input className="input" value={form.companyPhone} onChange={e => set('companyPhone', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="label">E-mail da Empresa</label>
                  <input className="input" type="email" required value={form.companyEmail} onChange={e => set('companyEmail', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Dados do Administrador</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Seu Nome</label>
                  <input className="input" required value={form.userName} onChange={e => set('userName', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="label">Seu E-mail</label>
                  <input className="input" type="email" required value={form.userEmail} onChange={e => set('userEmail', e.target.value)} />
                </div>
                <div>
                  <label className="label">Senha</label>
                  <input className="input" type="password" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} />
                </div>
                <div>
                  <label className="label">Confirmar Senha</label>
                  <input className="input" type="password" required value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
                </div>
              </div>
            </div>

            <button className="btn-primary w-full justify-center py-2.5" type="submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Criar conta'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            Já tem conta? <Link to="/login" className="text-blue-600 hover:underline font-medium">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
