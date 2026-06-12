# Rutas Saltillo

Aplicacion React + Vite + TypeScript para asistencia, navegacion y bitacora en ruta. El sistema permite:

- Ver ruta optimizada de paradas en Saltillo con GPS.
- Iniciar/finalizar jornada con cronometro persistente.
- Registrar evidencias fotograficas desde laptop o Android.
- Subir fotos a Google Drive y filas a Google Sheets.
- Guardar reportes en `localStorage` cuando no hay red, backend o permisos completos.

## Variables de entorno

Crea `.env.local`:

```bash
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
VITE_API_BASE_URL=https://tu-backend.example.com
```

`VITE_API_BASE_URL` es opcional en web cuando `/api/master-spreadsheet` existe en el mismo dominio. En Electron/Android debe apuntar a un backend publicado si quieres compartir el ID maestro entre dispositivos.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run electron:build
npm run electron:build:win
npm run cap:add:android
npm run cap:sync
npm run android:apk
```

## Flujo Google Workspace

La app usa OAuth de Google con una sesion local de 50 minutos. Si el usuario administrador `bienestarparatodos202519@gmail.com` no encuentra una hoja maestra mediante `/api/master-spreadsheet`, crea una hoja de calculo y registra el ID en el backend cuando este disponible.

Pestanas creadas/verificadas:

- `Evidencias de Rutas`
- `Bitacoras de Trabajo`

Si el servidor o Google no responde, las evidencias y bitacoras quedan en la cola offline del dispositivo para reintento manual.

## Compilar Windows .exe

```bash
npm run electron:build:win
```

El instalador se genera en `dist_electron/` cuando el entorno tiene las dependencias de Electron Builder para Windows.

## Compilar Android .apk

Primera vez:

```bash
npm run cap:add:android
```

Despues:

```bash
npm run android:apk
```

El APK debug queda en `android/app/build/outputs/apk/debug/` cuando Android SDK/Gradle estan instalados.