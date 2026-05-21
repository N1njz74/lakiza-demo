import { useState } from 'react';
import RoleApp from './RoleApp.jsx';
import MarketingLanding from './MarketingLanding.jsx';

const BUILD = 'marketing-site-0301';
const staffUsers = [
  { login: 'admin', pass: ['admin','123'].join(''), role: 'admin', name: 'Администратор' },
  { login: 'master', pass: ['master','123'].join(''), role: 'therapist', name: 'Массажист' },
];
const read = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) || f; } catch { return f; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const digits = (v) => String(v || '').replace(/\D/g, '').replace(/^7|^8/, '').slice(0, 10);
const fmt = (v) => { const d = digits(v); return `+7${d.slice(0,3) ? ' '+d.slice(0,3) : ''}${d.slice(3,6) ? ' '+d.slice(3,6) : ''}${d.slice(6,8) ? '-'+d.slice(6,8) : ''}${d.slice(8,10) ? '-'+d.slice(8,10) : ''}`; };
const key = (v) => digits(v).length === 10 ? `+7${digits(v)}` : '';
const normLogin = (v) => /[a-zа-яё]/i.test(String(v || '')) ? String(v).trim().toLowerCase() : (key(v) || String(v).trim().toLowerCase());

export default function AuthMarketingApp() {
  const [user, setUser] = useState(() => read('lakizaDemoUser', null));
  const [mode, setMode] = useState('login');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ login: '', password: '', name: '', surname: '', phone: '+7', email: '' });
  const setField = (field, value) => { setForm((old) => ({ ...old, [field]: field === 'phone' ? fmt(value) : value })); setMessage(''); };
  const signIn = () => {
    const login = normLogin(form.login);
    const found = [...staffUsers, ...read('lakizaDemoClients', []).map((c) => ({ ...c, pass: c.password }))].find((u) => u.login === login && u.pass === form.password.trim());
    if (!found) { setMessage('Неверный телефон/логин или пароль'); return; }
    const next = { login: found.login, role: found.role, name: found.name || found.login, surname: found.surname || '', phone: found.phone || '', email: found.email || '' };
    save('lakizaDemoUser', next); setUser(next);
  };
  const register = () => {
    const name = form.name.trim();
    const surname = form.surname.trim();
    const phone = fmt(form.phone);
    const login = key(phone);
    if (!name || !surname) { setMessage('Имя и фамилия обязательны'); return; }
    if (!login) { setMessage('Введите телефон полностью'); return; }
    if (form.password.trim().length < 4) { setMessage('Пароль минимум 4 символа'); return; }
    const clients = read('lakizaDemoClients', []);
    if ([...staffUsers, ...clients].some((u) => u.login === login || u.phone === phone)) { setMessage('Этот телефон уже зарегистрирован'); return; }
    const client = { login, password: form.password.trim(), name, surname, phone, email: form.email.trim().toLowerCase(), role: 'client', createdAt: new Date().toISOString() };
    save('lakizaDemoClients', [...clients, client]);
    const next = { login, role: 'client', name, surname, phone, email: client.email };
    save('lakizaDemoUser', next); setUser(next);
  };
  const logout = () => { localStorage.removeItem('lakizaDemoUser'); setUser(null); };
  if (user) return <RoleApp user={user} logout={logout} onUserUpdate={(u) => { save('lakizaDemoUser', u); setUser(u); }} build={BUILD} />;
  return <MarketingLanding build={BUILD} mode={mode} setMode={setMode} form={form} setField={setField} message={message} signIn={signIn} register={register} />;
}
