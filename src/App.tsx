import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import type { CSSProperties } from 'react'

type Role =
  | 'coach'
  | 'methodologist'
  | 'physical_trainer'
  | 'nutritionist'
  | 'physiotherapist'
  | 'doctor'
  | 'sports_psychologist'
  | 'athlete'

type Page =
  | 'dashboard'
  | 'athletes'
  | 'profile'
  | 'sessions'
  | 'planning'
  | 'videos'
  | 'tests'
  | 'health'
  | 'nutrition'
  | 'competitions'

type AthleteTab =
  | 'summary'
  | 'profile'
  | 'planning'
  | 'sessions'
  | 'tricks'
  | 'videos'
  | 'tests'
  | 'medicine'
  | 'physio'
  | 'nutrition'
  | 'competitions'
  | 'progress'

type PlanningCategory =
  | 'macrociclo'
  | 'mesociclo'
  | 'microciclo'
  | 'objetivos'

interface Profile {
  id: string
  full_name: string | null
  role: Role | null
  photo_url: string | null
  phone: string | null
  city: string | null
  country: string | null
  specialty: string | null
  bio: string | null
  experience_years: number | null
  created_at: string
}

interface Athlete {
  id: string
  user_id: string
  full_name: string | null
  birth_date: string | null
  category: string | null
  club: string | null
  city: string | null
  country: string | null
  discipline: string | null
  goals: string | null
  height_cm: number | null
  weight_kg: number | null
  bio: string | null
  photo_url: string | null
  active: boolean | null
}

interface PlanningDocument {
  id: string
  athlete_id: string
  title: string
  category: PlanningCategory
  file_name: string
  file_path: string
  created_at: string
}

interface SessionDocument {
  id: string
  athlete_id: string
  title: string
  session_date: string
  file_name: string
  file_path: string
  uploaded_by: string | null
  created_at: string
}

interface Trick {
  id: string
  athlete_id: string
  name: string
  difficulty: string
  status: string
  observations: string | null
  video_url: string | null
  created_at: string
}

const ROLE_LABEL: Record<Role, string> = {
  coach: 'Coach',
  methodologist: 'Metodólogo',
  physical_trainer: 'Preparador físico',
  nutritionist: 'Nutricionista',
  physiotherapist: 'Fisioterapeuta',
  doctor: 'Médico',
  sports_psychologist: 'Psicólogo deportivo',
  athlete: 'Atleta',
}

const ALL_TABS: {
  id: AthleteTab
  label: string
  icon: string
}[] = [
  { id: 'summary', label: 'Resumen', icon: '📋' },
  { id: 'profile', label: 'Perfil', icon: '👤' },
  { id: 'planning', label: 'Planificación', icon: '📚' },
  { id: 'sessions', label: 'Sesiones', icon: '📅' },
  { id: 'tricks', label: 'Mis trucos', icon: '🚲' },
  { id: 'videos', label: 'Videos', icon: '🎥' },
  { id: 'tests', label: 'Tests', icon: '🧪' },
  { id: 'medicine', label: 'Medicina', icon: '🩺' },
  { id: 'physio', label: 'Fisioterapia', icon: '🧑‍⚕️' },
  { id: 'nutrition', label: 'Nutrición', icon: '🥗' },
  { id: 'competitions', label: 'Competencias', icon: '🏆' },
  { id: 'progress', label: 'Progreso', icon: '📈' },
]

function App() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const [athleteTab, setAthleteTab] = useState<AthleteTab>('summary')
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    void start()
  }, [])

  useEffect(() => {
    const auth = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUserId(null)
        setProfile(null)
        setSelectedAthlete(null)
        setPage('dashboard')
      }
    })

    return () => auth.data.subscription.unsubscribe()
  }, [])

  async function start() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) return

      setUserId(session.user.id)
      await loadProfile(session.user.id)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function loadProfile(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error(error)
      return
    }

    if (data) setProfile(data as Profile)
  }

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) return error.message

    if (!data.user) return 'No se pudo iniciar sesión.'

    setUserId(data.user.id)
    await loadProfile(data.user.id)
    return ''
  }

  async function registerAthlete(values: {
    name: string
    email: string
    password: string
    birthDate: string
    category: string
    club: string
    city: string
    country: string
    discipline: string
    goals: string
    height: string
    weight: string
  }) {
    const height = values.height.trim()
      ? Number(values.height)
      : null

    const weight = values.weight.trim()
      ? Number(values.weight)
      : null

    const { data, error } = await supabase.auth.signUp({
      email: values.email.trim(),
      password: values.password,
      options: {
        data: {
          full_name: values.name.trim(),
          role: 'athlete',
          birth_date: values.birthDate,
          category: values.category.trim(),
          club: values.club.trim() || null,
          city: values.city.trim() || null,
          country: values.country.trim() || null,
          discipline: values.discipline.trim(),
          goals: values.goals.trim() || null,
          height_cm: height,
          weight_kg: weight,
        },
      },
    })

    if (error) return { error: error.message, loggedIn: false }

    if (!data.user) {
      return {
        error: 'No se pudo crear la cuenta.',
        loggedIn: false,
      }
    }

    if (data.session) {
      setUserId(data.user.id)
      await loadProfile(data.user.id)
      return { error: '', loggedIn: true }
    }

    return {
      error: 'Cuenta creada. Revisa tu correo para confirmar.',
      loggedIn: false,
    }
  }

  async function logout() {
    await supabase.auth.signOut({ scope: 'global' })
    setUserId(null)
    setProfile(null)
    setSelectedAthlete(null)
    setPage('dashboard')
  }

  const role: Role = profile?.role ?? 'athlete'

  if (loading) {
    return (
      <>
        <div style={styles.loading}>TRICKLAB BMX</div>
        <GlobalStyles />
      </>
    )
  }

  if (!userId) {
    return (
      <>
        <PublicAuth
          onLogin={login}
          onRegister={registerAthlete}
        />
        <GlobalStyles />
      </>
    )
  }

  const openPage = (next: Page) => {
    setPage(next)
    setSelectedAthlete(null)
    setMobileMenu(false)
  }

  return (
    <>
      <div style={styles.app}>
        <Sidebar
          role={role}
          page={page}
          profile={profile}
          mobileOpen={mobileMenu}
          onNavigate={openPage}
          onClose={() => setMobileMenu(false)}
          onLogout={logout}
        />

        {mobileMenu && (
          <button
            className="backdrop"
            onClick={() => setMobileMenu(false)}
            aria-label="Cerrar menú"
          />
        )}

        <main
          className="main"
          style={{
            ...styles.main,
            marginLeft: 265,
          }}
        >
          <header style={styles.topbar}>
            <button
              className="mobileMenuButton"
              onClick={() => setMobileMenu(true)}
            >
              ☰
            </button>

            <div>
              <strong>
                Panel del {ROLE_LABEL[role]}
              </strong>
              <small>TRICKLAB BMX</small>
            </div>

            <span className="desktopOnly" style={{ color: '#16834e' }}>
              ● Activo
            </span>
          </header>

          <section style={styles.content}>
            {page === 'dashboard' && (
              <Dashboard
                role={role}
                name={profile?.full_name ?? 'Usuario'}
                onAthletes={() => openPage('athletes')}
              />
            )}

            {page === 'profile' && (
              <ProfilePage
                profile={profile}
                userId={userId}
                onSaved={() => loadProfile(userId)}
              />
            )}

            {page === 'athletes' && role === 'coach' && !selectedAthlete && (
              <AthletesPage
                onSelect={(athlete) => {
                  setSelectedAthlete(athlete)
                  setAthleteTab('summary')
                }}
              />
            )}

            {page === 'athletes' &&
              role === 'coach' &&
              selectedAthlete && (
                <AthleteFile
                  athlete={selectedAthlete}
                  role={role}
                  tab={athleteTab}
                  onTab={setAthleteTab}
                  onBack={() => setSelectedAthlete(null)}
                />
              )}

            {page !== 'dashboard' &&
              page !== 'profile' &&
              page !== 'athletes' && (
                <section style={styles.empty}>
                  <div style={{ fontSize: 55 }}>
                    {pageIcon(page)}
                  </div>

                  <h2>{pageTitle(page)}</h2>

                  <p>
                    Este módulo se gestiona desde el expediente individual.
                  </p>
                </section>
              )}
          </section>
        </main>
      </div>

      <GlobalStyles />
    </>
  )
}

