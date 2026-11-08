# SquadBerry Web

Frontend público de SquadBerry, construido con React, TypeScript y Vite.

## Desarrollo

```bash
npm ci
npm run dev
```

La vista previa de la nueva marca está disponible en:

- `/squadberry`

## Build

```bash
npm run build
```

Vite genera la aplicación en `dist/`.

## Vercel

1. Importar este repositorio en Vercel.
2. Framework: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Configurar las variables públicas necesarias usando `.env.example`.

La regla de `vercel.json` permite abrir directamente las rutas de la SPA.

## Seguridad

Este repositorio no contiene archivos `.env`, credenciales, respaldos, datos de clientes ni documentación operativa privada.
