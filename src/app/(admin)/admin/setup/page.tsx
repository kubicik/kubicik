function isSet(val: string | undefined) {
  return !!val && val.length > 0
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
      ok ? "bg-[#e8f8ed] text-[#1a7f37]" : "bg-[#fff2f0] text-[#ff3b30]"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-[#34c759]" : "bg-[#ff3b30]"}`} />
      {label}
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#f2f2f7]">
        <h2 className="font-semibold text-[#1d1d1f]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function EnvRow({
  name,
  set,
  required,
  description,
  example,
  link,
  linkLabel,
}: {
  name: string
  set: boolean
  required: boolean
  description: string
  example?: string
  link?: string
  linkLabel?: string
}) {
  return (
    <div className="py-4 border-b border-[#f2f2f7] last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-sm font-mono font-semibold text-[#1d1d1f] bg-[#f2f2f7] px-2 py-0.5 rounded-md">{name}</code>
            <Badge ok={set} label={set ? "Nastaveno" : "Chybí"} />
            {!required && (
              <span className="text-xs text-[#8e8e93] border border-[#e5e5ea] px-1.5 py-0.5 rounded-full">volitelné</span>
            )}
          </div>
          <p className="text-sm text-[#3c3c43]">{description}</p>
          {example && (
            <code className="mt-1 block text-xs text-[#8e8e93] font-mono">{example}</code>
          )}
        </div>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-xs text-[#007aff] hover:underline"
          >
            {linkLabel ?? "Získat →"}
          </a>
        )}
      </div>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#007aff] text-white text-sm font-bold flex items-center justify-center">{n}</div>
      <div className="flex-1 pb-6">
        <p className="font-semibold text-[#1d1d1f] mb-1">{title}</p>
        <div className="text-sm text-[#3c3c43] space-y-1">{children}</div>
      </div>
    </div>
  )
}

