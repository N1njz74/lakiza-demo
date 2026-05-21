import heroMassageImage from './assets/lakiza-hero-massage.webp';

const services = [
  { title: 'Спина и шея', text: 'Снять напряжение после работы, телефона, вождения и долгого сидения.', time: '60 мин', price: 'от 2 000 ₽' },
  { title: 'Классический массаж', text: 'Общий оздоровительный формат: спина, плечи, ноги, руки, расслабление.', time: '90 мин', price: 'от 2 800 ₽' },
  { title: 'Антистресс', text: 'Мягкая работа с телом, дыханием и общим расслаблением нервной системы.', time: '60 мин', price: 'от 2 200 ₽' },
  { title: 'Лимфодренаж', text: 'Аккуратная работа с отёчностью, тяжестью и восстановлением после нагрузок.', time: '60 мин', price: 'от 2 500 ₽' },
  { title: 'Курс массажа', text: 'Комплекс сеансов с расписанием, историей посещений и динамикой замеров.', time: '4–10 сеансов', price: 'индивидуально' },
  { title: 'Персональный план', text: 'Подбор массажиста, режима посещений и задач под конкретного клиента.', time: 'по задаче', price: 'после консультации' },
];

const benefits = [
  ['Запись онлайн', 'Выбор даты, времени, услуги и массажиста без звонков.'],
  ['Личный кабинет', 'Клиент видит будущие сеансы, историю, переносы и статусы.'],
  ['Курс под контролем', 'После сеансов массажист вносит вес, рост, заметки и динамику.'],
  ['Без лишнего хаоса', 'Администратор и массажисты работают в едином расписании.'],
];

const therapists = [
  ['Кристина Лакиза', 'директор / старший массажист', 'ведёт сложные курсы и контроль качества'],
  ['Вера Соколова', 'массажист', 'антистресс, спина, мягкие техники'],
  ['Алина Миронова', 'массажист', 'спорт, восстановление, лимфодренаж'],
];

const steps = [
  ['1', 'Выберите услугу', 'Посмотрите направления, длительность и примерную стоимость.'],
  ['2', 'Оставьте заявку', 'Регистрация по телефону +7, без лишнего логина.'],
  ['3', 'Получите подтверждение', 'Администратор согласует время, переносы и детали.'],
  ['4', 'Ведите курс', 'В кабинете сохраняется история сеансов и динамика.'],
];

