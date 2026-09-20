# 🚀 Jev to Hackathon

> **De “tengo una idea” a “este es el desafío NASA que mejor le calza”.**

Pegá tu idea —aunque todavía esté medio cruda— y usá **Jev** para encontrar un desafío de [NASA Space Apps 2026](https://www.spaceappschallenge.org/2026/challenges/) que tenga sentido. Después, afiná el encaje con criterios concretos, pesos a tu medida y señales claras de qué ya funciona y qué conviene reforzar.

**No es otro chatbot que te tira un pitch genérico.** Jev toma decisiones estructuradas sobre opciones y criterios definidos para cada desafío. La app convierte esas respuestas en una orientación accionable.

## ✨ Qué hace

- **Encontrá tu desafío:** Jev compara tu idea con el catálogo de desafíos y recomienda el que mejor coincide con su objetivo técnico y sus criterios específicos.
- **Evaluá el encaje:** elegí un desafío y obtené resultados por criterio, no un porcentaje misterioso sin contexto.
- **Personalizá la evaluación:** agregá criterios de sí/no o de opción múltiple, explicá qué querés evaluar y ponderá lo que más importa.
- **Guardá tu propia rúbrica:** los criterios se conservan en el navegador y por separado para cada desafío.
- **Convertí el resultado en próximos pasos:** mirá qué aspectos encajan mejor y cuáles podrías fortalecer.
- **Seguí el hilo hasta NASA:** abrí el enlace oficial del desafío recomendado.
- **Usala en español o inglés.**

## 🧭 Cómo funciona

1. Escribí la idea y elegí **Encontrar mi desafío** o **Evaluar mi idea**.
2. Jev devuelve una elección o probabilidades sobre las preguntas estructuradas que definimos.
3. La app presenta el resultado y calcula la alineación ponderada a partir de los criterios evaluados.
4. Ajustá la rúbrica y volvé a probar: las preguntas y los pesos son tuyos.

La sección **“Lo que ya encaja / Qué podrías reforzar”** resume los resultados de esos criterios. **No es el chain of thought de Jev**, ni una explicación generada por un LLM.

> **Importante:** la alineación es orientativa, no una nota oficial de NASA ni una garantía de selección. El catálogo y sus rúbricas están definidos en `data/challenges.js`; esta app no descarga datos satelitales ni consulta NASA para evaluar tu idea.

## 🛠️ Stack

- Next.js + React
- TypeScript AI SDK (`experimental_evaluate`)
- Jev, a través de Vercel AI Gateway
- `localStorage` para guardar las rúbricas personalizadas en este navegador

No hay un LLM generativo adicional. **Eso no significa que el acceso a Jev sea necesariamente gratis**: el uso y cualquier costo dependen de la autenticación y facturación de tu cuenta de AI Gateway.

## ▶️ Arranque local

Requisitos: Node.js y pnpm.

```bash
pnpm install
```

La ruta del servidor que consulta Jev necesita autenticación con AI Gateway. Podés usar una `AI_GATEWAY_API_KEY` en `.env.local` o vincular el proyecto con Vercel y descargar las variables:

```bash
vercel login
vercel link
vercel env pull .env.local
```

Luego iniciá la app:

```bash
pnpm dev
```

Si el token OIDC local vence, volvé a ejecutar `vercel env pull .env.local`. **No subas `.env.local`**: ya está excluido por `.gitignore`.

## ✅ Validaciones

```bash
pnpm lint
pnpm build
```

## 🗂️ Mapa del proyecto

```text
app/
  api/evaluate/route.js  # Evaluaciones y matching con Jev
  page.jsx               # Interfaz, rúbricas y persistencia local
  globals.css            # Estilos
data/
  challenges.js          # Desafíos NASA y criterios específicos
```

## 🤝 Alcance y límites

- Jev elige entre alternativas definidas; no inventa desafíos ni redacta ideas, pitches o planes.
- La calidad de la evaluación depende de la idea que describas y de los criterios de la rúbrica.
- Las rúbricas editadas viven en el `localStorage` de ese navegador: no se sincronizan entre dispositivos ni usuarios.
- Las recomendaciones son orientación para explorar y mejorar una idea, no asesoramiento oficial de NASA.

---

**Una buena idea no necesita otro chatbot. Necesita encontrar su órbita.** 🌎🛰️