/* =========================================================
   AUTH
========================================================= */

function PublicAuth({
  onLogin,
  onRegister,
}: {
  onLogin: (email: string, password: string) => Promise<string>
  onRegister: (values: any) => Promise<any>
}) {
  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>('welcome')

  if (mode === 'login') {
    return (
      <Login
        onBack={() => setMode('welcome')}
        onRegister={() => setMode('register')}
        onSubmit={onLogin}
      />
    )
  }

  if (mode === 'register') {
    return (
      <Register
        onBack={() => setMode('welcome')}
        onLogin={() => setMode('login')}
        onSubmit={onRegister}
      />
    )
  }

  return (
    <div style={styles.auth}>
      <div style={styles.authCard}>
        <div style={styles.yellow}>TRICKLAB</div>
        <div style={styles.bmx}>BMX</div>
        <div style={{ fontSize: 60 }}>🚴</div>

        <h1>Bienvenido</h1>

        <p style={styles.muted}>
          Plataforma de seguimiento y rendimiento deportivo.
        </p>

        <button
          style={styles.primary}
          onClick={() => setMode('login')}
        >
          🔐 Iniciar sesión
        </button>

        <button
          style={styles.secondary}
          onClick={() => setMode('register')}
        >
          🚴 Crear cuenta
        </button>
      </div>
    </div>
  )
}

function Login({
  onBack,
  onRegister,
  onSubmit,
}: {
  onBack: () => void
  onRegister: () => void
  onSubmit: (
    email: string,
    password: string,
  ) => Promise<string>
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setError('')
    setLoading(true)

    const result = await onSubmit(email, password)

    setLoading(false)

    if (result) setError(result)
  }

  return (
    <div style={styles.auth}>
      <div style={styles.authCard}>
        <button
          style={styles.linkButton}
          onClick={onBack}
        >
          ← Volver
        </button>

        <div style={styles.yellow}>TRICKLAB</div>
        <div style={styles.bmx}>BMX</div>

        <h1>Iniciar sesión</h1>

        <label style={styles.label}>
          Correo electrónico
        </label>

        <input
          style={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label style={styles.label}>
          Contraseña
        </label>

        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit()
          }}
        />

        {error && <Alert type="error" text={error} />}

        <button
          style={styles.primary}
          disabled={loading}
          onClick={() => void submit()}
        >
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>

        <button
          style={styles.secondary}
          onClick={onRegister}
        >
          Crear cuenta
        </button>
      </div>
    </div>
  )
}

