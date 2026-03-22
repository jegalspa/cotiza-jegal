'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  computeQuote,
  getComunasByRegion,
  getRegionOptions,
  MainCategory,
  QuoteForm,
} from '@/lib/pricing';

function CotizaContent() {
  const searchParams = useSearchParams();
  const tipo = searchParams.get('tipo');

  const initialCategory: MainCategory =
    tipo === 'estufas' ? 'estufas' : tipo === 'otros' ? 'otros' : 'estufas';

  const [step, setStep] = useState(1);
  const [resultado, setResultado] = useState<ReturnType<typeof computeQuote> | null>(null);

  const [cliente, setCliente] = useState({
    nombre: '',
    telefono: '',
    email: '',
  });

  const [promoInput, setPromoInput] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');
  const [pagando, setPagando] = useState(false);
  const [errorPago, setErrorPago] = useState('');

  const [form, setForm] = useState<QuoteForm>({
    category: initialCategory,
    region: '',
    comuna: '',
    promoCode: '',
    fuelType: 'pellet',
    estufaMode: 'muro',
    vivienda: '',
    pisos: '1',
    metrosTotales: 4,
    metrosAdicionales: 0,
    tipoTecho: '',
    formaTecho: 'plano',
    tipoCielo: '',
    materialMuro: '',
    tieneCobertizo: 'no',
    tipoTechoCobertizo: '',
    salidaMuro: '',
    quiereJuegoCodos: 'no',
    yaTieneEstufa: 'si',
    metrajeCalefaccionar: '',
    otherService: 'motor_porton',
    aireMetros: 3,
    mantencionService: 'estufa_pellet',
  });

  const regiones = useMemo(() => getRegionOptions(), []);
  const comunas = useMemo(() => getComunasByRegion(form.region), [form.region]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, category: initialCategory }));
  }, [initialCategory]);

  function updateField<K extends keyof QuoteForm>(name: K, value: QuoteForm[K]) {
    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'region') {
        updated.comuna = '';
      }

      if (name === 'category') {
        setResultado(null);
        setStep(1);
        setGuardadoOk(false);
        setErrorGuardar('');
        setErrorPago('');
      }

      if (name === 'estufaMode' && value === 'muro') {
        updated.tipoTecho = '';
        updated.tipoCielo = '';
        updated.formaTecho = 'plano';
      }

      if (name === 'estufaMode' && value === 'techo') {
        updated.materialMuro = '';
        updated.tieneCobertizo = 'no';
        updated.tipoTechoCobertizo = '';
        updated.salidaMuro = '';
        updated.quiereJuegoCodos = 'no';
      }

      return updated;
    });
  }

  function nextStep() {
    setStep((prev) => Math.min(prev + 1, 4));
  }

  function prevStep() {
    setStep((prev) => Math.max(prev - 1, 1));
  }

  function calcular() {
    const quote = computeQuote(form);
    setResultado(quote);
    setStep(4);
    setGuardadoOk(false);
    setErrorGuardar('');
    setErrorPago('');
  }

  function aplicarPromo() {
    const updatedForm = {
      ...form,
      promoCode: promoInput.trim(),
    };

    setForm(updatedForm);

    if (resultado) {
      setResultado(computeQuote(updatedForm));
    }
  }

  async function guardarCotizacion() {
    if (!resultado) return;

    setGuardando(true);
    setGuardadoOk(false);
    setErrorGuardar('');

    try {
      const res = await fetch('/api/cotizaciones/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: {
            ...cliente,
            region: form.region,
            comuna: form.comuna,
          },
          quote: resultado,
          form,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || 'Error al guardar');
      }

      setGuardadoOk(true);
    } catch (error) {
      console.error(error);
      setErrorGuardar(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la cotización en Directus.'
      );
    } finally {
      setGuardando(false);
    }
  }

  async function solicitarInstalacion() {
    if (!resultado) return;

    setPagando(true);
    setErrorPago('');

    try {
      const res = await fetch('/api/pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: resultado.titulo,
          total: resultado.totalManoObra,
          cliente,
          form,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(
          `${data.message || 'No se pudo iniciar el pago'} ${
            data.error ? JSON.stringify(data.error) : ''
          }`
        );
      }

      const destino = data.init_point || data.sandbox_init_point;

      if (destino) {
        window.location.href = destino;
        return;
      }

      throw new Error('Mercado Pago no devolvió init_point');
    } catch (error) {
      console.error(error);
      setErrorPago(
        error instanceof Error ? error.message : 'No se pudo iniciar el pago.'
      );
    } finally {
      setPagando(false);
    }
  }

  const progress = useMemo(() => `${(step / 4) * 100}%`, [step]);

  function canContinueStep1() {
    return form.category !== undefined;
  }

  function canContinueStep2() {
    return form.region !== '' && form.comuna !== '';
  }

  function canContinueStep3() {
    if (form.category === 'estufas') {
      if (!form.estufaMode || !form.fuelType || !form.region || !form.comuna) {
        return false;
      }

      if (
        (form.estufaMode === 'preexistente_1' || form.estufaMode === 'preexistente_2') &&
        form.yaTieneEstufa === 'no' &&
        !form.metrajeCalefaccionar
      ) {
        return false;
      }

      if (form.estufaMode === 'muro') {
        if (!form.materialMuro || !form.tieneCobertizo) return false;
        if (
          form.tieneCobertizo === 'si' &&
          (!form.tipoTechoCobertizo || !form.salidaMuro)
        ) {
          return false;
        }
      }

      if (form.estufaMode === 'techo') {
        if (
          !form.tipoTecho ||
          !form.tipoCielo ||
          !form.formaTecho ||
          !form.metrosTotales
        ) {
          return false;
        }
      }

      if (form.yaTieneEstufa === 'no' && !form.metrajeCalefaccionar) return false;

      return true;
    }

    if (form.category === 'otros') {
      if (!form.otherService) return false;
      if (form.otherService === 'aire_split' && !form.aireMetros) return false;
      return true;
    }

    if (form.category === 'mantenciones') {
      return !!form.mantencionService;
    }

    return false;
  }

  const puedeGuardar =
    cliente.nombre.trim() !== '' &&
    cliente.telefono.trim() !== '' &&
    cliente.email.trim() !== '';

  return (
    <main className="min-h-screen bg-[#f3f3f3] px-6 py-10 text-black">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-[#FF6A13]">
            JEGAL
          </p>

          <h1 className="text-3xl font-extrabold md:text-5xl">
            Cotizador JEGAL
          </h1>

          <p className="mt-3 max-w-3xl text-neutral-600">
            Cotiza mano de obra referencial para estufas, otros servicios y mantenciones.
            Los valores pueden variar por ciudad, distancia y condiciones reales del lugar.
          </p>
        </div>

        <div className="mb-8 overflow-hidden rounded-full bg-white shadow">
          <div
            className="h-3 bg-[#FF6A13] transition-all duration-300"
            style={{ width: progress }}
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2 text-sm font-medium text-neutral-500">
          <span className={step === 1 ? 'text-black' : ''}>Paso 1: Servicio</span>
          <span>•</span>
          <span className={step === 2 ? 'text-black' : ''}>Paso 2: Región y comuna</span>
          <span>•</span>
          <span className={step === 3 ? 'text-black' : ''}>Paso 3: Detalles</span>
          <span>•</span>
          <span className={step === 4 ? 'text-black' : ''}>Paso 4: Resultado</span>
        </div>

        <div className="rounded-[28px] bg-white p-6 shadow-xl md:p-8">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold">¿Qué deseas cotizar?</h2>
              <p className="mt-2 text-neutral-600">
                Elige la categoría principal del servicio.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => updateField('category', 'estufas')}
                  className={`rounded-2xl border p-5 text-left transition ${
                    form.category === 'estufas'
                      ? 'border-[#FF6A13] bg-orange-50'
                      : 'border-neutral-200'
                  }`}
                >
                  <div className="text-xl font-bold">Estufas</div>
                  <div className="mt-2 text-sm text-neutral-600">
                    Pellet, leña, muro, techo y preexistentes.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('category', 'otros')}
                  className={`rounded-2xl border p-5 text-left transition ${
                    form.category === 'otros'
                      ? 'border-[#FF6A13] bg-orange-50'
                      : 'border-neutral-200'
                  }`}
                >
                  <div className="text-xl font-bold">Otros servicios</div>
                  <div className="mt-2 text-sm text-neutral-600">
                    Aire, portón, termo, calefont y más.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('category', 'mantenciones')}
                  className={`rounded-2xl border p-5 text-left transition ${
                    form.category === 'mantenciones'
                      ? 'border-[#FF6A13] bg-orange-50'
                      : 'border-neutral-200'
                  }`}
                >
                  <div className="text-xl font-bold">Mantenciones</div>
                  <div className="mt-2 text-sm text-neutral-600">
                    Estufa pellet, aire, tubos, calefont, termo, piscina.
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold">Región y comuna</h2>
              <p className="mt-2 text-neutral-600">
                Esto es importante para calcular radio urbano y recargos.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">Región</label>
                  <select
                    className="w-full rounded-2xl border border-neutral-300 p-4"
                    value={form.region}
                    onChange={(e) => updateField('region', e.target.value)}
                  >
                    <option value="">Selecciona una región</option>
                    {regiones.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-medium">Comuna</label>
                  <select
                    className="w-full rounded-2xl border border-neutral-300 p-4"
                    value={form.comuna}
                    onChange={(e) => updateField('comuna', e.target.value)}
                    disabled={!form.region}
                  >
                    <option value="">Selecciona una comuna</option>
                    {comunas.map((item) => (
                      <option key={item.comuna} value={item.comuna}>
                        {item.comuna} {item.urbana ? '(urbana)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              {form.category === 'estufas' && (
                <>
                  <h2 className="text-2xl font-bold">Detalles de estufa</h2>
                  <p className="mt-2 text-neutral-600">
                    Configura el tipo de instalación y los datos técnicos básicos.
                  </p>

                  <div className="mt-6 grid gap-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block font-medium">Combustible</label>
                        <select
                          className="w-full rounded-2xl border border-neutral-300 p-4"
                          value={form.fuelType}
                          onChange={(e) =>
                            updateField('fuelType', e.target.value as QuoteForm['fuelType'])
                          }
                        >
                          <option value="pellet">Pellet</option>
                          <option value="lena">Leña</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block font-medium">Tipo de instalación</label>
                        <select
                          className="w-full rounded-2xl border border-neutral-300 p-4"
                          value={form.estufaMode}
                          onChange={(e) =>
                            updateField('estufaMode', e.target.value as QuoteForm['estufaMode'])
                          }
                        >
                          <option value="muro">Instalación muro</option>
                          <option value="preexistente_1">Preexistente conexión primer piso</option>
                          <option value="preexistente_2">Preexistente conexión segundo piso</option>
                          <option value="techo">Instalación a techo</option>
                        </select>
                      </div>
                    </div>

                    {(form.estufaMode === 'muro' ||
                      form.estufaMode === 'preexistente_1' ||
                      form.estufaMode === 'preexistente_2' ||
                      form.estufaMode === 'techo') && (
                      <div>
                        <label className="mb-2 block font-medium">¿Ya tienes estufa?</label>
                        <select
                          className="w-full rounded-2xl border border-neutral-300 p-4"
                          value={form.yaTieneEstufa}
                          onChange={(e) => updateField('yaTieneEstufa', e.target.value)}
                        >
                          <option value="si">Sí</option>
                          <option value="no">No, quiero recomendación</option>
                        </select>
                      </div>
                    )}

                    {form.yaTieneEstufa === 'no' && (
                      <div>
                        <label className="mb-2 block font-medium">Metraje a calefaccionar</label>
                        <select
                          className="w-full rounded-2xl border border-neutral-300 p-4"
                          value={form.metrajeCalefaccionar}
                          onChange={(e) =>
                            updateField('metrajeCalefaccionar', e.target.value)
                          }
                        >
                          <option value="">Selecciona</option>
                          <option value="hasta_100">Hasta 100 m²</option>
                          <option value="hasta_120">Hasta 120 m²</option>
                          <option value="hasta_160">Hasta 160 m²</option>
                          <option value="mas_160">Más de 160 m²</option>
                        </select>
                      </div>
                    )}

                    {form.estufaMode === 'muro' && (
                      <>
                        <div>
                          <label className="mb-2 block font-medium">Material del muro</label>
                          <select
                            className="w-full rounded-2xl border border-neutral-300 p-4"
                            value={form.materialMuro}
                            onChange={(e) => updateField('materialMuro', e.target.value)}
                          >
                            <option value="">Selecciona</option>
                            <option value="tabique">Tabique</option>
                            <option value="hormigon">Hormigón</option>
                            <option value="ladrillo">Ladrillo</option>
                            <option value="metalcon">Metalcon</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block font-medium">
                            ¿Hay techo o cobertizo por donde saldrá el tubo?
                          </label>
                          <select
                            className="w-full rounded-2xl border border-neutral-300 p-4"
                            value={form.tieneCobertizo}
                            onChange={(e) => updateField('tieneCobertizo', e.target.value)}
                          >
                            <option value="no">No</option>
                            <option value="si">Sí</option>
                          </select>
                        </div>

                        {form.tieneCobertizo === 'si' && (
                          <>
                            <div>
                              <label className="mb-2 block font-medium">
                                Tipo de techo/cobertizo
                              </label>
                              <select
                                className="w-full rounded-2xl border border-neutral-300 p-4"
                                value={form.tipoTechoCobertizo}
                                onChange={(e) =>
                                  updateField('tipoTechoCobertizo', e.target.value)
                                }
                              >
                                <option value="">Selecciona</option>
                                <option value="normal">Normal</option>
                                <option value="policarbonato">Policarbonato</option>
                              </select>
                            </div>

                            <div>
                              <label className="mb-2 block font-medium">Salida del tubo</label>
                              <select
                                className="w-full rounded-2xl border border-neutral-300 p-4"
                                value={form.salidaMuro}
                                onChange={(e) => updateField('salidaMuro', e.target.value)}
                              >
                                <option value="">Selecciona</option>
                                <option value="recta">Recta</option>
                                <option value="45">45 grados</option>
                              </select>
                            </div>

                            <div>
                              <label className="mb-2 block font-medium">
                                ¿Agregar juego de codos?
                              </label>
                              <select
                                className="w-full rounded-2xl border border-neutral-300 p-4"
                                value={form.quiereJuegoCodos}
                                onChange={(e) =>
                                  updateField('quiereJuegoCodos', e.target.value)
                                }
                              >
                                <option value="no">No</option>
                                <option value="si">Sí</option>
                              </select>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {form.estufaMode === 'techo' && (
                      <>
                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block font-medium">Cantidad de pisos</label>
                            <select
                              className="w-full rounded-2xl border border-neutral-300 p-4"
                              value={form.pisos}
                              onChange={(e) => updateField('pisos', e.target.value)}
                            >
                              <option value="1">1 piso</option>
                              <option value="2">2 pisos</option>
                              <option value="3">3 pisos (no factible)</option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block font-medium">Metros totales</label>
                            <select
                              className="w-full rounded-2xl border border-neutral-300 p-4"
                              value={String(form.metrosTotales)}
                              onChange={(e) =>
                                updateField('metrosTotales', Number(e.target.value))
                              }
                            >
                              <option value="4">4 mts</option>
                              <option value="5">5 mts</option>
                              <option value="6">6 mts</option>
                              <option value="7">7 mts</option>
                              <option value="8">8 mts</option>
                              <option value="9">9 mts</option>
                              <option value="10">10 mts</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block font-medium">Tipo de techo</label>
                            <select
                              className="w-full rounded-2xl border border-neutral-300 p-4"
                              value={form.tipoTecho}
                              onChange={(e) => updateField('tipoTecho', e.target.value)}
                            >
                              <option value="">Selecciona</option>
                              <option value="zinc">Zinc</option>
                              <option value="teja_asfaltica">Teja asfáltica</option>
                              <option value="teja_chilena">Teja</option>
                              <option value="pizarreno">Pizarreño</option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block font-medium">Forma del techo</label>
                            <select
                              className="w-full rounded-2xl border border-neutral-300 p-4"
                              value={form.formaTecho}
                              onChange={(e) => updateField('formaTecho', e.target.value)}
                            >
                              <option value="plano">Techo plano</option>
                              <option value="tipo_a">Tipo A</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block font-medium">
                            Cielo o piso segundo piso
                          </label>
                          <select
                            className="w-full rounded-2xl border border-neutral-300 p-4"
                            value={form.tipoCielo}
                            onChange={(e) => updateField('tipoCielo', e.target.value)}
                          >
                            <option value="">Selecciona</option>
                            <option value="madera">Madera</option>
                            <option value="vulcanita">Vulcanita</option>
                            <option value="losa">Losa</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {form.category === 'otros' && (
                <>
                  <h2 className="text-2xl font-bold">Detalles de otros servicios</h2>
                  <p className="mt-2 text-neutral-600">Selecciona el servicio a cotizar.</p>

                  <div className="mt-6 grid gap-5">
                    <div>
                      <label className="mb-2 block font-medium">Servicio</label>
                      <select
                        className="w-full rounded-2xl border border-neutral-300 p-4"
                        value={form.otherService}
                        onChange={(e) =>
                          updateField('otherService', e.target.value as QuoteForm['otherService'])
                        }
                      >
                        <option value="aire_split">Aire acondicionado split muro</option>
                        <option value="motor_porton">Motor portón eléctrico</option>
                        <option value="termo_electrico">Termo eléctrico</option>
                        <option value="calefont">Calefont</option>
                        <option value="cerradura_digital">Cerradura digital</option>
                        <option value="bomba_calor_piscina">Bomba de calor piscina</option>
                        <option value="cargador_auto">
                          Cargador auto eléctrico (incluye cargador)
                        </option>
                      </select>
                    </div>

                    {form.otherService === 'aire_split' && (
                      <div>
                        <label className="mb-2 block font-medium">Metros de cañería</label>
                        <select
                          className="w-full rounded-2xl border border-neutral-300 p-4"
                          value={String(form.aireMetros)}
                          onChange={(e) =>
                            updateField('aireMetros', Number(e.target.value))
                          }
                        >
                          {Array.from({ length: 18 }, (_, i) => i + 3).map((metro) => (
                            <option key={metro} value={metro}>
                              {metro} metros
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </>
              )}

              {form.category === 'mantenciones' && (
                <>
                  <h2 className="text-2xl font-bold">Detalles de mantención</h2>
                  <p className="mt-2 text-neutral-600">Selecciona el tipo de mantención.</p>

                  <div className="mt-6">
                    <label className="mb-2 block font-medium">Servicio de mantención</label>
                    <select
                      className="w-full rounded-2xl border border-neutral-300 p-4"
                      value={form.mantencionService}
                      onChange={(e) =>
                        updateField(
                          'mantencionService',
                          e.target.value as QuoteForm['mantencionService']
                        )
                      }
                    >
                      <option value="estufa_pellet">Mantención estufa pellet</option>
                      <option value="aire_acondicionado">Aire acondicionado</option>
                      <option value="tubos_1_piso">Tubos 1 piso</option>
                      <option value="tubos_2_pisos">Tubos 2 pisos</option>
                      <option value="calefont">Calefont</option>
                      <option value="termo_hasta_200">
                        Termo eléctrico hasta 200 lts
                      </option>
                      <option value="termo_mas_200">
                        Termo eléctrico más de 200 lts
                      </option>
                      <option value="bomba_calor_piscina">
                        Bomba de calor piscina
                      </option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 4 && resultado && (
            <div>
              <h2 className="text-2xl font-bold">{resultado.titulo}</h2>
              <p className="mt-2 text-neutral-600">
                Resultado referencial según los datos ingresados.
              </p>

              {!resultado.factible && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Esta configuración aparece como no factible en el cotizador. Revisa
                  las observaciones antes de continuar.
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="text-lg font-bold">Código promocional</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Si vienes por una tienda o campaña, ingresa tu código.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <input
                    type="text"
                    placeholder="Ej: FERRETERIA30"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="min-w-[260px] flex-1 rounded-2xl border border-neutral-300 p-4"
                  />

                  <button
                    type="button"
                    onClick={aplicarPromo}
                    className="rounded-2xl bg-[#FF6A13] px-5 py-3 font-semibold text-white"
                  >
                    Aplicar código
                  </button>
                </div>

                {form.promoCode && (
                  <p className="mt-3 text-sm text-neutral-600">
                    Código ingresado: <strong>{form.promoCode}</strong>
                  </p>
                )}
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-neutral-50 p-5">
                  <h3 className="text-lg font-bold">Resumen económico</h3>

                  <div className="mt-4 space-y-3 text-neutral-700">
                    <div className="flex items-center justify-between">
                      <span>Mano de obra base</span>
                      <strong>${resultado.manoObraBase.toLocaleString('es-CL')}</strong>
                    </div>

                    {resultado.adicionalesManoObra.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between"
                      >
                        <span>{item.label}</span>
                        <strong>${item.amount.toLocaleString('es-CL')}</strong>
                      </div>
                    ))}

                    {resultado.recargoComuna > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Recargo por comuna</span>
                        <strong>${resultado.recargoComuna.toLocaleString('es-CL')}</strong>
                      </div>
                    )}

                    {resultado.promoDiscount && resultado.promoDiscount > 0 && (
                      <div className="flex items-center justify-between text-green-700">
                        <span>
                          Descuento promocional
                          {resultado.promoCode ? ` (${resultado.promoCode})` : ''}
                        </span>
                        <strong>
                          -${resultado.promoDiscount.toLocaleString('es-CL')}
                        </strong>
                      </div>
                    )}

                    <div className="border-t pt-3 text-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Total mano de obra</span>
                        <strong>${resultado.totalManoObra.toLocaleString('es-CL')}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-5">
                  <h3 className="text-lg font-bold">Materiales / kit sugerido</h3>

                  {resultado.materiales.length > 0 ? (
                    <ul className="mt-4 list-disc space-y-2 pl-5 text-neutral-700">
                      {resultado.materiales.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-neutral-600">
                      Para este servicio no se cargó kit estándar en esta etapa.
                    </p>
                  )}

                  {resultado.recomendacionEstufa && (
                    <div className="mt-5 rounded-xl bg-orange-50 p-4 text-sm font-medium text-[#C65400]">
                      Recomendación de estufa: {resultado.recomendacionEstufa}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-[#A24A08]">
                <ul className="list-disc space-y-2 pl-5">
                  {resultado.observaciones.map((obs, index) => (
                    <li key={`${obs}-${index}`}>{obs}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="text-lg font-bold">Tus datos</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Guarda esta cotización para que quede registrada en el sistema.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={cliente.nombre}
                    onChange={(e) =>
                      setCliente((prev) => ({ ...prev, nombre: e.target.value }))
                    }
                    className="rounded-2xl border border-neutral-300 p-4"
                  />

                  <input
                    type="text"
                    placeholder="Teléfono"
                    value={cliente.telefono}
                    onChange={(e) =>
                      setCliente((prev) => ({ ...prev, telefono: e.target.value }))
                    }
                    className="rounded-2xl border border-neutral-300 p-4"
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={cliente.email}
                    onChange={(e) =>
                      setCliente((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="rounded-2xl border border-neutral-300 p-4"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={guardarCotizacion}
                    disabled={guardando || !puedeGuardar}
                    className="rounded-2xl bg-[#FF6A13] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {guardando ? 'Guardando...' : 'Guardar cotización'}
                  </button>

                  <button
                    type="button"
                    onClick={solicitarInstalacion}
                    disabled={pagando || !resultado}
                    className="rounded-2xl bg-black px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {pagando ? 'Redirigiendo...' : 'Solicitar instalación'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResultado(null);
                      setGuardadoOk(false);
                      setErrorGuardar('');
                      setErrorPago('');
                      setPromoInput('');
                      setForm((prev) => ({ ...prev, promoCode: '' }));
                      setStep(1);
                    }}
                    className="rounded-2xl border border-neutral-300 bg-white px-5 py-3 font-semibold"
                  >
                    Volver a cotizar
                  </button>
                </div>

                {guardadoOk && (
                  <p className="mt-3 text-sm font-medium text-green-700">
                    Cotización guardada correctamente en Directus.
                  </p>
                )}

                {errorGuardar && (
                  <p className="mt-3 text-sm font-medium text-red-700">
                    {errorGuardar}
                  </p>
                )}

                {errorPago && (
                  <p className="mt-3 text-sm font-medium text-red-700">
                    {errorPago}
                  </p>
                )}
              </div>
            </div>
          )}

          {step < 4 && (
            <div className="mt-8 flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className="rounded-2xl border border-neutral-300 bg-white px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Volver
              </button>

              {step === 1 && (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canContinueStep1()}
                  className="rounded-2xl bg-black px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canContinueStep2()}
                  className="rounded-2xl bg-black px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={calcular}
                  disabled={!canContinueStep3()}
                  className="rounded-2xl bg-black px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Calcular cotización
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function CotizaPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <CotizaContent />
    </Suspense>
  );
}