export default function SetupPage() {
  const env = {
    DATABASE_URL: process.env.DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
    AUTH_SECRET: process.env.AUTH_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    VERCEL: process.env.VERCEL,
  }

  const isTurso = isSet(env.DATABASE_URL) && env.DATABASE_URL!.startsWith("libsql://")
  const isLocalDb = !isSet(env.DATABASE_URL) || env.DATABASE_URL!.startsWith("file:")
  const onVercel = isSet(env.VERCEL)

  const allRequired = isSet(env.AUTH_SECRET)
  const allCore = allRequired && (isTurso ? isSet(env.TURSO_AUTH_TOKEN) : true)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Dokumentace & Nastavení</h1>
        <p className="text-[#8e8e93] text-sm mt-0.5">Přehled proměnných prostředí a návod k zprovoznění</p>
      </div>

      {/* Status summary */}
      <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${
        allCore
          ? "bg-[#e8f8ed] border-[#34c759]/30"
          : "bg-[#fff2f0] border-[#ff3b30]/30"
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          allCore ? "bg-[#34c759]" : "bg-[#ff3b30]"
        }`}>
          {allCore ? (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          )}
        </div>
        <div>
          <p className={`font-semibold text-sm ${allCore ? "text-[#1a7f37]" : "text-[#ff3b30]"}`}>
            {allCore ? "Základní konfigurace je v pořádku" : "Chybí povinné proměnné prostředí"}
          </p>
          <p className={`text-xs mt-0.5 ${allCore ? "text-[#1a7f37]/80" : "text-[#ff3b30]/80"}`}>
            {onVercel ? "Běží na Vercel" : "Lokální prostředí"} · {isTurso ? "Turso (vzdálená DB)" : "SQLite (lokální DB)"}
          </p>
        </div>
      </div>

      {/* Environment variables */}
      <Section title="Proměnné prostředí">
        <div className="mb-4 text-sm text-[#3c3c43]">
          Nastavte v souboru <code className="bg-[#f2f2f7] px-1.5 py-0.5 rounded text-xs font-mono">.env</code> pro lokální vývoj,
          nebo v <strong>Vercel → Settings → Environment Variables</strong> pro produkci.
        </div>

        <div className="divide-y divide-[#f2f2f7]">
          <EnvRow
            name="AUTH_SECRET"
            set={isSet(env.AUTH_SECRET)}
            required
            description="Tajný klíč pro podepisování NextAuth JWT tokenů. Musí být náhodný řetězec ≥ 32 znaků."
            example="AUTH_SECRET=$(openssl rand -base64 32)"
          />
          <EnvRow
            name="DATABASE_URL"
            set={isSet(env.DATABASE_URL) || isLocalDb}
            required={false}
            description={
              isTurso
                ? "Připojení k Turso vzdálené databázi (libSQL). Bez nastavení se použije lokální dev.db."
                : "Bez nastavení se použije lokální SQLite soubor dev.db v kořeni projektu. Pro produkci nastavte Turso URL."
            }
            example={isTurso ? `DATABASE_URL=${env.DATABASE_URL}` : "DATABASE_URL=libsql://vas-projekt.turso.io"}
            link="https://turso.tech"
            linkLabel="Turso →"
          />
          <EnvRow
            name="TURSO_AUTH_TOKEN"
            set={isSet(env.TURSO_AUTH_TOKEN)}
            required={isTurso}
            description="Autentizační token pro Turso databázi. Povinný pokud DATABASE_URL začíná libsql://."
            example="TURSO_AUTH_TOKEN=eyJ..."
            link="https://turso.tech"
            linkLabel="Turso Dashboard →"
          />
          <EnvRow
            name="BLOB_READ_WRITE_TOKEN"
            set={isSet(env.BLOB_READ_WRITE_TOKEN)}
            required={false}
            description="Token pro Vercel Blob Storage — ukládání nahrávaných obrázků (výlety, zastávky, kartičky, zápasy). Bez tokenu se soubory ukládají lokálně do public/uploads/ (nefunguje na Vercel)."
            example="BLOB_READ_WRITE_TOKEN=vercel_blob_rw_..."
            link="https://vercel.com/docs/storage/vercel-blob"
            linkLabel="Vercel Blob →"
          />
          <EnvRow
            name="RESEND_API_KEY"
            set={isSet(env.RESEND_API_KEY)}
            required={false}
            description="API klíč pro odesílání emailů přes Resend (obnova hesla). Bez klíče se reset URL pouze loguje do konzole serveru."
            example="RESEND_API_KEY=re_..."
            link="https://resend.com"
            linkLabel="Resend →"
          />
          <EnvRow
            name="EMAIL_FROM"
            set={isSet(env.EMAIL_FROM)}
            required={false}
            description='Odesílací adresa pro emaily (obnova hesla). Výchozí hodnota: noreply@kubicik.cz. Adresa musí být ověřená v Resend.'
            example="EMAIL_FROM=noreply@kubicicik.ovi"
          />
          <EnvRow
            name="YOUTUBE_API_KEY"
            set={isSet(env.YOUTUBE_API_KEY)}
            required={false}
            description="Klíč pro YouTube Data API v3 — vyhledávání videí ze zápasů ve formuláři zápasu. Bez klíče záložka pro video nebude fungovat."
            example="YOUTUBE_API_KEY=AIza..."
            link="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
            linkLabel="Google Console →"
          />
        </div>
      </Section>

      {/* Quick start */}
      <Section title="Rychlý start — lokální vývoj">
        <div className="space-y-0">
          <Step n={1} title="Naklonujte repozitář a nainstalujte závislosti">
            <code className="block bg-[#f2f2f7] px-3 py-2 rounded-lg font-mono text-xs mt-1">
              git clone … && cd kubicik<br />
              npm install
            </code>
          </Step>
          <Step n={2} title="Vytvořte soubor .env">
            <p>Minimální konfigurace pro lokální vývoj:</p>
            <code className="block bg-[#f2f2f7] px-3 py-2 rounded-lg font-mono text-xs mt-1 whitespace-pre">
              {"AUTH_SECRET=nahodny-retezec-min-32-znaku"}
            </code>
            <p className="text-[#8e8e93] text-xs mt-1">DATABASE_URL není potřeba — automaticky se použije ./dev.db</p>
          </Step>
          <Step n={3} title="Spusťte migraci a seed">
            <code className="block bg-[#f2f2f7] px-3 py-2 rounded-lg font-mono text-xs mt-1">
              npx tsx scripts/migrate.ts<br />
              npm run db:seed
            </code>
            <p className="text-[#8e8e93] text-xs mt-1">Seed vytvoří administrátora: <strong>admin@kubicik.cz</strong> / heslo: <strong>admin</strong></p>
          </Step>
          <Step n={4} title="Spusťte vývojový server">
            <code className="block bg-[#f2f2f7] px-3 py-2 rounded-lg font-mono text-xs mt-1">npm run dev</code>
            <p className="text-[#8e8e93] text-xs mt-1">Aplikace běží na <strong>http://localhost:3000</strong></p>
          </Step>
        </div>
      </Section>

      {/* Vercel deployment */}
      <Section title="Nasazení na Vercel">
        <div className="space-y-0">
          <Step n={1} title="Propojte GitHub repozitář s Vercel">
            <p>V Vercel Dashboard → <em>Add New Project</em> → importujte repozitář z GitHubu.</p>
          </Step>
          <Step n={2} title="Vytvořte Turso databázi">
            <p>Turso je kompatibilní SQLite databáze s edge replikací — nutná pro Vercel (filesystem je read-only).</p>
            <code className="block bg-[#f2f2f7] px-3 py-2 rounded-lg font-mono text-xs mt-1">
              turso db create kubicik<br />
              turso db show kubicik          # → URL<br />
              turso db tokens create kubicik # → token
            </code>
            <p className="text-[#8e8e93] text-xs mt-1">Nebo přes <a href="https://app.turso.tech" target="_blank" rel="noopener noreferrer" className="text-[#007aff] hover:underline">app.turso.tech</a> bez CLI.</p>
          </Step>
          <Step n={3} title="Vytvořte Vercel Blob Store">
            <p>Vercel Dashboard → projekt → <em>Storage</em> → <em>Create Database</em> → <em>Blob</em>. Zvolte <strong>Public</strong> přístup (Private vrací 500).</p>
            <p className="text-[#8e8e93] text-xs mt-1">Token se automaticky přidá do proměnných prostředí projektu jako BLOB_READ_WRITE_TOKEN.</p>
          </Step>
          <Step n={4} title="Nastavte proměnné prostředí na Vercel">
            <p>Vercel Dashboard → projekt → <em>Settings</em> → <em>Environment Variables</em>. Přidejte:</p>
            <div className="mt-1 space-y-0.5">
              {[
                "AUTH_SECRET",
                "DATABASE_URL",
                "TURSO_AUTH_TOKEN",
                "RESEND_API_KEY (volitelné)",
                "YOUTUBE_API_KEY (volitelné)",
              ].map((v) => (
                <div key={v} className="flex items-center gap-2 text-xs">
                  <span className="w-1 h-1 rounded-full bg-[#007aff] flex-shrink-0" />
                  <code className="font-mono">{v}</code>
                </div>
              ))}
            </div>
          </Step>
          <Step n={5} title="Nasaďte">
            <p>Push do větve <code className="bg-[#f2f2f7] px-1 rounded font-mono text-xs">main</code> spustí automatický build. Při každém buildu se automaticky aplikují nové migrace a spustí seed (vytvoří admina, pokud neexistuje).</p>
          </Step>
        </div>
      </Section>

      {/* Services */}
      <Section title="Přehled externích služeb">
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              name: "Turso",
              icon: "🗄️",
              desc: "Vzdálená SQLite databáze (libSQL). Nutná pro produkci na Vercel. Free tier: 500 MB, 1 mld. čtení/měsíc.",
              url: "https://turso.tech",
              configured: isTurso && isSet(env.TURSO_AUTH_TOKEN),
            },
            {
              name: "Vercel Blob",
              icon: "📁",
              desc: "Úložiště pro nahrávané obrázky — cover fotky výletů, fotky zastávek, obrázky kartiček, fotky zápasů.",
              url: "https://vercel.com/docs/storage/vercel-blob",
              configured: isSet(env.BLOB_READ_WRITE_TOKEN),
            },
            {
              name: "Resend",
              icon: "📧",
              desc: "Odesílání emailů pro obnovu hesla. Bez nastavení se reset odkaz loguje do konzole (funguje v dev).",
              url: "https://resend.com",
              configured: isSet(env.RESEND_API_KEY),
            },
            {
              name: "YouTube Data API",
              icon: "▶️",
              desc: "Vyhledávání videí k zápasům Spurs. Klíč získáte v Google Cloud Console — povolte YouTube Data API v3.",
              url: "https://console.cloud.google.com",
              configured: isSet(env.YOUTUBE_API_KEY),
            },
          ].map((s) => (
            <div key={s.name} className={`p-4 rounded-xl border ${s.configured ? "border-[#34c759]/30 bg-[#f0fff4]" : "border-[#e5e5ea] bg-[#f9f9fb]"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{s.icon}</span>
                <span className="font-semibold text-[#1d1d1f] text-sm">{s.name}</span>
                <Badge ok={s.configured} label={s.configured ? "OK" : "Nenastaveno"} />
              </div>
              <p className="text-xs text-[#3c3c43] leading-relaxed mb-2">{s.desc}</p>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#007aff] hover:underline">
                Dokumentace →
              </a>
            </div>
          ))}
        </div>
      </Section>

      {/* Migrations */}
      <Section title="Správa databáze & migrace">
        <div className="space-y-4 text-sm text-[#3c3c43]">
          <div>
            <p className="font-medium text-[#1d1d1f] mb-1">Jak fungují migrace</p>
            <p>Migrace jsou SQL soubory v <code className="bg-[#f2f2f7] px-1 rounded font-mono text-xs">prisma/migrations/</code>. Skript <code className="bg-[#f2f2f7] px-1 rounded font-mono text-xs">scripts/migrate.ts</code> je aplikuje automaticky při každém buildu — porovná seznam souborů s tabulkou <code className="bg-[#f2f2f7] px-1 rounded font-mono text-xs">_migrations</code> v databázi.</p>
          </div>
          <div>
            <p className="font-medium text-[#1d1d1f] mb-1">Jak přidat novou migraci</p>
            <p>Nepoužívejte <code className="bg-[#f2f2f7] px-1 rounded font-mono text-xs">prisma migrate dev</code>. Místo toho:</p>
            <ol className="list-decimal list-inside space-y-1 mt-1 text-xs">
              <li>Upravte <code className="bg-[#f2f2f7] px-1 rounded font-mono">prisma/schema.prisma</code></li>
              <li>Vytvořte soubor <code className="bg-[#f2f2f7] px-1 rounded font-mono">prisma/migrations/YYYYMMDDHHMMSS_popis/migration.sql</code></li>
              <li>Napište SQL ručně (ALTER TABLE, CREATE TABLE, …)</li>
              <li>Spusťte <code className="bg-[#f2f2f7] px-1 rounded font-mono">npx prisma generate</code> pro regeneraci klienta</li>
            </ol>
          </div>
          <div className="p-3 bg-[#fff8e6] border border-[#ff9f0a]/30 rounded-xl text-xs">
            <p className="font-semibold text-[#b45309] mb-1">⚠️ libSQL omezení</p>
            <p className="text-[#92400e]">Nepoužívejte <code className="bg-[#fef3c7] px-1 rounded font-mono">ON UPDATE CASCADE</code> v FK definicích — způsobuje chybu v batch módu. Při mazání sloupce s FK použijte přepsání celé tabulky (<code className="font-mono">CREATE TABLE … AS SELECT</code> vzor).</p>
          </div>
          <div>
            <p className="font-medium text-[#1d1d1f] mb-1">Užitečné příkazy</p>
            <div className="space-y-1">
              {[
                ["npm run dev", "Spustí dev server (port 3000)"],
                ["npm run build", "Migrace + seed + next build"],
                ["npm run db:seed", "Vytvoří admina pokud neexistuje"],
                ["npx tsx scripts/migrate.ts", "Aplikuje nové migrace"],
                ["npx prisma generate", "Regeneruje Prisma klienta po změně schématu"],
                ["npx prisma studio", "Grafické rozhraní pro databázi"],
                ["npm test", "Spustí Vitest test suite"],
              ].map(([cmd, desc]) => (
                <div key={cmd} className="flex items-baseline gap-3">
                  <code className="flex-shrink-0 text-xs font-mono bg-[#f2f2f7] px-2 py-0.5 rounded">{cmd}</code>
                  <span className="text-xs text-[#8e8e93]">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Auth */}
      <Section title="Autentizace & uživatelé">
        <div className="space-y-3 text-sm text-[#3c3c43]">
          <p>Aplikace používá <strong>NextAuth v5</strong> s Credentials providerem (email nebo username + heslo).</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#f9f9fb] rounded-xl border border-[#e5e5ea]">
              <p className="font-medium text-[#1d1d1f] text-xs mb-1">Přihlašovací stránka</p>
              <code className="text-xs font-mono text-[#007aff]">/auth/signin</code>
            </div>
            <div className="p-3 bg-[#f9f9fb] rounded-xl border border-[#e5e5ea]">
              <p className="font-medium text-[#1d1d1f] text-xs mb-1">Obnova hesla</p>
              <code className="text-xs font-mono text-[#007aff]">/auth/forgot-password</code>
            </div>
          </div>
          <p className="text-xs text-[#8e8e93]">Výchozí admin účet po seedu: <code className="bg-[#f2f2f7] px-1 rounded font-mono">admin@kubicik.cz</code> / <code className="bg-[#f2f2f7] px-1 rounded font-mono">admin</code>. Heslo změňte v sekci Uživatelé.</p>
        </div>
      </Section>
    </div>
  )
}