function Register({
  onBack,
  onLogin,
  onSubmit,
}: {
  onBack: () => void
  onLogin: () => void
  onSubmit: (values: any) => Promise<any>
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    category: '',
    club: '',
    city: 'Bogotá',
    country: 'Colombia',
    discipline: 'BMX Freestyle Park',
    goals: '',
    height: '',
    weight: '',
  })

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function change(
    field: keyof typeof form,
    value: string,
  ) {
    setForm((old) => ({
      ...old,
      [field]: value,
    }))
  }

  async function submit() {
    setError('')
    setMessage('')

    if (!form.name.trim()) {
      setError('Escribe tu nombre completo.')
      return
    }

    if (!form.email.trim()) {
      setError('Escribe tu correo.')
      return
    }

    if (form.password.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (!form.birthDate) {
      setError('Selecciona tu fecha de nacimiento.')
      return
    }

    if (!form.category.trim()) {
      setError('Escribe tu categoría.')
      return
    }

    if (form.height && Number(form.height) <= 0) {
      setError('La estatura no es válida.')
      return
    }

    if (form.weight && Number(form.weight) <= 0) {
      setError('El peso no es válido.')
      return
    }

    setLoading(true)

    const result = await onSubmit({
      name: form.name,
      email: form.email,
      password: form.password,
      birthDate: form.birthDate,
      category: form.category,
      club: form.club,
      city: form.city,
      country: form.country,
      discipline: form.discipline,
      goals: form.goals,
      height: form.height,
      weight: form.weight,
    })

    setLoading(false)

    if (result.error) {
      if (result.loggedIn) {
        setMessage(result.error)
      } else {
        setError(result.error)
      }
      return
    }

    setMessage(
      'Cuenta creada correctamente. Revisa tu correo para confirmar.',
    )
  }

  return (
    <div style={styles.auth}>
      <div style={styles.registerCard}>
        <button
          style={styles.linkButton}
          onClick={onBack}
        >
          ← Volver
        </button>

        <div style={styles.yellow}>TRICKLAB</div>
        <div style={styles.bmx}>BMX</div>

        <h1>Crear cuenta</h1>

        <p style={styles.muted}>
          Todo registro público se crea automáticamente como Atleta.
        </p>

        <h3>Cuenta</h3>

        <label style={styles.label}>
          Nombre completo *
        </label>

        <input
          style={styles.input}
          value={form.name}
          onChange={(e) => change('name', e.target.value)}
        />

        <label style={styles.label}>
          Correo *
        </label>

        <input
          style={styles.input}
          type="email"
          inputMode="email"
          value={form.email}
          onChange={(e) => change('email', e.target.value)}
        />

        <div className="two">
          <div>
            <label style={styles.label}>
              Contraseña *
            </label>

            <input
              style={styles.input}
              type="password"
              value={form.password}
              onChange={(e) =>
                change('password', e.target.value)
              }
            />
          </div>

          <div>
            <label style={styles.label}>
              Repetir contraseña *
            </label>

            <input
              style={styles.input}
              type="password"
              value={form.confirmPassword}
              onChange={(e) =>
                change(
                  'confirmPassword',
                  e.target.value,
                )
              }
            />
          </div>
        </div>

        <h3>Información deportiva</h3>

        <label style={styles.label}>
          Fecha de nacimiento *
        </label>

        <input
          style={styles.input}
          type="date"
          value={form.birthDate}
          onChange={(e) =>
            change('birthDate', e.target.value)
          }
        />

        <label style={styles.label}>
          Categoría *
        </label>

        <input
          style={styles.input}
          placeholder="Ej. Elite"
          value={form.category}
          onChange={(e) =>
            change('category', e.target.value)
          }
        />

        <label style={styles.label}>
          Club
        </label>

        <input
          style={styles.input}
          value={form.club}
          onChange={(e) =>
            change('club', e.target.value)
          }
        />

        <div className="two">
          <div>
            <label style={styles.label}>
              Ciudad
            </label>

            <input
              style={styles.input}
              value={form.city}
              onChange={(e) =>
                change('city', e.target.value)
              }
            />
          </div>

          <div>
            <label style={styles.label}>
              País
            </label>

            <input
              style={styles.input}
              value={form.country}
              onChange={(e) =>
                change('country', e.target.value)
              }
            />
          </div>
        </div>

        <label style={styles.label}>
          Disciplina
        </label>

        <select
          style={styles.input}
          value={form.discipline}
          onChange={(e) =>
            change('discipline', e.target.value)
          }
        >
          <option>BMX Freestyle Park</option>
          <option>BMX Freestyle Dirt</option>
        </select>

        <h3>Información física</h3>

        <div className="two">
          <div>
            <label style={styles.label}>
              Estatura (cm)
            </label>

            <input
              style={styles.input}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="175"
              value={form.height}
              onChange={(e) =>
                change('height', e.target.value)
              }
            />
          </div>

          <div>
            <label style={styles.label}>
              Peso (kg)
            </label>

            <input
              style={styles.input}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="70"
              value={form.weight}
              onChange={(e) =>
                change('weight', e.target.value)
              }
            />
          </div>
        </div>

        <label style={styles.label}>
          Objetivo deportivo
        </label>

        <textarea
          style={styles.textarea}
          value={form.goals}
          onChange={(e) =>
            change('goals', e.target.value)
          }
        />

        {error && <Alert type="error" text={error} />}
        {message && (
          <Alert type="success" text={message} />
        )}

        <button
          style={styles.primary}
          disabled={loading}
          onClick={() => void submit()}
        >
          {loading
            ? 'Creando cuenta...'
            : '🚴 Crear mi cuenta'}
        </button>

        <button
          style={styles.secondary}
          disabled={loading}
          onClick={onLogin}
        >
          Ya tengo una cuenta
        </button>
      </div>
    </div>
  )
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  role,
  page,
  profile,
  mobileOpen,
  onNavigate,
  onClose,
  onLogout,
}: {
  role: Role
  page: Page
  profile: Profile | null
  mobileOpen: boolean
  onNavigate: (page: Page) => void
  onClose: () => void
  onLogout: () => void
}) {
  const items = useMemo(() => {
    if (role === 'coach') {
      return [
        ['dashboard', '🏠', 'Dashboard'],
        ['athletes', '🚴', 'Deportistas'],
        ['sessions', '📅', 'Sesiones'],
        ['planning', '📚', 'Planificación'],
        ['videos', '🎥', 'Videos'],
        ['tests', '🧪', 'Tests'],
        ['health', '🩺', 'Salud'],
        ['nutrition', '🥗', 'Nutrición'],
        ['competitions', '🏆', 'Competencias'],
      ] as [Page, string, string][]
    }

    if (role === 'athlete') {
      return [
        ['dashboard', '🏠', 'Inicio'],
        ['sessions', '📅', 'Mis sesiones'],
        ['planning', '📚', 'Mi planificación'],
        ['videos', '🎥', 'Mis videos'],
        ['tests', '🧪', 'Mis tests'],
        ['health', '🩺', 'Mi salud'],
        ['nutrition', '🥗', 'Mi nutrición'],
        ['competitions', '🏆', 'Mis competencias'],
      ] as [Page, string, string][]
    }

    if (role === 'methodologist') {
      return [
        ['dashboard', '🏠', 'Inicio'],
        ['planning', '📚', 'Planificación'],
        ['tests', '🧪', 'Indicadores'],
      ] as [Page, string, string][]
    }

    if (role === 'physical_trainer') {
      return [
        ['dashboard', '🏠', 'Inicio'],
        ['sessions', '📅', 'Sesiones'],
        ['tests', '🧪', 'Tests'],
      ] as [Page, string, string][]
    }

    if (role === 'nutritionist') {
      return [
        ['dashboard', '🏠', 'Inicio'],
        ['nutrition', '🥗', 'Nutrición'],
      ] as [Page, string, string][]
    }

    if (role === 'physiotherapist') {
      return [
        ['dashboard', '🏠', 'Inicio'],
        ['health', '🧑‍⚕️', 'Fisioterapia'],
      ] as [Page, string, string][]
    }

    if (role === 'doctor') {
      return [
        ['dashboard', '🏠', 'Inicio'],
        ['health', '🩺', 'Medicina'],
      ] as [Page, string, string][]
    }

    return [
      ['dashboard', '🏠', 'Inicio'],
      ['health', '🧠', 'Psicología'],
    ] as [Page, string, string][]
  }, [role])

  return (
    <aside
      className={
        mobileOpen
          ? 'sidebar sidebarOpen'
          : 'sidebar'
      }
      style={styles.sidebar}
    >
      <div style={styles.logoBlock}>
        <div style={styles.yellow}>
          TRICKLAB
        </div>

        <div style={styles.logoLarge}>
          BMX
        </div>
      </div>

      <div style={styles.roleBadge}>
        {ROLE_LABEL[role].toUpperCase()}
      </div>

      <nav style={styles.nav}>
        {items.map(
          ([id, icon, label]) => (
            <button
              key={id}
              style={{
                ...styles.navButton,
                ...(page === id
                  ? styles.navActive
                  : {}),
              }}
              onClick={() =>
                onNavigate(id)
              }
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ),
        )}
      </nav>

      <div style={styles.sideBottom}>
        <button
          style={styles.userButton}
          onClick={() =>
            onNavigate('profile')
          }
        >
          <div style={styles.avatarSmall}>
            {profile?.photo_url ? (
              <img
                src={profile.photo_url}
                alt="Perfil"
                style={styles.avatarImg}
              />
            ) : (
              '👤'
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <strong>
              {profile?.full_name ??
                'Usuario'}
            </strong>

            <small>
              {ROLE_LABEL[role]}
            </small>
          </div>
        </button>

        <button
          style={styles.sideButton}
          onClick={() =>
            onNavigate('profile')
          }
        >
          👤 Mi perfil
        </button>

        <button
          style={styles.logout}
          onClick={onLogout}
        >
          Cerrar sesión
        </button>

        {mobileOpen && (
          <button
            style={styles.sideButton}
            onClick={onClose}
          >
            Cerrar menú
          </button>
        )}
      </div>
    </aside>
  )
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  role,
  name,
  onAthletes,
}: {
  role: Role
  name: string
  onAthletes: () => void
}) {
  return (
    <>
      <div style={styles.yellowText}>
        TRICKLAB BMX
      </div>

      <h1 style={styles.title}>
        Hola, {name} 👋
      </h1>

      <p style={styles.muted}>
        {role === 'coach'
          ? 'Tienes acceso completo al sistema.'
          : `Panel de ${ROLE_LABEL[role]}.`}
      </p>

      <div style={styles.cards}>
        {role === 'coach' && (
          <Card
            icon="🚴"
            title="Deportistas"
            value="Abrir"
            onClick={onAthletes}
          />
        )}

        <Card
          icon="📅"
          title="Sesiones"
          value="Ver"
        />

        <Card
          icon="📚"
          title="Planificación"
          value="Ver"
        />

        <Card
          icon="🏆"
          title="Competencias"
          value="Ver"
        />
      </div>

      <section style={styles.panel}>
        <h2>
          {role === 'coach'
            ? 'Control integral'
            : 'Mi proceso'}
        </h2>

        <p style={styles.muted}>
          {role === 'coach'
            ? 'Como Coach tienes acceso total a los módulos del sistema.'
            : 'Tu acceso está limitado según tu rol y permisos.'}
        </p>
      </section>
    </>
  )
}

/* =========================================================
   ATHLETES
========================================================= */

function AthletesPage({
  onSelect,
}: {
  onSelect: (athlete: Athlete) => void
}) {
  const [athletes, setAthletes] =
    useState<Athlete[]>([])
  const [loading, setLoading] =
    useState(true)

  async function load() {
    setLoading(true)

    const {
      data,
      error,
    } = await supabase
      .from('athletes')
      .select('*')
      .order('full_name', {
        ascending: true,
      })

    if (error) {
      console.error(error)
      setAthletes([])
    } else {
      setAthletes(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading) {
    return (
      <section style={styles.empty}>
        <div style={styles.big}>⏳</div>
        <h2>Cargando...</h2>
      </section>
    )
  }

  return (
    <>
      <div style={styles.header}>
        <div>
          <div style={styles.yellowText}>
            COACH
          </div>
          <h1 style={styles.title}>
            🚴 Deportistas
          </h1>
        </div>

        <button
          style={styles.primarySmall}
          onClick={() => void load()}
        >
          ↻ Actualizar
        </button>
      </div>

      {athletes.length === 0 ? (
        <section style={styles.empty}>
          <div style={styles.big}>🚴</div>
          <h2>No hay deportistas</h2>
        </section>
      ) : (
        <div style={styles.athletes}>
          {athletes.map((athlete) => (
            <button
              key={athlete.id}
              style={styles.athleteCard}
              onClick={() => onSelect(athlete)}
            >
              <div style={styles.athleteAvatar}>
                {athlete.photo_url ? (
                  <img
                    src={athlete.photo_url}
                    alt={
                      athlete.full_name ??
                      'Atleta'
                    }
                    style={styles.avatarImg}
                  />
                ) : (
                  '🚴'
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <strong>
                  {athlete.full_name ??
                    'Sin nombre'}
                </strong>

                <span>
                  {athlete.category ??
                    'Sin categoría'}
                </span>

                <small>
                  {athlete.club ??
                    'Sin club'}
                </small>
              </div>

              <span>→</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/* =========================================================
   ATHLETE FILE
========================================================= */

function AthleteFile({
  athlete,
  role,
  tab,
  onTab,
  onBack,
}: {
  athlete: Athlete
  role: Role
  tab: AthleteTab
  onTab: (tab: AthleteTab) => void
  onBack: () => void
}) {
  return (
    <>
      <button
        style={styles.linkButton}
        onClick={onBack}
      >
        ← Volver
      </button>

      <section style={styles.athleteHeader}>
        <div style={styles.athleteHeaderLeft}>
          <div style={styles.largeAvatar}>
            {athlete.photo_url ? (
              <img
                src={athlete.photo_url}
                alt={
                  athlete.full_name ??
                  'Atleta'
                }
                style={styles.avatarImg}
              />
            ) : (
              '🚴'
            )}
          </div>

          <div>
            <div style={styles.yellowText}>
              EXPEDIENTE
            </div>

            <h1 style={styles.athleteName}>
              {athlete.full_name ??
                'Deportista'}
            </h1>

            <p style={styles.muted}>
              {athlete.category ??
                'Sin categoría'}{' '}
              ·{' '}
              {athlete.club ??
                'Sin club'}
            </p>
          </div>
        </div>

        <span style={styles.status}>
          ●{' '}
          {athlete.active
            ? 'Activo'
            : 'Inactivo'}
        </span>
      </section>

      <div className="tabs">
        {ALL_TABS.map((item) => (
          <button
            key={item.id}
            style={{
              ...styles.tab,
              ...(tab === item.id
                ? styles.tabActive
                : {}),
            }}
            onClick={() =>
              onTab(item.id)
            }
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <Summary athlete={athlete} />
      )}

      {tab === 'profile' && (
        <AthleteProfile
          athlete={athlete}
        />
      )}

      {tab === 'planning' && (
        <Planning
          athlete={athlete}
          role={role}
        />
      )}

      {tab === 'sessions' && (
        <Sessions
          athlete={athlete}
          role={role}
        />
      )}

      {tab === 'tricks' && (
        <Tricks athlete={athlete} />
      )}

      {tab !== 'summary' &&
        tab !== 'profile' &&
        tab !== 'planning' &&
        tab !== 'sessions' &&
        tab !== 'tricks' && (
          <section style={styles.empty}>
            <div style={styles.big}>
              {athleteTabIcon(tab)}
            </div>

            <h2>
              {athleteTabLabel(tab)}
            </h2>

            <p>
              Módulo preparado para el seguimiento individual.
            </p>
          </section>
        )}
    </>
  )
}

/* =========================================================
   SUMMARY
========================================================= */

function Summary({
  athlete,
}: {
  athlete: Athlete
}) {
  return (
    <>
      <div style={styles.cards}>
        <Card
          icon="🏷️"
          title="Categoría"
          value={
            athlete.category ??
            '-'
          }
        />

        <Card
          icon="🚴"
          title="Club"
          value={
            athlete.club ??
            '-'
          }
        />

        <Card
          icon="📍"
          title="Ciudad"
          value={
            athlete.city ??
            '-'
          }
        />

        <Card
          icon="🚲"
          title="Disciplina"
          value={
            athlete.discipline ??
            '-'
          }
        />
      </div>

      <div style={styles.twoPanels}>
        <section style={styles.panel}>
          <h2>
            Objetivo deportivo
          </h2>

          <p style={styles.muted}>
            {athlete.goals ??
              'No registrado.'}
          </p>
        </section>

        <section style={styles.panel}>
          <h2>
            Información física
          </h2>

          <Info
            label="Estatura"
            value={
              athlete.height_cm
                ? `${athlete.height_cm} cm`
                : '-'
            }
          />

          <Info
            label="Peso"
            value={
              athlete.weight_kg
                ? `${athlete.weight_kg} kg`
                : '-'
            }
          />
        </section>
      </div>
    </>
  )
}

function AthleteProfile({
  athlete,
}: {
  athlete: Athlete
}) {
  return (
    <section style={styles.panel}>
      <h2>
        👤 Perfil
      </h2>

      <div style={styles.infoGrid}>
        <Info label="Nombre" value={athlete.full_name ?? '-'} />
        <Info
          label="Nacimiento"
          value={athlete.birth_date ?? '-'}
        />
        <Info
          label="Categoría"
          value={athlete.category ?? '-'}
        />
        <Info
          label="Club"
          value={athlete.club ?? '-'}
        />
        <Info
          label="Ciudad"
          value={athlete.city ?? '-'}
        />
        <Info
          label="País"
          value={athlete.country ?? '-'}
        />
        <Info
          label="Disciplina"
          value={
            athlete.discipline ?? '-'
          }
        />
        <Info
          label="Estatura"
          value={
            athlete.height_cm
              ? `${athlete.height_cm} cm`
              : '-'
          }
        />
        <Info
          label="Peso"
          value={
            athlete.weight_kg
              ? `${athlete.weight_kg} kg`
              : '-'
          }
        />
      </div>
    </section>
  )
}

/* =========================================================
   PRIVATE DOCUMENTS
========================================================= */

async function openPrivateFile(
  bucket: string,
  filePath: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    window.alert('Tu sesión no está activa.')
    return
  }

  const {
    data,
    error,
  } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 300)

  if (error) {
    console.error(error)
    window.alert(
      'No tienes permiso para abrir este documento.',
    )
    return
  }

  if (!data?.signedUrl) {
    window.alert(
      'No se pudo generar el acceso.',
    )
    return
  }

  window.open(
    data.signedUrl,
    '_blank',
    'noopener,noreferrer',
  )
}

/* =========================================================
   PLANNING
========================================================= */

function Planning({
  athlete,
  role,
}: {
  athlete: Athlete
  role: Role
}) {
  const [category, setCategory] =
    useState<PlanningCategory | null>(
      null,
    )

  const [documents, setDocuments] =
    useState<PlanningDocument[]>([])

  const [title, setTitle] =
    useState('')

  const [file, setFile] =
    useState<File | null>(null)

  const [message, setMessage] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  useEffect(() => {
    void loadDocuments()
  }, [athlete.id])

  async function loadDocuments() {
    const {
      data,
      error,
    } = await supabase
      .from('athlete_planning_documents')
      .select(
        'id, athlete_id, title, category, file_name, file_path, created_at',
      )
      .eq('athlete_id', athlete.id)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(error)
      setDocuments([])
      return
    }

    setDocuments(data ?? [])
  }

  async function upload() {
    if (role !== 'coach') return
    if (!category) return

    if (!title.trim()) {
      setMessage(
        'Escribe el nombre del documento.',
      )
      return
    }

    if (!file) {
      setMessage('Selecciona un archivo.')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage('Sesión no activa.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const safeName = file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        '_',
      )

      const path =
        `${athlete.id}/planning/${category}/${Date.now()}-${safeName}`

      const {
        error: storageError,
      } = await supabase.storage
        .from('athlete-planning')
        .upload(path, file, {
          upsert: false,
          contentType:
            file.type ||
            'application/octet-stream',
        })

      if (storageError) {
        throw storageError
      }

      const {
        error: dbError,
      } = await supabase
        .from('athlete_planning_documents')
        .insert({
          athlete_id: athlete.id,
          title: title.trim(),
          category,
          file_name: file.name,
          file_path: path,
          file_url: null,
          uploaded_by: user.id,
        })

      if (dbError) {
        await supabase.storage
          .from('athlete-planning')
          .remove([path])

        throw dbError
      }

      setTitle('')
      setFile(null)
      setMessage(
        'Documento privado guardado correctamente.',
      )

      await loadDocuments()
    } catch (error) {
      console.error(error)
      setMessage(
        'No se pudo cargar el documento.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (!category) {
    const cards = [
      {
        id: 'macrociclo' as const,
        label: 'Macrociclo',
        icon: '🗓️',
      },
      {
        id: 'mesociclo' as const,
        label: 'Mesociclos',
        icon: '📆',
      },
      {
        id: 'microciclo' as const,
        label: 'Microciclos',
        icon: '📋',
      },
      {
        id: 'objetivos' as const,
        label: 'Objetivos',
        icon: '🎯',
      },
    ]

    return (
      <div style={styles.cards}>
        {cards.map((card) => (
          <section
            key={card.id}
            style={styles.panel}
          >
            <div style={styles.big}>
              {card.icon}
            </div>

            <h3>
              {card.label}
            </h3>

            <button
              style={styles.secondary}
              onClick={() =>
                setCategory(
                  card.id,
                )
              }
            >
              Abrir
            </button>
          </section>
        ))}
      </div>
    )
  }

  const filtered =
    documents.filter(
      (doc) =>
        doc.category ===
        category,
    )

  return (
    <div>
      <button
        style={styles.linkButton}
        onClick={() =>
          setCategory(null)
        }
      >
        ← Volver
      </button>

      <section style={styles.panel}>
        <div style={styles.yellowText}>
          PLANIFICACIÓN
        </div>

        <h2>
          {category}
        </h2>

        {role === 'coach' && (
          <div style={styles.uploadBox}>
            <strong>
              🔐 Documento privado
            </strong>

            <input
              style={styles.input}
              placeholder="Nombre del documento"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
            />

            <input
              type="file"
              onChange={(e) =>
                setFile(
                  e.target.files?.[0] ??
                    null,
                )
              }
            />

            <button
              style={
                styles.primarySmall
              }
              disabled={loading}
              onClick={() =>
                void upload()
              }
            >
              {loading
                ? 'Subiendo...'
                : 'Guardar documento'}
            </button>

            {message && (
              <Alert
                type={
                  message.includes(
                    'correctamente',
                  )
                    ? 'success'
                    : 'error'
                }
                text={message}
              />
            )}
          </div>
        )}

        {filtered.length ===
        0 ? (
          <div style={styles.emptySmall}>
            📂 No hay documentos.
          </div>
        ) : (
          <div style={styles.list}>
            {filtered.map(
              (doc) => (
                <div
                  key={
                    doc.id
                  }
                  style={
                    styles.document
                  }
                >
                  <div>
                    <strong>
                      {
                        doc.title
                      }
                    </strong>

                    <small>
                      🔒{' '}
                      {
                        doc.file_name
                      }
                    </small>
                  </div>

                  <button
                    style={
                      styles.openButton
                    }
                    onClick={() =>
                      void openPrivateFile(
                        'athlete-planning',
                        doc.file_path,
                      )
                    }
                  >
                    Abrir
                  </button>
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  )
}

/* =========================================================
   SESSIONS
========================================================= */

function Sessions({
  athlete,
  role,
}: {
  athlete: Athlete
  role: Role
}) {
  const [documents, setDocuments] =
    useState<SessionDocument[]>([])

  const [openForm, setOpenForm] =
    useState(false)

  const [title, setTitle] =
    useState('')

  const [date, setDate] =
    useState('')

  const [file, setFile] =
    useState<File | null>(null)

  const [message, setMessage] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  useEffect(() => {
    void loadDocuments()
  }, [athlete.id])

  async function loadDocuments() {
    const {
      data,
      error,
    } = await supabase
      .from('athlete_session_documents')
      .select(
        'id, athlete_id, title, session_date, file_name, file_path, uploaded_by, created_at',
      )
      .eq('athlete_id', athlete.id)
      .order('session_date', {
        ascending: false,
      })

    if (error) {
      console.error(error)
      return
    }

    setDocuments(data ?? [])
  }

  async function upload() {
    if (role !== 'coach') return

    if (!title.trim() || !date || !file) {
      setMessage(
        'Completa nombre, fecha y documento.',
      )
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    setLoading(true)
    setMessage('')

    try {
      const safeName = file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        '_',
      )

      const path =
        `${athlete.id}/sessions/${date}/${Date.now()}-${safeName}`

      const {
        error: storageError,
      } = await supabase.storage
        .from('athlete-sessions')
        .upload(path, file, {
          upsert: false,
          contentType:
            file.type ||
            'application/octet-stream',
        })

      if (storageError) {
        throw storageError
      }

      const {
        error: dbError,
      } = await supabase
        .from('athlete_session_documents')
        .insert({
          athlete_id: athlete.id,
          title: title.trim(),
          session_date: date,
          file_name: file.name,
          file_path: path,
          file_url: null,
          uploaded_by: user.id,
        })

      if (dbError) {
        await supabase.storage
          .from('athlete-sessions')
          .remove([path])

        throw dbError
      }

      setTitle('')
      setDate('')
      setFile(null)
      setOpenForm(false)

      setMessage(
        'Sesión privada guardada correctamente.',
      )

      await loadDocuments()
    } catch (error) {
      console.error(error)
      setMessage(
        'No se pudo cargar la sesión.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <div style={styles.yellowText}>
            HISTORIAL DIARIO
          </div>

          <h2>
            📅 Sesiones
          </h2>
        </div>

        {role === 'coach' && (
          <button
            style={styles.primarySmall}
            onClick={() =>
              setOpenForm(
                (value) =>
                  !value,
              )
            }
          >
            + Subir sesión
          </button>
        )}
      </div>

      {openForm &&
        role === 'coach' && (
          <section style={styles.panel}>
            <h3>
              🔐 Nueva sesión privada
            </h3>

            <div className="two">
              <input
                style={styles.input}
                placeholder="Nombre de la sesión"
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value,
                  )
                }
              />

              <input
                style={styles.input}
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(
                    e.target.value,
                  )
                }
              />
            </div>

            <input
              type="file"
              onChange={(e) =>
                setFile(
                  e.target.files?.[0] ??
                    null,
                )
              }
            />

            {message && (
              <Alert
                type={
                  message.includes(
                    'correctamente',
                  )
                    ? 'success'
                    : 'error'
                }
                text={message}
              />
            )}

            <button
              style={
                styles.primarySmall
              }
              disabled={
                loading
              }
              onClick={() =>
                void upload()
              }
            >
              {loading
                ? 'Subiendo...'
                : 'Guardar sesión'}
            </button>
          </section>
        )}

      {documents.length === 0 ? (
        <section style={styles.empty}>
          <div style={styles.big}>
            📅
          </div>

          <h3>
            No hay sesiones.
          </h3>
        </section>
      ) : (
        <div style={styles.list}>
          {documents.map(
            (doc) => (
              <div
                key={
                  doc.id
                }
                style={
                  styles.document
                }
              >
                <div>
                  <strong>
                    {
                      doc.title
                    }
                  </strong>

                  <small>
                    {doc.session_date}
                    {' · '}
                    🔒 {doc.file_name}
                  </small>
                </div>

                <button
                  style={
                    styles.openButton
                  }
                  onClick={() =>
                    void openPrivateFile(
                      'athlete-sessions',
                      doc.file_path,
                    )
                  }
                >
                  Abrir
                </button>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  )
}

/* =========================================================
   TRICKS
========================================================= */

function Tricks({
  athlete,
}: {
  athlete: Athlete
}) {
  const [tricks, setTricks] =
    useState<Trick[]>([])

  const [name, setName] =
    useState('')

  const [difficulty, setDifficulty] =
    useState('learning')

  const [status, setStatus] =
    useState('learning')

  const [notes, setNotes] =
    useState('')

  const [video, setVideo] =
    useState('')

  const [showForm, setShowForm] =
    useState(false)

  useEffect(() => {
    void load()
  }, [athlete.id])

  async function load() {
    const {
      data,
      error,
    } = await supabase
      .from('athlete_tricks')
      .select('*')
      .eq('athlete_id', athlete.id)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(error)
      return
    }

    setTricks(data ?? [])
  }

  async function save() {
    if (!name.trim()) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } =
      await supabase
        .from('athlete_tricks')
        .insert({
          athlete_id: athlete.id,
          name: name.trim(),
          difficulty,
          status,
          observations:
            notes.trim() ||
            null,
          video_url:
            video.trim() ||
            null,
          created_by:
            user.id,
        })

    if (error) {
      window.alert(error.message)
      return
    }

    setName('')
    setNotes('')
    setVideo('')
    setShowForm(false)

    await load()
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <div style={styles.yellowText}>
            REPERTORIO TÉCNICO
          </div>

          <h2>
            🚲 Mis trucos
          </h2>
        </div>

        <button
          style={styles.primarySmall}
          onClick={() =>
            setShowForm(
              (value) =>
                !value,
            )
          }
        >
          + Agregar truco
        </button>
      </div>

      {showForm && (
        <section style={styles.panel}>
          <input
            style={styles.input}
            placeholder="Nombre del truco"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value,
              )
            }
          />

          <select
            style={styles.input}
            value={difficulty}
            onChange={(e) =>
              setDifficulty(
                e.target.value,
              )
            }
          >
            <option value="easy">
              Fácil
            </option>
            <option value="medium">
              Medio
            </option>
            <option value="technical">
              Técnico
            </option>
            <option value="learning">
              En aprendizaje
            </option>
          </select>

          <select
            style={styles.input}
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value,
              )
            }
          >
            <option value="learning">
              Aprendiendo
            </option>
            <option value="progress">
              En progreso
            </option>
            <option value="consistent">
              Consistente
            </option>
            <option value="competitive">
              Competitivo
            </option>
          </select>

          <textarea
            style={styles.textarea}
            placeholder="Observaciones"
            value={notes}
            onChange={(e) =>
              setNotes(
                e.target.value,
              )
            }
          />

          <input
            style={styles.input}
            placeholder="URL del video"
            value={video}
            onChange={(e) =>
              setVideo(
                e.target.value,
              )
            }
          />

          <button
            style={styles.primarySmall}
            onClick={() =>
              void save()
            }
          >
            Guardar truco
          </button>
        </section>
      )}

      {tricks.length === 0 ? (
        <section style={styles.empty}>
          <div style={styles.big}>
            🚲
          </div>
          <h3>
            No hay trucos registrados.
          </h3>
        </section>
      ) : (
        <div style={styles.list}>
          {tricks.map(
            (trick) => (
              <article
                key={
                  trick.id
                }
                style={
                  styles.panel
                }
              >
                <h3>
                  {
                    trick.name
                  }
                </h3>

                <p>
                  Dificultad:{' '}
                  {
                    trick.difficulty
                  }
                </p>

                <p>
                  Estado:{' '}
                  {
                    trick.status
                  }
                </p>

                {trick.observations && (
                  <p>
                    {
                      trick.observations
                    }
                  </p>
                )}

                {trick.video_url && (
                  <a
                    href={
                      trick.video_url
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    🎥 Ver video
                  </a>
                )}
              </article>
            ),
          )}
        </div>
      )}
    </div>
  )
}

/* =========================================================
   PROFILE
========================================================= */

function ProfilePage({
  profile,
  userId,
  onSaved,
}: {
  profile: Profile | null
  userId: string
  onSaved: () => Promise<void>
}) {
  const [name, setName] =
    useState(profile?.full_name ?? '')
  const [phone, setPhone] =
    useState(profile?.phone ?? '')
  const [city, setCity] =
    useState(profile?.city ?? '')
  const [country, setCountry] =
    useState(profile?.country ?? '')
  const [bio, setBio] =
    useState(profile?.bio ?? '')
  const [saving, setSaving] =
    useState(false)
  const [message, setMessage] =
    useState('')

  async function save() {
    setSaving(true)
    setMessage('')

    const { error } =
      await supabase
        .from('profiles')
        .update({
          full_name:
            name.trim() ||
            null,
          phone:
            phone.trim() ||
            null,
          city:
            city.trim() ||
            null,
          country:
            country.trim() ||
            null,
          bio:
            bio.trim() ||
            null,
        })
        .eq('id', userId)

    if (error) {
      setMessage(
        error.message,
      )
    } else {
      setMessage(
        'Perfil guardado correctamente.',
      )
      await onSaved()
    }

    setSaving(false)
  }

  return (
    <section style={styles.panel}>
      <div style={styles.yellowText}>
        PERFIL
      </div>

      <h1 style={styles.title}>
        👤 Mi perfil
      </h1>

      <div style={styles.infoGrid}>
        <div>
          <label style={styles.label}>
            Nombre
          </label>

          <input
            style={styles.input}
            value={name}
            onChange={(e) =>
              setName(
                e.target.value,
              )
            }
          />
        </div>

        <div>
          <label style={styles.label}>
            Teléfono
          </label>

          <input
            style={styles.input}
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target.value,
              )
            }
          />
        </div>

        <div>
          <label style={styles.label}>
            Ciudad
          </label>

          <input
            style={styles.input}
            value={city}
            onChange={(e) =>
              setCity(
                e.target.value,
              )
            }
          />
        </div>

        <div>
          <label style={styles.label}>
            País
          </label>

          <input
            style={styles.input}
            value={country}
            onChange={(e) =>
              setCountry(
                e.target.value,
              )
            }
          />
        </div>
      </div>

      <label style={styles.label}>
        Biografía
      </label>

      <textarea
        style={styles.textarea}
        value={bio}
        onChange={(e) =>
          setBio(
            e.target.value,
          )
        }
      />

      {message && (
        <Alert
          type={
            message.includes(
              'correctamente',
            )
              ? 'success'
              : 'error'
          }
          text={message}
        />
      )}

      <button
        style={styles.primarySmall}
        disabled={saving}
        onClick={() =>
          void save()
        }
      >
        {saving
          ? 'Guardando...'
          : 'Guardar cambios'}
      </button>

      <p style={styles.muted}>
        Rol: <strong>{profile?.role ? ROLE_LABEL[profile.role] : '-'}</strong>
      </p>
    </section>
  )
}

/* =========================================================
   GENERIC UI
========================================================= */

function Card({
  icon,
  title,
  value,
  onClick,
}: {
  icon: string
  title: string
  value: string
  onClick?: () => void
}) {
  return (
    <button
      style={{
        ...styles.card,
        cursor: onClick
          ? 'pointer'
          : 'default',
      }}
      onClick={onClick}
    >
      <div style={styles.cardIcon}>
        {icon}
      </div>

      <strong>
        {value}
      </strong>

      <h3>
        {title}
      </h3>
    </button>
  )
}

function Info({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={styles.infoRow}>
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  )
}

function Alert({
  type,
  text,
}: {
  type: 'success' | 'error'
  text: string
}) {
  return (
    <div
      style={
        type === 'success'
          ? styles.success
          : styles.error
      }
    >
      {text}
    </div>
  )
}

function pageTitle(
  page: Page,
) {
  const labels: Record<Page, string> = {
    dashboard: 'Dashboard',
    athletes: 'Deportistas',
    profile: 'Mi perfil',
    sessions: 'Sesiones',
    planning: 'Planificación',
    videos: 'Videos',
    tests: 'Tests',
    health: 'Salud',
    nutrition: 'Nutrición',
    competitions: 'Competencias',
  }

  return labels[page]
}

function pageIcon(
  page: Page,
) {
  const icons: Record<Page, string> = {
    dashboard: '🏠',
    athletes: '🚴',
    profile: '👤',
    sessions: '📅',
    planning: '📚',
    videos: '🎥',
    tests: '🧪',
    health: '🩺',
    nutrition: '🥗',
    competitions: '🏆',
  }

  return icons[page]
}

function athleteTabLabel(
  tab: AthleteTab,
) {
  return (
    ALL_TABS.find(
      (item) =>
        item.id === tab,
    )?.label ??
    'Módulo'
  )
}

function athleteTabIcon(
  tab: AthleteTab,
) {
  return (
    ALL_TABS.find(
      (item) =>
        item.id === tab,
    )?.icon ??
    '📁'
  )
}

/* =========================================================
   STYLES
========================================================= */

const styles: Record<
  string,
  CSSProperties
> = {
  app: {
    minHeight: '100vh',
    background: '#f4f5f7',
    fontFamily:
      'Arial, Helvetica, sans-serif',
    color: '#111',
  },

  main: {
    minHeight: '100vh',
  },

  topbar: {
    height: 76,
    background: '#fff',
    borderBottom:
      '1px solid #e5e5e5',
    padding: '0 30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 12,
  },

  content: {
    width: '100%',
    maxWidth: 1500,
    margin: '0 auto',
    padding: 30,
  },

  sidebar: {
    width: 265,
    position: 'fixed',
    inset: '0 auto 0 0',
    zIndex: 1000,
    background: '#101010',
    color: '#fff',
    padding: '22px 15px',
    display: 'flex',
    flexDirection: 'column',
  },

  logoBlock: {
    padding: '8px 12px 20px',
  },

  yellow: {
    color: '#f5d000',
    fontWeight: 900,
    letterSpacing: 4,
  },

  yellowText: {
    color: '#a98700',
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: 2,
  },

  logoLarge: {
    fontSize: 42,
    fontWeight: 900,
  },

  bmx: {
    fontSize: 50,
    fontWeight: 900,
  },

  roleBadge: {
    background: '#f5d000',
    color: '#111',
    borderRadius: 10,
    padding: '10px 12px',
    fontWeight: 800,
    fontSize: 12,
    marginBottom: 15,
  },

  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    overflowY: 'auto',
    flex: 1,
  },

  navButton: {
    width: '100%',
    background: 'transparent',
    color: '#aaa',
    border: 0,
    borderRadius: 10,
    padding: 12,
    textAlign: 'left',
    display: 'flex',
    gap: 10,
    cursor: 'pointer',
  },

  navActive: {
    background: '#242424',
    color: '#fff',
    fontWeight: 700,
  },

  sideBottom: {
    borderTop:
      '1px solid #2c2c2c',
    paddingTop: 14,
  },

  userButton: {
    width: '100%',
    background: 'transparent',
    color: '#fff',
    border: 0,
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    padding: 5,
    cursor: 'pointer',
    textAlign: 'left',
  },

  avatarSmall: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    overflow: 'hidden',
    background: '#222',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  sideButton: {
    width: '100%',
    marginTop: 8,
    padding: 9,
    borderRadius: 9,
    border: '1px solid #444',
    background: '#222',
    color: '#fff',
    cursor: 'pointer',
  },

  logout: {
    width: '100%',
    marginTop: 8,
    padding: 10,
    borderRadius: 9,
    border: '1px solid #444',
    background: 'transparent',
    color: '#bbb',
    cursor: 'pointer',
  },

  title: {
    fontSize: 36,
    margin: '8px 0',
  },

  muted: {
    color: '#707070',
    lineHeight: 1.5,
  },

  cards: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit,minmax(190px,1fr))',
    gap: 15,
    margin: '25px 0',
  },

  card: {
    border: '1px solid #e5e5e5',
    borderRadius: 16,
    background: '#fff',
    padding: 20,
    textAlign: 'left',
  },

  cardIcon: {
    fontSize: 28,
    marginBottom: 10,
  },

  panel: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: 16,
    padding: 22,
    marginBottom: 18,
  },

  primary: {
    width: '100%',
    padding: 14,
    background: '#f5d000',
    color: '#111',
    border: 0,
    borderRadius: 10,
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: 15,
  },

  primarySmall: {
    background: '#f5d000',
    color: '#111',
    border: 0,
    borderRadius: 10,
    padding: '12px 16px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  secondary: {
    width: '100%',
    padding: 13,
    background: '#fff',
    color: '#111',
    border: '1px solid #111',
    borderRadius: 10,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 10,
  },

  auth: {
    minHeight: '100vh',
    background: '#101010',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  authCard: {
    width: '100%',
    maxWidth: 440,
    background: '#fff',
    borderRadius: 22,
    padding: 32,
    boxSizing: 'border-box',
    textAlign: 'center',
  },

  registerCard: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '94vh',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: 22,
    padding: 30,
    boxSizing: 'border-box',
  },

  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    margin: '12px 0 6px',
  },

  input: {
    width: '100%',
    padding: 13,
    border: '1px solid #d5d5d5',
    borderRadius: 9,
    boxSizing: 'border-box',
    fontSize: 16,
    background: '#fff',
  },

  textarea: {
    width: '100%',
    minHeight: 120,
    padding: 13,
    border: '1px solid #d5d5d5',
    borderRadius: 9,
    boxSizing: 'border-box',
    fontSize: 16,
    resize: 'vertical',
  },

  linkButton: {
    border: 0,
    background: 'transparent',
    color: '#666',
    padding: 0,
    cursor: 'pointer',
    fontWeight: 700,
    marginBottom: 15,
  },

  error: {
    background: '#fff0ef',
    color: '#b42318',
    border: '1px solid #f1cbc7',
    borderRadius: 9,
    padding: 10,
    marginTop: 10,
  },

  success: {
    background: '#edf9f1',
    color: '#176c3b',
    border: '1px solid #c7e9d2',
    borderRadius: 9,
    padding: 10,
    marginTop: 10,
  },

  header: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },

  athleteCard: {
    width: '100%',
    border: '1px solid #e5e5e5',
    background: '#fff',
    borderRadius: 16,
    padding: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textAlign: 'left',
    cursor: 'pointer',
  },

  athletes: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fill,minmax(280px,1fr))',
    gap: 15,
  },

  athleteAvatar: {
    width: 62,
    height: 62,
    borderRadius: '50%',
    overflow: 'hidden',
    background: '#eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: 28,
  },

  athleteHeader: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: 18,
    padding: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 20,
    marginBottom: 18,
  },

  athleteHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    minWidth: 0,
  },

  largeAvatar: {
    width: 95,
    height: 95,
    borderRadius: '50%',
    overflow: 'hidden',
    background: '#eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: 34,
  },

  athleteName: {
    fontSize: 30,
    margin: '5px 0',
  },

  status: {
    background: '#effaf3',
    color: '#17824d',
    border: '1px solid #cdebd8',
    borderRadius: 10,
    padding: '9px 12px',
    fontWeight: 700,
  },

  infoGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit,minmax(230px,1fr))',
    gap: 12,
  },

  infoRow: {
    background: '#fafafa',
    borderRadius: 10,
    padding: 13,
    display: 'flex',
    justifyContent:
      'space-between',
    gap: 10,
  },

  twoPanels: {
    display: 'grid',
    gridTemplateColumns:
      '1fr 1fr',
    gap: 18,
  },

  tabs: {
    display: 'flex',
    gap: 7,
    overflowX: 'auto',
    marginBottom: 18,
    paddingBottom: 8,
  },

  tab: {
    flex: '0 0 auto',
    padding: '10px 13px',
    borderRadius: 10,
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  tabActive: {
    background: '#111',
    color: '#fff',
    borderColor: '#111',
  },

  uploadBox: {
    background: '#fafafa',
    border: '1px dashed #ccc',
    borderRadius: 12,
    padding: 18,
    margin: '15px 0',
    display: 'flex',
    flexDirection:
      'column',
    gap: 12,
  },

  list: {
    display: 'flex',
    flexDirection:
      'column',
    gap: 10,
  },

  document: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: 12,
    padding: 15,
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: 15,
  },

  openButton: {
    background: '#111',
    color: '#fff',
    border: 0,
    borderRadius: 8,
    padding: '9px 12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  empty: {
    minHeight: 300,
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center',
    flexDirection:
      'column',
    textAlign: 'center',
    padding: 25,
  },

  emptySmall: {
    background: '#fafafa',
    borderRadius: 10,
    padding: 20,
    textAlign: 'center',
    color: '#777',
  },

  big: {
    fontSize: 55,
  },

  bio: {
    marginTop: 15,
    background: '#fafafa',
    padding: 16,
    borderRadius: 10,
  },

  loading: {
    minHeight: '100vh',
    background: '#101010',
    color: '#f5d000',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center',
    fontSize: 30,
    fontWeight: 900,
  },
}

function GlobalStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }

      html, body, #root {
        margin: 0;
        width: 100%;
        min-height: 100%;
      }

      body {
        overflow-x: hidden;
      }

      button,
      input,
      select,
      textarea {
        font: inherit;
      }

      .mobileMenuButton {
        display: none;
        width: 42px;
        height: 42px;
        align-items: center;
        justify-content: center;
        border: 1px solid #ddd;
        background: #fff;
        border-radius: 10px;
        cursor: pointer;
        font-size: 22px;
      }

      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 999;
        background: rgba(0,0,0,.35);
        border: 0;
      }

      @media (max-width: 900px) {
        .sidebar {
          transform: translateX(-105%);
          transition: transform .25s ease;
        }

        .sidebar.sidebarOpen {
          transform: translateX(0);
        }

        .mobileMenuButton {
          display: flex;
        }

        .main {
          margin-left: 0 !important;
          width: 100% !important;
        }

        .pageContent {
          padding: 14px !important;
        }

        .desktopOnly {
          display: none;
        }

        .twoPanels {
          grid-template-columns: 1fr !important;
        }

        .athleteHeader {
          flex-direction: column !important;
          align-items: flex-start !important;
        }

        .header {
          flex-direction: column !important;
          align-items: stretch !important;
        }
      }

      @media (max-width: 560px) {
        .two {
          grid-template-columns: 1fr !important;
        }

        .twoPanels {
          grid-template-columns: 1fr !important;
        }

        .cards {
          grid-template-columns: 1fr !important;
        }

        .athletes {
          grid-template-columns: 1fr !important;
        }

        .infoGrid {
          grid-template-columns: 1fr !important;
        }

        .sidebar {
          width: 86vw !important;
          max-width: 300px !important;
        }

        .registerCard,
        .authCard {
          max-width: 100% !important;
        }

        .athleteHeaderLeft {
          width: 100%;
        }

        .largeAvatar {
          width: 75px !important;
          height: 75px !important;
        }

        .document {
          align-items: flex-start !important;
          flex-wrap: wrap;
        }

        .openButton {
          width: 100%;
        }
      }
    `}</style>
  )
}

export default App