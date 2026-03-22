import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f3f3f3] text-black">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16">
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-[#FF6A13]">
            JEGAL
          </p>

          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            COTIZA <span className="text-[#FF6A13]">JEGAL</span>
          </h1>

          <p className="mt-4 max-w-2xl text-base text-neutral-600 md:text-lg">
            ¿No sabes qué materiales necesitas? Cotiza tu proyecto paso a paso
            y descubre qué debes comprar para tu hogar o negocio.
          </p>
        </div>

        <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
          <Link
            href="/cotiza?tipo=estufas"
            className="group relative overflow-hidden rounded-[28px] bg-[#FF5A00] p-8 text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="relative z-10">
              <div className="mb-5 text-5xl">🔥</div>

              <h2 className="text-3xl font-extrabold">Estufas</h2>

              <p className="mt-3 max-w-sm text-sm text-white/90 md:text-base">
                Pellet, leña y calefacción central. Descubre qué materiales e
                instalación necesitas.
              </p>

              <div className="mt-6 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                Cotizar estufas
              </div>
            </div>

            <div className="absolute -bottom-6 -right-4 text-8xl opacity-10 transition duration-300 group-hover:scale-110">
              🔥
            </div>
          </Link>

          <Link
            href="/cotiza?tipo=otros"
            className="group rounded-[28px] bg-white p-8 text-black shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="mb-5 text-5xl">⚙️</div>

            <h2 className="text-3xl font-extrabold">Otros Equipos</h2>

            <p className="mt-3 max-w-sm text-sm text-neutral-600 md:text-base">
              Aire acondicionado, calefont, energía solar y otros servicios para
              tu proyecto.
            </p>

            <div className="mt-6 inline-flex rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">
              Cotizar otros equipos
            </div>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/cotiza"
            className="rounded-2xl bg-black px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Cotizar ahora
          </Link>

          <Link
            href="/login"
            className="rounded-2xl border border-neutral-300 bg-white px-6 py-3 font-semibold text-neutral-800 transition hover:bg-neutral-50"
          >
            Ingreso vendedor / tienda
          </Link>
        </div>
      </section>
    </main>
  );
}