# Instalacion

## Android APK

1. Descarga `agenda_clinica_android_debug.apk`.
2. Copialo a tu telefono Android.
3. Abre el archivo desde el telefono.
4. Si Android lo pide, activa "Instalar apps desconocidas" para tu explorador o navegador.
5. Instala y abre "Agenda Clinica".

Nota: este APK es de depuracion y esta firmado con certificado debug. Sirve para pruebas e instalacion directa, no para publicarlo en Play Store.

## Computadora Windows

1. Descarga `agenda-clinica-computadora.exe`.
2. Haz doble clic en el archivo.
3. Si Windows muestra una alerta de seguridad, elige "Mas informacion" y luego "Ejecutar de todos modos".
4. Se abre la aplicacion "Agenda Clinica".

No necesitas programar, instalar Node ni abrir terminal.

## Uso de datos y Excel

- Da de alta pacientes desde "Alta manual de paciente".
- Da de alta psicologos o psiquiatras desde "Alta manual de psicologo/psiquiatra".
- Captura jornadas con dias y horas de trabajo.
- Usa "Carga masiva Excel" para subir pacientes, especialistas, citas y bloqueos desde la plantilla.
- Usa "Descargar Excel" para bajar todos los datos capturados.
- Para tener la misma informacion en otra computadora, descarga el Excel en la primera computadora y cargalo en la segunda.
- Para sincronizacion central, configura un Google Sheet con el archivo `GOOGLE_SHEETS_SYNC.gs`, publica el Apps Script como Web App y pega esa URL dentro de "Sincronizacion Google Sheets".
- Los botones de WhatsApp abren mensajes listos para confirmar, cancelar o recordar citas. El envio automatico sin tocar WhatsApp requiere WhatsApp Business API y un servidor externo.

## Web opcional

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
