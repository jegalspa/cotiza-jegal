import { NextRequest, NextResponse } from 'next/server';
import { directusCreateItem } from '@/lib/directus';

type ClienteCreado = {
  id: string | number;
};

type CotizacionCreada = {
  id: string | number;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      cliente,
      quote,
      form,
    }: {
      cliente: {
        nombre: string;
        telefono: string;
        email: string;
        region: string;
        comuna: string;
      };
      quote: {
        titulo: string;
        factible: boolean;
        manoObraBase: number;
        recargoComuna: number;
        descuentoCiudad: number;
        totalManoObra: number;
        materiales: string[];
        observaciones: string[];
      };
      form: Record<string, unknown>;
    } = body;

    const clienteCreado = await directusCreateItem<ClienteCreado>(
      'clientes_cotiza',
      {
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        email: cliente.email,
        region: cliente.region,
        comuna: cliente.comuna,
      }
    );

    const cotizacionCreada = await directusCreateItem<CotizacionCreada>(
      'cotizaciones_cotiza',
      {
        cliente_id: clienteCreado.id,
        categoria: String(form.category || ''),
        titulo: quote.titulo,
        region: cliente.region,
        comuna: cliente.comuna,
        factible: quote.factible,
        mano_obra_base: quote.manoObraBase,
        recargo_comuna: quote.recargoComuna,
        descuento_ciudad: quote.descuentoCiudad,
        total_mano_obra: quote.totalManoObra,
        materiales: quote.materiales,
        observaciones: quote.observaciones.join('\n'),
        datos_formulario: form,
      }
    );

    return NextResponse.json({
      ok: true,
      clienteId: clienteCreado.id,
      cotizacionId: cotizacionCreada.id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: 'No se pudo guardar la cotización en Directus',
      },
      { status: 500 }
    );
  }
}