const faq = [
  ['Можно ли перенести запись?', 'Да. Клиент отправляет запрос переноса, а администратор или массажист согласовывает изменение.'],
  ['Вес и рост вводит клиент?', 'Нет. Взвешивание проходит в кабинете, данные после сеанса вносит массажист.'],
  ['Можно записаться на курс?', 'Да. Система рассчитана не только на один сеанс, а на комплекс посещений с расписанием.'],
  ['Нужна ли регистрация?', 'Для заявки и личного кабинета — да. Достаточно имени, фамилии, телефона и пароля.'],
];

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function MarketingLanding({ build, mode, setMode, form, setField, message, signIn, register }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#041008] text-white selection:bg-lime-200 selection:text-emerald-950">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(207,255,128,.28),transparent_28%),radial-gradient(circle_at_86%_14%,rgba(130,255,86,.18),transparent_30%),radial-gradient(circle_at_50%_56%,rgba(25,82,46,.25),transparent_40%),linear-gradient(180deg,#031008_0%,#092115_45%,#041008_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-70 [background-image:linear-gradient(rgba(216,255,135,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(216,255,135,.05)_1px,transparent_1px)] [background-size:52px_52px]" />

      <header className="fixed left-0 right-0 top-0 z-50 px-2 pt-2 md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 rounded-[1.1rem] border border-white/10 bg-[#06140d]/88 px-3 py-2 shadow-2xl shadow-black/35 backdrop-blur-xl md:px-5">
          <button type="button" onClick={() => scrollToId('top')} className="flex min-w-0 items-center gap-3 text-left">
            <BrandMark />
            <span className="min-w-0">
              <span className="block truncate text-[10px] font-black uppercase tracking-[.14em] text-lime-300/70">массажный кабинет</span>
              <span className="block truncate text-lg font-black leading-none tracking-[.14em] text-lime-100">«ЛАКИЗА»</span>
            </span>
          </button>
          <nav className="hidden items-center gap-1 lg:flex">
            <NavButton id="services" text="Услуги" />
            <NavButton id="course" text="Курс" />
            <NavButton id="therapists" text="Массажисты" />
            <NavButton id="faq" text="FAQ" />
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-full border border-lime-200/15 bg-black/20 px-2 py-1 text-[8px] font-black text-lime-300/55 sm:inline">{build}</span>
            <button type="button" onClick={() => scrollToId('auth')} className="rounded-full bg-lime-200 px-4 py-2 text-xs font-black text-emerald-950">Записаться</button>
          </div>
        </div>
      </header>

      <section id="top" className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-5 px-3 pb-10 pt-28 md:px-6 lg:grid-cols-[1.1fr_430px]">
        <div className="relative rounded-[2.4rem] border border-white/10 bg-white/[.06] p-5 shadow-2xl shadow-black/40 backdrop-blur-xl md:p-10">
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge text="онлайн-запись" />
            <Badge text="личный кабинет" />
            <Badge text="курсы массажа" />
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[.88] tracking-[-.075em] text-lime-50 md:text-7xl lg:text-8xl">
            Массаж, который хочется продолжать курсом
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/72">
            Сайт «Лакиза» теперь не только записывает клиентов, но и продаёт услугу: объясняет пользу, показывает направления, ведёт клиента к заявке и дальше сопровождает его через личный кабинет.
          </p>
          <div className="relative mt-7 overflow-hidden rounded-[1.6rem] border border-lime-200/15 bg-black/35 shadow-2xl shadow-black/35">
            <img src={heroMassageImage} alt="Премиальный массажный кабинет Лакиза с моховым знаком инь-янь" className="h-56 w-full object-cover object-left md:h-72" loading="eager" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(4,16,8,.12),rgba(4,16,8,.5)_62%,rgba(4,16,8,.78)),linear-gradient(0deg,rgba(4,16,8,.72),transparent_45%)]" />
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2">
              <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md">
                <div className="text-[9px] font-black uppercase tracking-[.16em] text-lime-300/75">атмосфера кабинета</div>
                <div className="text-sm font-black text-lime-50">мох · тёплый свет · спокойствие</div>
              </div>
              <div className="rounded-full bg-lime-200 px-3 py-2 text-xs font-black text-emerald-950">запись онлайн</div>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={() => scrollToId('auth')} className="rounded-full bg-lime-200 px-6 py-4 text-sm font-black text-emerald-950 shadow-xl shadow-lime-950/20">Записаться на массаж</button>
            <button type="button" onClick={() => scrollToId('services')} className="rounded-full border border-white/15 bg-white/10 px-6 py-4 text-sm font-black text-lime-50">Посмотреть услуги</button>
          </div>
          <div className="mt-8 grid gap-2 sm:grid-cols-3">
            <HeroMetric value="08–21" label="гибкое рабочее время" />
            <HeroMetric value="2/2" label="графики массажистов" />
            <HeroMetric value="курс" label="история и статистика" />
          </div>
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-lime-200/10 blur-3xl" />
        </div>

        <AuthCard mode={mode} setMode={setMode} form={form} setField={setField} message={message} signIn={signIn} register={register} />
      </section>

      <section className="relative mx-auto max-w-7xl px-3 py-8 md:px-6" id="services">
        <SectionTitle eyebrow="направления" title="Услуги, которые легко выбрать" text="Каждая карточка ведёт к понятному действию: выбрать услугу, зарегистрироваться и отправить заявку." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {services.map((item) => <ServiceCard key={item.title} item={item} />)}
        </div>
      </section>

      <section id="course" className="relative mx-auto max-w-7xl px-3 py-8 md:px-6">
        <div className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-[2rem] border border-lime-200/15 bg-lime-200 p-5 text-emerald-950 shadow-2xl shadow-black/35 md:p-8">
            <div className="text-[10px] font-black uppercase tracking-[.18em] opacity-60">курс массажа</div>
            <h2 className="mt-2 text-4xl font-black leading-none tracking-[-.06em] md:text-5xl">Не один визит, а понятный маршрут</h2>
            <p className="mt-4 text-sm font-bold leading-7 opacity-75">Клиенту важно видеть не только ближайший сеанс, но и весь план: история, будущие записи, переносы, согласования и динамика замеров.</p>
            <button type="button" onClick={() => scrollToId('auth')} className="mt-6 rounded-full bg-emerald-950 px-5 py-3 text-xs font-black text-lime-100">Начать курс</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map(([title, text]) => <Benefit key={title} title={title} text={text} />)}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-3 py-8 md:px-6">
        <SectionTitle eyebrow="как это работает" title="Путь клиента от рекламы до повторного визита" text="Главная страница должна быстро объяснить ценность и перевести человека к записи." />
        <div className="grid gap-3 md:grid-cols-4">
          {steps.map(([num, title, text]) => <Step key={num} num={num} title={title} text={text} />)}
        </div>
      </section>

      <section id="therapists" className="relative mx-auto max-w-7xl px-3 py-8 md:px-6">
        <SectionTitle eyebrow="команда" title="Массажисты и доверие" text="Человек должен понимать, кто будет с ним работать, и почему салону можно доверять." />
        <div className="grid gap-3 md:grid-cols-3">
          {therapists.map(([name, role, text]) => <Therapist key={name} name={name} role={role} text={text} />)}
        </div>
      </section>

      <section id="faq" className="relative mx-auto max-w-7xl px-3 py-8 md:px-6">
        <SectionTitle eyebrow="вопросы" title="Закрываем возражения до записи" text="Этот блок нужен для рекламы и поискового трафика: меньше сомнений — больше заявок." />
        <div className="grid gap-3 md:grid-cols-2">
          {faq.map(([q, a]) => <Faq key={q} q={q} a={a} />)}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-3 py-8 md:px-6" id="auth">
        <div className="grid gap-4 lg:grid-cols-[1fr_430px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[.06] p-5 backdrop-blur-xl md:p-8">
            <div className="text-[10px] font-black uppercase tracking-[.18em] text-lime-300/70">финальный экран</div>
            <h2 className="mt-2 text-4xl font-black leading-none tracking-[-.06em] text-lime-50 md:text-6xl">Готовы подобрать время?</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/65">Регистрация нужна, чтобы сохранить будущие записи, историю посещений, переносы и напоминания. Клиентский кабинет становится продолжением сайта-визитки.</p>
          </div>
          <AuthCard mode={mode} setMode={setMode} form={form} setField={setField} message={message} signIn={signIn} register={register} compact />
        </div>
      </section>

      <footer className="relative mx-auto max-w-7xl px-3 pb-8 pt-4 md:px-6">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-emerald-50/45">© Массажный кабинет «Лакиза». Демо-версия сайта: продажи, запись, личные кабинеты и админ-система.</div>
      </footer>
    </main>
  );
}

