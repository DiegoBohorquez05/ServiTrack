import React, { useState, useEffect } from 'react';
import API from './api';
import { LogOut, PlusCircle, Ticket, Bot, User, CheckCircle2, Clock, AlertCircle, Users, Headphones, Send, UserPlus, RefreshCw, AlertTriangle, Filter } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados para la creación de usuarios desde el Admin Dashboard
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [nuevoRolId, setNuevoRolId] = useState(3);
  const [loadingAdminRegister, setLoadingAdminRegister] = useState(false);

  // Estado para el modal de confirmación de cambio de rol
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    usuario: null,
    nuevoRolId: null,
    nuevoRolNombre: ''
  });

  // Estados globales de Tickets y Usuarios
  const [tickets, setTickets] = useState([]);
  const [usuariosLista, setUsuariosLista] = useState([]);

  // Estados del Formulario de Ticket
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Hardware');
  const [loading, setLoading] = useState(false);

  // Estados para los Filtros Globales
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroPrioridad, setFiltroPrioridad] = useState('Todas');

  useEffect(() => {
    if (user) {
      fetchTickets();
      if (user.rol === 'Administrador') {
        fetchUsuarios();
      }
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    } catch (err) {
      console.error("Error backend:", err.response);
      const mensaje = err.response?.data?.detail || err.message || 'Error de credenciales';
      alert(`Error al iniciar sesión: ${JSON.stringify(mensaje)}`);
    }
  };

  const handleRegisterByAdmin = async (e) => {
    e.preventDefault();
    setLoadingAdminRegister(true);
    try {
      await API.post('/auth/register', {
        nombre: nuevoNombre,
        email: nuevoEmail,
        password: nuevoPassword,
        rol_id: Number(nuevoRolId)
      });
      alert('Usuario creado exitosamente.');
      setNuevoNombre('');
      setNuevoEmail('');
      setNuevoPassword('');
      setNuevoRolId(3);
      fetchUsuarios();
    } catch (err) {
      console.error("Error backend:", err.response);
      const mensaje = err.response?.data?.detail || err.message || 'Error desconocido';
      alert(`Error al registrar usuario: ${JSON.stringify(mensaje)}`);
    } finally {
      setLoadingAdminRegister(false);
    }
  };

  const solicitarCambioRol = (usuario, nuevoRolIdTarget, nuevoRolNombreTarget) => {
    setConfirmModal({
      isOpen: true,
      usuario,
      nuevoRolId: nuevoRolIdTarget,
      nuevoRolNombre: nuevoRolNombreTarget
    });
  };

  const ejecutarCambioRol = async () => {
    const { usuario, nuevoRolId } = confirmModal;
    try {
      await API.patch(`/usuarios/${usuario.id}`, { rol_id: Number(nuevoRolId) });
      alert(`El rol de ${usuario.nombre} ha sido actualizado correctamente.`);
      fetchUsuarios();
    } catch (err) {
      console.error('Error al actualizar rol:', err.response || err);
      const detalleError = err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message || 'Error desconocido';
      alert(`Error al intentar cambiar el rol: ${detalleError}`);
    } finally {
      setConfirmModal({ isOpen: false, usuario: null, nuevoRolId: null, nuevoRolNombre: '' });
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

  const fetchUsuarios = async () => {
    try {
      const res = await API.get('/usuarios');
      setUsuariosLista(res.data);
    } catch (err) {
      console.error('Error al cargar lista de usuarios:', err);
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

  const updateTicketField = async (id, dataToUpdate) => {
    try {
      await API.patch(`/tickets/${id}`, dataToUpdate);
      fetchTickets();
    } catch (err) {
      alert('Error al actualizar la información del ticket');
    }
  };

  // --- LÓGICA DE FILTRADO ---
  const ticketsFiltrados = tickets.filter((ticket) => {
    const cumpleCategoria = filtroCategoria === 'Todas' || ticket.categoria === filtroCategoria;
    const prioridadTicket = ticket.prioridad || 'Alta';
    const cumplePrioridad = filtroPrioridad === 'Todas' || prioridadTicket === filtroPrioridad;

    return cumpleCategoria && cumplePrioridad;
  });

  // Clasificación por estado sobre la lista filtrada
  const abiertos = ticketsFiltrados.filter((t) => t.estado === 'Abierto');
  const enProceso = ticketsFiltrados.filter((t) => t.estado === 'En Proceso');
  const cerrados = ticketsFiltrados.filter((t) => t.estado === 'Cerrado' || t.estado === 'Resuelto');

  const soporteUsuarios = usuariosLista.filter((u) => u.rol === 'Soporte TI' || u.rol === 'Soporte Técnico');
  const empleadosUsuarios = usuariosLista.filter((u) => u.rol === 'Trabajador' || u.rol === 'Empleado');

  // --- TARJETA DE TICKET ---
  const TicketCard = ({ ticket }) => {
    const [mostrarMotivo, setMostrarMotivo] = useState(false);
    const [motivoTexto, setMotivoTexto] = useState('');

    const handleEnviarRechazo = () => {
      if (!motivoTexto.trim()) return;

      const nuevoMsg = {
        autor: user.nombre,
        rol: user.rol,
        mensaje: `El problema persiste: ${motivoTexto}`,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      updateTicketField(ticket.id, { estado: 'En Proceso', nuevo_comentario: nuevoMsg });
      setMostrarMotivo(false);
      setMotivoTexto('');
    };

    const esSoporteOAdmin = user.rol === 'Soporte TI' || user.rol === 'Soporte Técnico' || user.rol === 'Administrador';

    return (
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 shadow-sm hover:border-slate-600 transition">
          <div className="flex justify-between items-start gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="text-xs bg-slate-700 text-cyan-300 px-2 py-0.5 rounded font-mono">
                #{ticket.id} - {ticket.categoria}
              </span>

                {/* Selector de Prioridad Editable para Soporte/Admin, Badge para Empleados */}
                {esSoporteOAdmin ? (
                    <select
                        value={ticket.prioridad || 'Alta'}
                        onChange={(e) => updateTicketField(ticket.id, { prioridad: e.target.value })}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold border focus:outline-none cursor-pointer ${
                            (ticket.prioridad || 'Alta') === 'Alta' ? 'bg-rose-950/80 text-rose-400 border-rose-500/40' :
                                ticket.prioridad === 'Media' ? 'bg-amber-950/80 text-amber-400 border-amber-500/40' :
                                    'bg-slate-700 text-slate-300 border-slate-600'
                        }`}
                    >
                      <option value="Alta" className="bg-slate-800 text-rose-400 font-bold">Alta</option>
                      <option value="Media" className="bg-slate-800 text-amber-400 font-bold">Media</option>
                      <option value="Baja" className="bg-slate-800 text-slate-300 font-bold">Baja</option>
                    </select>
                ) : (
                    ticket.prioridad && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            ticket.prioridad === 'Alta' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                ticket.prioridad === 'Media' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                    'bg-slate-700 text-slate-300'
                        }`}>
                    {ticket.prioridad}
                  </span>
                    )
                )}
              </div>
              <h3 className="text-sm font-bold text-white leading-snug">{ticket.titulo}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Por: {ticket.usuarios?.nombre || 'Usuario'}</p>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                ticket.estado === 'Abierto' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    ticket.estado === 'En Proceso' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
            {ticket.estado}
          </span>
          </div>

          <p className="text-slate-300 text-xs bg-slate-900/60 p-2.5 rounded border border-slate-800/80 leading-relaxed">
            {ticket.descripcion}
          </p>

          {ticket.respuesta_ia && (
              <div className="bg-cyan-950/30 border border-cyan-800/40 p-2.5 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                  <Bot size={13} /> Sugerencia IA:
                </div>
                <p className="text-[11px] text-slate-300 whitespace-pre-line leading-normal">{ticket.respuesta_ia}</p>
              </div>
          )}

          <div className="pt-2 border-t border-slate-700/60 space-y-3">
            {ticket.historial_respuestas && ticket.historial_respuestas.length > 0 && (
                <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Historial del caso:
              </span>
                  {ticket.historial_respuestas.map((resp, idx) => (
                      <div
                          key={idx}
                          className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                              resp.rol === 'Soporte TI' || resp.rol === 'Soporte Técnico'
                                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                                  : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                          }`}
                      >
                        <div className="flex justify-between items-center text-[10px] opacity-75">
                          <span className="font-bold">{resp.autor} ({resp.rol})</span>
                          <span>{resp.fecha}</span>
                        </div>
                        <p className="whitespace-pre-line leading-relaxed">{resp.mensaje}</p>
                      </div>
                  ))}
                </div>
            )}

            {(user.rol === 'Soporte TI' || user.rol === 'Soporte Técnico') && ticket.estado !== 'Cerrado' && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-emerald-400">
                    Agregar respuesta / nuevo diagnóstico:
                  </label>
                  <input
                      type="text"
                      placeholder="Escribe una respuesta y presiona Enter..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim() !== '') {
                          const nuevoMsg = {
                            autor: user.nombre,
                            rol: user.rol,
                            mensaje: e.target.value,
                            fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          };
                          updateTicketField(ticket.id, {
                            estado: 'En Proceso',
                            nuevo_comentario: nuevoMsg
                          });
                          e.target.value = '';
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
            )}

            {(user.rol === 'Trabajador' || user.rol === 'Empleado') && ticket.estado !== 'Cerrado' && ticket.historial_respuestas?.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-700 p-3 rounded-lg space-y-3 mt-2">
                  <p className="text-xs text-slate-300 font-semibold">¿La respuesta dada resuelve tu problema?</p>

                  <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                          const nuevoMsg = {
                            autor: user.nombre,
                            rol: user.rol,
                            mensaje: "El usuario confirmó que el problema se solucionó correctamente.",
                            fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          };
                          updateTicketField(ticket.id, { estado: 'Cerrado', nuevo_comentario: nuevoMsg });
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 size={14} /> Solucionado (Cerrar Ticket)
                    </button>

                    <button
                        onClick={() => setMostrarMotivo(!mostrarMotivo)}
                        className="bg-rose-600/80 hover:bg-rose-600 text-white text-xs px-3 py-1.5 rounded font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <AlertCircle size={14} /> El problema persiste
                    </button>
                  </div>

                  {mostrarMotivo && (
                      <div className="pt-2 border-t border-slate-700/80 space-y-2">
                        <label className="block text-[11px] font-semibold text-rose-300">
                          Explica por qué el problema continúa:
                        </label>
                        <div className="flex gap-2">
                          <input
                              type="text"
                              placeholder="Ej. Sigo sin poder conectarme a la VPN..."
                              value={motivoTexto}
                              onChange={(e) => setMotivoTexto(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEnviarRechazo();
                              }}
                              className="w-full bg-slate-950 border border-rose-900/50 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                          <button
                              onClick={handleEnviarRechazo}
                              className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Send size={12} /> Enviar
                          </button>
                        </div>
                      </div>
                  )}
                </div>
            )}
          </div>
        </div>
    );
  };

  // --- VISTA LOGIN ---
  if (!user) {
    return (
        <div className="min-h-screen w-full bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
            <h1 className="text-3xl font-bold text-cyan-400 text-center mb-1">ServiTrack</h1>
            <p className="text-slate-400 text-center mb-6 text-sm">Plataforma de Mesa de Ayuda con IA</p>

            <form onSubmit={handleLogin} className="space-y-4">
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
              <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded transition duration-200 mt-2 cursor-pointer"
              >
                Iniciar Sesión
              </button>
            </form>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen w-full bg-slate-900 text-white flex flex-col">
        {/* Barra Superior */}
        <header className="bg-slate-800 border-b border-slate-700 p-4 px-8 flex justify-between items-center shadow-lg w-full">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400">ServiTrack</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <User size={12} /> {user.nombre} | Rol: <span className="text-cyan-300 font-semibold">{user.rol}</span>
            </p>
          </div>
          <button
              onClick={logout}
              className="flex items-center gap-2 bg-rose-600/80 hover:bg-rose-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition cursor-pointer"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </header>

        {/* Panel Principal FULL WIDTH */}
        <main className="w-full p-6 flex-1 space-y-6">

          {/* VISTA EXCLUSIVA ADMINISTRADOR */}
          {user.rol === 'Administrador' && (
              <div className="space-y-6 w-full">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-md w-full">
                  <h2 className="text-base font-bold text-cyan-300 flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
                    <UserPlus size={18} /> Registrar Nuevo Usuario en la Plataforma
                  </h2>
                  <form onSubmit={handleRegisterByAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                      <input
                          type="text"
                          required
                          placeholder="Ej. Ana Gómez"
                          value={nuevoNombre}
                          onChange={(e) => setNuevoNombre(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                      <input
                          type="email"
                          required
                          placeholder="ana@empresa.com"
                          value={nuevoEmail}
                          onChange={(e) => setNuevoEmail(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
                      <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={nuevoPassword}
                          onChange={(e) => setNuevoPassword(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Rol de Usuario</label>
                      <div className="flex gap-2">
                        <select
                            value={nuevoRolId}
                            onChange={(e) => setNuevoRolId(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                        >
                          <option value={3}>Trabajador / Empleado</option>
                          <option value={2}>Soporte TI</option>
                        </select>
                        <button
                            type="submit"
                            disabled={loadingAdminRegister}
                            className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 text-white font-bold px-4 py-2 rounded text-xs transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
                        >
                          {loadingAdminRegister ? 'Guardando...' : 'Crear'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="bg-slate-800 border border-cyan-800/50 rounded-xl p-5 shadow-md space-y-4 w-full">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                    <h2 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                      <Users size={18} /> Directorio de Usuarios Registrados
                    </h2>
                    <span className="text-xs bg-cyan-950 text-cyan-400 px-3 py-1 rounded-full font-mono border border-cyan-800/60 font-bold">
                  Total: {soporteUsuarios.length + empleadosUsuarios.length}
                </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="bg-slate-900/60 border border-cyan-500/20 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
                        <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <Headphones size={14} /> Personal de Soporte TI
                        </h3>
                        <span className="text-[11px] bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded font-mono">
                      {soporteUsuarios.length}
                    </span>
                      </div>
                      <div className="space-y-2">
                        {soporteUsuarios.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-2">No hay personal de soporte registrado.</p>
                        ) : (
                            soporteUsuarios.map((u) => (
                                <div key={u.id} className="bg-slate-800 border border-slate-700 p-2.5 rounded-md flex justify-between items-center gap-2">
                                  <div>
                                    <p className="text-xs font-bold text-white">{u.nombre}</p>
                                    <p className="text-[11px] text-slate-400">{u.email}</p>
                                  </div>
                                  <button
                                      onClick={() => solicitarCambioRol(u, 3, 'Trabajador / Empleado')}
                                      title="Cambiar a Rol Trabajador"
                                      className="bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 shrink-0 cursor-pointer border border-slate-600"
                                  >
                                    <RefreshCw size={12} /> Pasar a Trabajador
                                  </button>
                                </div>
                            ))
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-700/80 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                        <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                          <User size={14} /> Empleados / Trabajadores
                        </h3>
                        <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      {empleadosUsuarios.length}
                    </span>
                      </div>
                      <div className="space-y-2">
                        {empleadosUsuarios.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-2">No hay empleados registrados.</p>
                        ) : (
                            empleadosUsuarios.map((u) => (
                                <div key={u.id} className="bg-slate-800 border border-slate-700 p-2.5 rounded-md flex justify-between items-center gap-2">
                                  <div>
                                    <p className="text-xs font-bold text-white">{u.nombre}</p>
                                    <p className="text-[11px] text-slate-400">{u.email}</p>
                                  </div>
                                  <button
                                      onClick={() => solicitarCambioRol(u, 2, 'Soporte TI')}
                                      title="Cambiar a Rol Soporte TI"
                                      className="bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 shrink-0 cursor-pointer"
                                  >
                                    <RefreshCw size={12} /> Pasar a Soporte TI
                                  </button>
                                </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* BARRA DE FILTROS GLOBALES */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Filter size={18} /> Filtrar Tickets
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-xs">
                <label className="text-slate-400 font-semibold">Categoría:</label>
                <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Todas">Todas las categorías</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Redes">Redes</option>
                  <option value="Acceso / Permisos">Acceso / Permisos</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label className="text-slate-400 font-semibold">Prioridad:</label>
                <select
                    value={filtroPrioridad}
                    onChange={(e) => setFiltroPrioridad(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Todas">Todas las prioridades</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>

              {(filtroCategoria !== 'Todas' || filtroPrioridad !== 'Todas') && (
                  <button
                      onClick={() => { setFiltroCategoria('Todas'); setFiltroPrioridad('Todas'); }}
                      className="text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                  >
                    Limpiar filtros
                  </button>
              )}
            </div>
          </div>

          {(user.rol === 'Trabajador' || user.rol === 'Empleado') ? (
              /* VISTA TRABAJADOR */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
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
                        className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 text-white font-bold py-2.5 rounded transition flex justify-center items-center gap-2 cursor-pointer"
                    >
                      {loading ? 'Generando respuesta IA...' : 'Enviar Ticket'}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-cyan-300">
                    <Ticket size={20} /> Mis Tickets Solicitados ({ticketsFiltrados.length})
                  </h2>
                  {ticketsFiltrados.length === 0 ? (
                      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center text-slate-400">
                        No se encontraron tickets con los filtros aplicados.
                      </div>
                  ) : (
                      ticketsFiltrados.map((t) => <TicketCard key={t.id} ticket={t} />)
                  )}
                </div>
              </div>
          ) : (
              /* TABLERO KANBAN FULL WIDTH (SOPORTE TI Y ADMIN) */
              <div className="space-y-4 w-full">
                <h2 className="text-lg font-bold flex items-center gap-2 text-cyan-300 mb-2">
                  <Ticket size={20} /> Tablero de Gestión de Incidencias TI
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full">

                  {/* Columna 1: Abiertos */}
                  <div className="bg-slate-800/60 border border-amber-500/20 rounded-xl p-4 space-y-3 w-full">
                    <div className="flex justify-between items-center border-b border-amber-500/30 pb-2">
                      <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                        <Clock size={16} /> Abiertos
                      </h3>
                      <span className="bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded-full font-semibold border border-amber-500/20">
                    {abiertos.length}
                  </span>
                    </div>
                    <div className="space-y-3">
                      {abiertos.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-4">Sin tickets en esta columna</p>
                      ) : (
                          abiertos.map((t) => <TicketCard key={t.id} ticket={t} />)
                      )}
                    </div>
                  </div>

                  {/* Columna 2: En Proceso */}
                  <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-4 space-y-3 w-full">
                    <div className="flex justify-between items-center border-b border-blue-500/30 pb-2">
                      <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                        <AlertCircle size={16} /> En Proceso
                      </h3>
                      <span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded-full font-semibold border border-blue-500/20">
                    {enProceso.length}
                  </span>
                    </div>
                    <div className="space-y-3">
                      {enProceso.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-4">Sin tickets en esta columna</p>
                      ) : (
                          enProceso.map((t) => <TicketCard key={t.id} ticket={t} />)
                      )}
                    </div>
                  </div>

                  {/* Columna 3: Cerrados */}
                  <div className="bg-slate-800/60 border border-emerald-500/20 rounded-xl p-4 space-y-3 w-full">
                    <div className="flex justify-between items-center border-b border-emerald-500/30 pb-2">
                      <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 size={16} /> Cerrados / Resueltos
                      </h3>
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">
                    {cerrados.length}
                  </span>
                    </div>
                    <div className="space-y-3">
                      {cerrados.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-4">Sin tickets en esta columna</p>
                      ) : (
                          cerrados.map((t) => <TicketCard key={t.id} ticket={t} />)
                      )}
                    </div>
                  </div>

                </div>
              </div>
          )}

        </main>

        {/* MODAL DE CONFIRMACIÓN DE CAMBIO DE ROL */}
        {confirmModal.isOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-amber-400">
                  <AlertTriangle size={24} />
                  <h3 className="text-lg font-bold text-white">¿Confirmar cambio de rol?</h3>
                </div>

                <p className="text-sm text-slate-300">
                  ¿Está seguro que desea cambiar el rol del usuario <strong className="text-cyan-300">{confirmModal.usuario?.nombre}</strong> al nuevo rol de <strong className="text-cyan-300">{confirmModal.nuevoRolNombre}</strong>?
                </p>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                      onClick={() => setConfirmModal({ isOpen: false, usuario: null, nuevoRolId: null, nuevoRolNombre: '' })}
                      className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Denegar / Cancelar
                  </button>
                  <button
                      onClick={ejecutarCambioRol}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Aceptar Cambio
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}