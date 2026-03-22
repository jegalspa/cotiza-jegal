const DIRECTUS_URL = process.env.DIRECTUS_URL!;
const DIRECTUS_STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN!;

type DirectusCreateResponse<T> = {
  data: T;
};

export async function directusCreateItem<T>(
  collection: string,
  payload: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${DIRECTUS_URL}/items/${collection}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DIRECTUS_STATIC_TOKEN}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const rawText = await res.text();

  let json: DirectusCreateResponse<T> | null = null;

  try {
    json = JSON.parse(rawText) as DirectusCreateResponse<T>;
  } catch {
    throw new Error(
      `Directus respondió HTML o texto no JSON. Revisa DIRECTUS_URL. Respuesta: ${rawText.slice(
        0,
        200
      )}`
    );
  }

  if (!res.ok) {
    throw new Error(
      `Error Directus al crear item en ${collection}: ${res.status} ${JSON.stringify(
        json
      )}`
    );
  }

  return json.data;
}