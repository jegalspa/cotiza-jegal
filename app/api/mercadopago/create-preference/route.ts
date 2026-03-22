import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!;
const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      title,
      unit_price,
      quantity = 1,
      quoteId,
      customer,
    }: {
      title: string;
      unit_price: number;
      quantity?: number;
      quoteId?: string | number;
      customer?: {
        name?: string;
        email?: string;
      };
    } = body;

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, message: 'Falta MERCADOPAGO_ACCESS_TOKEN' },
        { status: 500 }
      );
    }

    if (!appUrl) {
      return NextResponse.json(
        { ok: false, message: 'Falta NEXT_PUBLIC_APP_URL' },
        { status: 500 }
      );
    }

    if (!title || !unit_price) {
      return NextResponse.json(
        { ok: false, message: 'Faltan datos para crear la preferencia' },
        { status: 400 }
      );
    }

    const client = new MercadoPagoConfig({
      accessToken,
    });

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: quoteId ? String(quoteId) : 'cotizacion-jegal',
            title: String(title),
            quantity: Number(quantity),
            unit_price: Number(unit_price),
            currency_id: 'CLP',
          },
        ],
        back_urls: {
          success: `${appUrl}/checkout/success`,
          failure: `${appUrl}/checkout/failure`,
          pending: `${appUrl}/checkout/pending`,
        },
        auto_return: 'approved',
        external_reference: quoteId ? String(quoteId) : undefined,
        payer: {
          name: customer?.name || undefined,
          email: customer?.email || undefined,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    });
  } catch (error: any) {
    console.error('ERROR MERCADOPAGO:', error);

    return NextResponse.json(
      {
        ok: false,
        message: error?.message || 'No se pudo crear la preferencia',
      },
      { status: 500 }
    );
  }
}