function NavButton({ id, text }) { return <button type="button" onClick={() => scrollToId(id)} className="rounded-full px-3 py-2 text-xs font-black text-emerald-50/70 transition hover:bg-white/10 hover:text-lime-100">{text}</button>; }
function Badge({ text }) { return <span className="rounded-full border border-lime-200/20 bg-lime-200/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] text-lime-200/80">{text}</span>; }
function BrandMark() { return <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-lime-200 shadow-[0_0_28px_rgba(216,255,135,.22)]"><span className="h-8 w-8 rounded-full bg-[conic-gradient(from_45deg,#07140e_0_50%,#7ed957_50%_100%)] shadow-inner shadow-black/40" /></span>; }
function HeroMetric({ value, label }) { return <div className="rounded-2xl bg-black/22 p-4"><b className="block text-2xl font-black text-lime-100">{value}</b><span className="text-xs font-bold text-emerald-50/50">{label}</span></div>; }
function SectionTitle({ eyebrow, title, text }) { return <div className="mb-5 max-w-3xl"><div className="text-[10px] font-black uppercase tracking-[.18em] text-lime-300/70">{eyebrow}</div><h2 className="mt-2 text-4xl font-black leading-none tracking-[-.06em] text-lime-50 md:text-6xl">{title}</h2><p className="mt-3 text-sm leading-7 text-emerald-50/62">{text}</p></div>; }
function ServiceCard({ item }) { return <div className="group rounded-[1.6rem] border border-white/10 bg-white/[.07] p-5 shadow-xl shadow-black/20 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[.1]"><div className="mb-4 h-24 rounded-2xl bg-[radial-gradient(circle_at_25%_20%,rgba(216,255,135,.5),transparent_30%),linear-gradient(135deg,rgba(216,255,135,.18),rgba(255,255,255,.04))]" /><h3 className="text-2xl font-black tracking-[-.04em] text-lime-50">{item.title}</h3><p className="mt-2 min-h-[72px] text-sm leading-6 text-emerald-50/62">{item.text}</p><div className="mt-4 flex items-center justify-between gap-2"><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-lime-100">{item.time}</span><b className="text-sm text-lime-200">{item.price}</b></div></div>; }
function Benefit({ title, text }) { return <div className="rounded-[1.5rem] border border-white/10 bg-white/[.07] p-5 backdrop-blur-xl"><b className="block text-xl text-lime-100">{title}</b><p className="mt-2 text-sm leading-6 text-emerald-50/58">{text}</p></div>; }
function Step({ num, title, text }) { return <div className="rounded-[1.5rem] border border-white/10 bg-white/[.06] p-5"><span className="grid h-10 w-10 place-items-center rounded-full bg-lime-200 text-sm font-black text-emerald-950">{num}</span><b className="mt-4 block text-lg text-lime-100">{title}</b><p className="mt-2 text-sm leading-6 text-emerald-50/58">{text}</p></div>; }
function Therapist({ name, role, text }) { return <div className="rounded-[1.5rem] border border-white/10 bg-white/[.07] p-5 backdrop-blur-xl"><div className="mb-4 h-28 rounded-2xl bg-[radial-gradient(circle_at_50%_20%,rgba(216,255,135,.42),transparent_28%),linear-gradient(180deg,rgba(9,33,21,.2),rgba(216,255,135,.08))]" /><b className="block text-xl text-lime-100">{name}</b><span className="text-xs font-black uppercase tracking-[.12em] text-lime-200/55">{role}</span><p className="mt-2 text-sm leading-6 text-emerald-50/58">{text}</p></div>; }
function Faq({ q, a }) { return <div className="rounded-[1.4rem] border border-white/10 bg-white/[.06] p-5"><b className="block text-lg text-lime-100">{q}</b><p className="mt-2 text-sm leading-6 text-emerald-50/58">{a}</p></div>; }

function AuthCard({ mode, setMode, form, setField, message, signIn, register, compact = false }) {
  return <div className="rounded-[2rem] border border-white/10 bg-[#07140e]/92 p-5 shadow-2xl shadow-black/45 backdrop-blur-xl">
    <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1"><button type="button" onClick={() => setMode('login')} className={`rounded-xl px-4 py-3 text-sm font-black ${mode === 'login' ? 'bg-lime-200 text-emerald-950' : 'text-emerald-50/65'}`}>Вход</button><button type="button" onClick={() => setMode('register')} className={`rounded-xl px-4 py-3 text-sm font-black ${mode === 'register' ? 'bg-lime-200 text-emerald-950' : 'text-emerald-50/65'}`}>Регистрация</button></div>
    {!compact && <div className="mb-4 rounded-2xl bg-lime-200/10 p-3 text-xs font-bold text-lime-100/80">Запись, история сеансов, переносы и напоминания доступны после входа.</div>}
    <div className="space-y-3">{mode === 'register' ? <><Input label="Имя *" value={form.name} onChange={(value) => setField('name', value)} placeholder="Иван" /><Input label="Фамилия *" value={form.surname} onChange={(value) => setField('surname', value)} placeholder="Иванов" /><Input label="Телефон *" type="tel" value={form.phone} onChange={(value) => setField('phone', value)} placeholder="+7 900 000-00-00" /><Input label="Email" type="email" value={form.email} onChange={(value) => setField('email', value)} placeholder="name@example.ru" /></> : <Input label="Телефон" value={form.login} onChange={(value) => setField('login', value)} placeholder="+7 900 000-00-00 или admin/master" />}<Input label="Пароль" type="password" value={form.password} onChange={(value) => setField('password', value)} placeholder={mode === 'login' ? 'пароль' : 'минимум 4 символа'} /></div>
    {message && <div className="mt-4 rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-bold text-red-100">{message}</div>}
    <button type="button" onClick={mode === 'login' ? signIn : register} className="mt-5 w-full rounded-full bg-lime-200 px-5 py-4 text-lg font-black text-emerald-950 shadow-xl shadow-lime-950/20">{mode === 'login' ? 'Войти' : 'Зарегистрироваться'}</button>
    <div className="mt-4 grid gap-2 rounded-2xl bg-black/20 p-3 text-[11px] text-emerald-50/50"><span><b className="text-lime-200">Демо админ:</b> admin / admin123</span><span><b className="text-lime-200">Демо массажист:</b> master / master123</span></div>
  </div>;
}

function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-[.16em] text-lime-200/60">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-4 font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35" /></label>;
}
