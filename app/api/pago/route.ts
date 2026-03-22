import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const accessToken = process.env.MP_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Falta MP_ACCESS_TOKEN en .env.local',
        },
        { status: 500 }
      );
    }

    const preference = {
      items: [
        {
          title: body.titulo || 'Solicitud de instalación JEGAL',
          quantity: 1,
          currency_id: 'CLP',
          unit_price: Number(body.total || 0),
        },
      ],
      back_urls: {
        success: 'http://localhost:3000/pago/exito',
        failure: 'http://localhost:3000/pago/fallo',
        pending: 'http://localhost:3000/pago/pendiente',
      },
      auto_return: 'approved',
    };

    console.log('PREFERENCE ENVIADA A MP:', preference);

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    const rawText = await res.text();
    console.log('RESPUESTA RAW MP:', rawText);

    let data: any = null;

    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          message: 'Mercado Pago no respondió JSON',
          error: rawText.slice(0, 500),
        },
        { status: 500 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Error al crear preferencia de pago',
          status: res.status,
          error: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      id: data.id,
    });
  } catch (error) {
    console.error('ERROR MERCADO PAGO:', error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'No se pudo iniciar el pago',
      },
      { status: 500 }
    );
  }
}