# Agenda Clinica Calendar

Aplicacion React para visualizar citas de pacientes por mes, semana o dia, con filtros por especialidad y especialista.

## Requisitos

- Node.js 22+
- npm 10+

## Scripts

- `npm run dev`: inicia el servidor de desarrollo.
- `npm run build`: compila TypeScript y genera el build de produccion.
- `npm run lint`: ejecuta ESLint.
- `npm run preview`: sirve el build generado.

## Android

El proyecto incluye Capacitor para generar APK Android desde el build web.

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

El APK debug queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

## Windows EXE

El proyecto incluye Neutralino para generar un ejecutable Windows de un solo archivo.

```bash
npm run desktop:exe
```

El EXE queda en `descargas/agenda-clinica-computadora.exe`.