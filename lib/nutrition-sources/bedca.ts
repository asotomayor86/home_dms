import type { NutritionSource, NutritionCandidate } from "./types";

// BEDCA — Base de Datos Española de Composición de Alimentos (oficial, AESAN).
// Su servicio web es SOAP/XML antiguo e inestable. Implementación best-effort:
// si no responde o cambia el formato, se informa de que no está disponible.
//
// Estrategia: POST de una consulta XML al endpoint público y parseo defensivo de
// la respuesta. Los componentes nutricionales en BEDCA tienen códigos conocidos.

const ENDPOINT = "https://www.bedca.net/bdpub/procquery.php";

// Nota: los componentes nutricionales de BEDCA tienen códigos conocidos (energía
// 409, proteína 417, hidratos 411, grasa 415, fibra 412, azúcares 446, sal 443).
// Obtenerlos requiere una segunda consulta por alimento; se deja como mejora
// futura por la fragilidad/latencia del servicio.

function buildQueryXml(term: string): string {
  // Consulta de alimentos cuyo nombre contiene `term`.
  return `<?xml version="1.0" encoding="UTF-8"?>
<foodquery><type level="1">user</type>
<selection><atribute name="f_id"/><atribute name="f_ori_name"/></selection>
<condition><cond1><atribute1 name="f_ori_name"/></cond1><relation type="LIKE"/><cond3>%${term}%</cond3></condition>
<order ordtype="ASC"><atribute3 name="f_ori_name"/></order></foodquery>`;
}

export const bedcaSource: NutritionSource = {
  id: "bedca",
  label: "BEDCA (España)",
  note: "Oficial española; servicio inestable, puede no responder.",
  enabled: () => true,
  async search(term): Promise<NutritionCandidate[]> {
    let xml: string;
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=UTF-8",
          "User-Agent": "HomeDMS/1.0 (gestion-domestica)",
        },
        body: buildQueryXml(term),
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) throw new Error(`BEDCA respondió ${res.status}`);
      xml = await res.text();
    } catch {
      throw new Error("BEDCA no está disponible ahora mismo.");
    }

    // Parseo defensivo de la lista de alimentos (id + nombre).
    const foods = parseFoodList(xml).slice(0, 6);
    if (foods.length === 0) return [];

    // BEDCA requiere una segunda consulta por alimento para sus componentes;
    // dada la fragilidad e impacto en latencia, devolvemos el alimento localizado
    // con macros a null cuando no se obtienen. (El usuario puede completarlos.)
    return foods.map<NutritionCandidate>((f) => ({
      sourceId: "bedca",
      externalId: f.id,
      name: f.name,
      brand: null,
      kcalPer100: f.energy ?? null,
      proteinPer100: f.protein ?? null,
      carbsPer100: f.carbs ?? null,
      fatPer100: f.fat ?? null,
      fiberPer100: f.fiber ?? null,
      sugarPer100: f.sugar ?? null,
      saltPer100: f.salt ?? null,
      servingGrams: null,
    }));
  },
};

type BedcaFood = {
  id: string;
  name: string;
  energy?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
  sugar?: number | null;
  salt?: number | null;
};

// Extrae <food>…<f_id>..</f_id><f_ori_name>..</f_ori_name>…</food> de la respuesta.
function parseFoodList(xml: string): BedcaFood[] {
  const out: BedcaFood[] = [];
  const foodBlocks = xml.match(/<food>[\s\S]*?<\/food>/g) ?? [];
  for (const block of foodBlocks) {
    const id = tag(block, "f_id");
    const name = tag(block, "f_ori_name");
    if (id && name) out.push({ id, name });
  }
  return out;
}

function tag(xml: string, name: string): string | null {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`));
  return m ? m[1].trim() : null;
}
