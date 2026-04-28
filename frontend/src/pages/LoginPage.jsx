import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Building2, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: 'admin@locatech.com.br', password: 'admin123' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500 rounded-2xl mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">LocaTech</h1>
          <p className="text-slate-400 mt-1">Gestão de Locadoras de Equipamentos</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Entrar na sua conta</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input className="input" type="email" required
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Senha</label>
              <input className="input" type="password" required
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <button className="btn-primary w-full justify-center py-2.5" type="submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Entrar'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            Não tem conta?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">Cadastrar empresa</Link>
          </p>
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 text-center">
            Demo: admin@locatech.com.br / admin123
          </div>
        </div>
      </div>
    </div>
  )
}
