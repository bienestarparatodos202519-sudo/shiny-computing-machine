# Instalacion

## Android APK

1. Descarga `agenda_clinica_android_debug.apk`.
2. Copialo a tu telefono Android.
3. Abre el archivo desde el telefono.
4. Si Android lo pide, activa "Instalar apps desconocidas" para tu explorador o navegador.
5. Instala y abre "Agenda Clinica".

Nota: este APK es de depuracion y esta firmado con certificado debug. Sirve para pruebas e instalacion directa, no para publicarlo en Play Store.

## Web

1. Descarga `agenda_clinica_web_dist.zip`.
2. Descomprime el archivo en un servidor web.
3. Sirve la carpeta con cualquier hosting estatico.

Ejemplo local:

```bash
npx serve dist
```

## Desarrollo

```bash
npm install
npm run dev
```
