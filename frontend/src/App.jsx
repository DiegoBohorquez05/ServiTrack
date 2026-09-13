import React, { useState, useEffect } from 'react';
import API from './api';
import { LogOut, PlusCircle, Ticket, Bot, User, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rolId, setRolId] = useState(1); // 1: Trabajador, 2: Soporte, 3: Admin

  const [tickets, setTickets] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Hardware');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await API.post('/auth/register', {
          nombre,
          email,
          password,
          rol_id: Number(rolId)
        });
        alert('Registro exitoso. Por favor inicia sesión.');
        setIsRegister(false);
      } else {
        const res = await API.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
      }
    } catch (err) {
      console.error("Error backend:", err.response);
      const mensaje = err.response?.data?.detail || err.message || 'Error desconocido';
      alert(`Error: ${JSON.stringify(mensaje)}`);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const fetchTickets = async () => {
    try {
      const res = await API.get('/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error('Error al cargar tickets:', err);
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/tickets', { titulo, descripcion, categoria });
      setTitulo('');
      setDescripcion('');
      fetchTickets();
    } catch (err) {
      alert('Error al crear el ticket');
    } finally {
      setLoading(false);
    }
  };

  const updateEstado = async (id, estado) => {
    try {
      await API.patch(`/tickets/${id}`, { estado });
      fetchTickets();
    } catch (err) {
      alert('Error al actualizar el estado');
    }
  };

  // --- VISTA DE LOGIN Y REGISTRO ---
  if (!user) {
    return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
            <h1 className="text-3xl font-bold text-cyan-400 text-center mb-1">ServiTrack</h1>
            <p className="text-slate-400 text-center mb-6 text-sm">Plataforma de Mesa de Ayuda con IA</p>

            <form onSubmit={handleAuth} className="space-y-4">
              {isRegister && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-cyan-400"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />
                  </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <input
                    type="email"
                    required
                    className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-cyan-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
                <input
                    type="password"
                    required
                    className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-cyan-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {isRegister && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Rol de Usuario</label>
                    <select
                        className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-cyan-400"
                        value={rolId}
                        onChange={(e) => setRolId(e.target.value)}
                    >
                      <option value={1}>Trabajador</option>
                      <option value={2}>Soporte Técnico</option>
                      <option value={3}>Administrador</option>
                    </select>
                  </div>
              )}
              <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded transition duration-200 mt-2"
              >
                {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-400 mt-4">
              {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
              <button
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-cyan-400 ml-2 underline font-medium"
              >
                {isRegister ? 'Inicia Sesión' : 'Regístrate aquí'}
              </button>
            </p>
          </div>
        </div>
    );
  }

  // --- VISTA PRINCIPAL (DASHBOARD) ---
  return (
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Barra Superior */}
        <header className="bg-slate-800 border-b border-slate-700 p-4 px-8 flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400">ServiTrack</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <User size={12} /> {user.nombre} | Rol: <span className="text-cyan-300 font-semibold">{user.rol}</span>
            </p>
          </div>
          <button
              onClick={logout}
              className="flex items-center gap-2 bg-rose-600/80 hover:bg-rose-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </header>

        {/* Panel Principal */}
        <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Formulario de Creación de Ticket */}
          <div className="lg:col-span-1 bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit shadow-md">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-300">
              <PlusCircle size={20} /> Crear Nuevo Ticket
            </h2>
            <form onSubmit={createTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título de Incidencia</label>
                <input
                    type="text"
                    required
                    placeholder="Ej. Sin acceso a internet en oficina"
                    className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-cyan-400"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Categoría</label>
                <select
                    className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-cyan-400"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                >
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Redes">Redes</option>
                  <option value="Acceso / Permisos">Acceso / Permisos</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción Detallada</label>
                <textarea
                    required
                    rows={4}
                    placeholder="Describe los detalles del problema..."
                    className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-cyan-400 resize-none"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
              <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 text-white font-bold py-2.5 rounded transition flex justify-center items-center gap-2"
              >
                {loading ? 'Generando respuesta IA...' : 'Enviar Ticket'}
              </button>
            </form>
          </div>

          {/* Listado de Tickets */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-cyan-300">
              <Ticket size={20} /> Historial de Tickets
            </h2>

            {tickets.length === 0 ? (
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center text-slate-400">
                  No hay tickets registrados aún.
                </div>
            ) : (
                tickets.map((t) => (
                    <div key={t.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-3 shadow-sm hover:border-slate-600 transition">
                      <div className="flex justify-between items-start">
                        <div>
                    <span className="text-xs bg-slate-700 text-cyan-300 px-2 py-0.5 rounded font-mono mr-2">
                      #{t.id} - {t.categoria}
                    </span>
                          <h3 className="text-base font-bold text-white inline">{t.titulo}</h3>
                          <p className="text-xs text-slate-400 mt-1">Registrado por: {t.usuarios?.nombre || 'Usuario'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            t.estado === 'Abierto' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                t.estado === 'En Proceso' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                    {t.estado === 'Abierto' && <Clock size={12} />}
                          {t.estado === 'En Proceso' && <AlertCircle size={12} />}
                          {t.estado === 'Resuelto' && <CheckCircle2 size={12} />}
                          {t.estado}
                  </span>
                      </div>

                      <p className="text-slate-300 text-sm bg-slate-900/60 p-3 rounded border border-slate-800">{t.descripcion}</p>

                      {/* Respuesta Automática del Agente Virtual */}
                      {t.respuesta_ia && (
                          <div className="bg-cyan-950/30 border border-cyan-800/40 p-4 rounded-lg space-y-1.5">
                            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                              <Bot size={16} /> Solución Recomendada por Agente IA:
                            </div>
                            <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{t.respuesta_ia}</p>
                          </div>
                      )}

                      {/* Controles para personal de Soporte y Administradores */}
                      {user.rol !== 'Trabajador' && (
                          <div className="flex gap-2 pt-2 border-t border-slate-700/60">
                            <button
                                onClick={() => updateEstado(t.id, 'En Proceso')}
                                className="text-xs bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-1.5 rounded transition"
                            >
                              Marcar En Proceso
                            </button>
                            <button
                                onClick={() => updateEstado(t.id, 'Resuelto')}
                                className="text-xs bg-emerald-600/80 hover:bg-emerald-600 text-white px-3 py-1.5 rounded transition"
                            >
                              Marcar Resuelto
                            </button>
                          </div>
                      )}
                    </div>
                ))
            )}
          </div>
        </main>
      </div>
  );
}