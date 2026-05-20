import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import RoleApp from './RoleApp.jsx';
import './styles.css';

const BUILD = 'role-ui-1812';
const STAFF_USERS = [
  { login: 'admin', password: 'admin123', role: 'admin', name: 'Администратор' },
  { login: 'master', password: 'master123', role: 'therapist', name: 'Массажист' },
];

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function AuthGate() {
  const [user, setUser] = useState(() => readJson('lakizaDemoUser', null));
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ login: '', password: '', name: '', phone: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.documentElement.dataset.build = BUILD;
  }, []);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage('');
  };

  const signIn = () => {
    const login = form.login.trim().toLowerCase();
    const password = form.password.trim();
    const clients = readJson('lakizaDemoClients', []);
    const found = [...STAFF_USERS, ...clients].find((item) => item.login === login && item.password === password);

    if (!found) {
      setMessage('Неверный логин или пароль');
      return;
    }

    const nextUser = { login: found.login, role: found.role, name: found.name || found.login, phone: found.phone || '' };
    saveJson('lakizaDemoUser', nextUser);
    setUser(nextUser);
  };

  const register = () => {
    const login = form.login.trim().toLowerCase();
    const password = form.password.trim();
    const name = form.name.trim() || 'Клиент';
    const phone = form.phone.trim();

    if (login.length < 3 || password.length < 4) {
      setMessage('Логин минимум 3 символа, пароль минимум 4');
      return;
    }

    const clients = readJson('lakizaDemoClients', []);
    const exists = [...STAFF_USERS, ...clients].some((item) => item.login === login);
    if (exists) {
      setMessage('Такой логин уже занят');
      return;
    }

    const nextClient = { login, password, name, phone, role: 'client' };
    const nextClients = [...clients, nextClient];
    saveJson('lakizaDemoClients', nextClients);
    const nextUser = { login, role: 'client', name, phone };
    saveJson('lakizaDemoUser', nextUser);
    setUser(nextUser);
  };

  const logout = () => {
    try {
      localStorage.removeItem('lakizaDemoUser');
    } catch {}
    setUser(null);
    setMode('login');
    setMessage('');
  };

  const updateUser = (nextUser) => {
    saveJson('lakizaDemoUser', nextUser);
    setUser(nextUser);
  };

  if (user) {
    return <RoleApp user={user} logout={logout} onUserUpdate={updateUser} build={BUILD} />;
  }

  return (
    <main className="min-h-screen bg-[#041008] px-4 py-6 text-white selection:bg-lime-200 selection:text-emerald-950">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(190,255,120,.28),transparent_32%),radial-gradient(circle_at_90%_20%,rgba(37,99,235,.22),transparent_28%),linear-gradient(180deg,#041008_0%,#0b2214_58%,#041008_100%)]" />
      <section className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1fr_420px]">
        <div className="rounded-[2.5rem] border border-white/10 bg-white/[.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-10">
          <div className="mb-5 inline-flex rounded-full bg-lime-200 px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-emerald-950">новая версия {BUILD}</div>
          <h1 className="text-5xl font-black leading-[.9] tracking-[-.07em] text-lime-50 md:text-7xl">Лакиза<br /><span className="text-lime-200">личный кабинет</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/70">Вход определяет роль. Клиент видит запись и свои визиты. Массажист видит рабочие записи. Администратор управляет ролями и всеми записями.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Info title="Админ" text="admin / admin123" />
            <Info title="Массажист" text="master / master123" />
            <Info title="Клиент" text="регистрация" />
          </div>
        </div>

        <div className="rounded-[2.2rem] border border-white/10 bg-[#07140e]/90 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
            <button type="button" onClick={() => { setMode('login'); setMessage(''); }} className={`rounded-xl px-4 py-3 text-sm font-black ${mode === 'login' ? 'bg-lime-200 text-emerald-950' : 'text-emerald-50/65'}`}>Вход</button>
            <button type="button" onClick={() => { setMode('register'); setMessage(''); }} className={`rounded-xl px-4 py-3 text-sm font-black ${mode === 'register' ? 'bg-lime-200 text-emerald-950' : 'text-emerald-50/65'}`}>Регистрация</button>
          </div>

          <div className="space-y-3">
            {mode === 'register' && (
              <>
                <Input label="Имя" value={form.name} onChange={(value) => setField('name', value)} placeholder="Иван" />
                <Input label="Телефон" value={form.phone} onChange={(value) => setField('phone', value)} placeholder="+7 ..." />
              </>
            )}
            <Input label="Логин" value={form.login} onChange={(value) => setField('login', value)} placeholder={mode === 'login' ? 'admin или master' : 'придумай логин'} />
            <Input label="Пароль" type="password" value={form.password} onChange={(value) => setField('password', value)} placeholder={mode === 'login' ? 'admin123 или master123' : 'минимум 4 символа'} />
          </div>

          {message && <div className="mt-4 rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-bold text-red-100">{message}</div>}

          <button type="button" onClick={mode === 'login' ? signIn : register} className="mt-5 w-full rounded-full bg-lime-200 px-5 py-4 text-lg font-black text-emerald-950 shadow-xl shadow-lime-950/20">
            {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </div>
      </section>
    </main>
  );
}

function Info({ title, text }) {
  return <div className="rounded-2xl bg-white/10 p-4"><div className="text-xs font-black uppercase tracking-[.18em] text-lime-200/70">{title}</div><div className="mt-1 text-sm font-bold text-emerald-50/80">{text}</div></div>;
}

function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-[.16em] text-lime-200/60">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-4 font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35" />
    </label>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>
);
