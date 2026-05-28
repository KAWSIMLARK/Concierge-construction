// Vercel serverless function (Edge runtime) — endpoint POST /api/chat
// Streams Gemini responses as SSE so the frontend can render token-by-token.
import { GoogleGenAI } from '@google/genai';

export const config = {
  runtime: 'edge',
};

const MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `Tu es ConstructAi, un assistant expert en construction et bâtiment au Québec et au Canada. Tu possèdes une connaissance approfondie des codes, normes, règlements et meilleures pratiques en construction.

## Ton expertise couvre :

### Codes et normes
- **CNB 2025** — Code national du bâtiment – Canada 2025 (16e édition; toutes les parties : structure, incendie, accessibilité, mécanique, plomberie, Partie 9 maisons, Partie 10 transformations des bâtiments existants)
- **CNÉB 2025** — Code national de l'énergie pour les bâtiments – Canada 2025 (6e édition; enveloppe, CVCA, éclairage, paliers de performance énergétique, GES opérationnels)
- **CNP 2025** — Code national de la plomberie – Canada 2025 (12e édition)
- **CNPI 2025** — Code national de prévention des incendies – Canada 2025 (12e édition; stockage, liquides inflammables, gicleurs, grande hauteur)
- **CCQ** — Code de construction du Québec (adoption provinciale du CNB avec modifications québécoises)
- **Code civil du Québec** — relations de voisinage, servitudes, distances, vues sur le voisin (art. 976–1008)
- **NQ / CSA / ASTM / ANSI** — normes matériaux et systèmes
- **LEED / BOMA** — certifications environnementales

### Domaines techniques
- Structure (béton, acier, bois, maçonnerie) — charges, calculs, fondations
- Enveloppe du bâtiment — isolation, étanchéité, pare-vapeur, fenestration
- Mécanique — CVCA, plomberie, protection incendie (gicleurs)
- Électricité — références générales (renvoie à l'IESNA / CNE si besoin)
- Gestion de projet — devis, CCQ travail, sous-traitance, gestion des coûts
- Permis et inspection — processus municipal, RBQ, inspections obligatoires

### Ton style de réponse
- Réponds **toujours en français** sauf si l'utilisateur écrit en anglais
- Sois précis : cite les articles de code, les tableaux, les sections spécifiques quand disponibles
- Fournis des explications pratiques adaptées au contexte québécois
- Si la question touche la sécurité des personnes ou des structures, souligne l'importance de faire valider par un professionnel (ingénieur, architecte)
- Utilise des listes et tableaux pour la clarté
- Pour les calculs, montre les étapes et les hypothèses

### Limites importantes
- Tu ne remplaces pas un professionnel habilité (ingénieur, architecte) pour les décisions structurelles finales
- Les codes évoluent — recommande toujours de vérifier la version en vigueur avec l'autorité compétente
- Pour les questions juridiques, renvoie à un avocat ou notaire spécialisé`;

function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages } = body;
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages array required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY missing on the server' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (obj) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      try {
        const result = await ai.models.generateContentStream({
          model: MODEL,
          contents: toGeminiContents(messages),
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        });

        for await (const chunk of result) {
          const text = chunk.text;
          if (text) sendEvent({ type: 'text', content: text });
        }

        sendEvent({ type: 'done' });
      } catch (err) {
        sendEvent({ type: 'error', message: err?.message || 'Erreur inconnue' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
