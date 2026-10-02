# Mis Gastos

App para registrar gastos desde el celular. Guarda cada movimiento en la pestaña **Registro** de tu Hoja de Google.

## 1. Conectar tu Hoja de Google (una sola vez)
1. Abre tu Hoja de presupuesto en la computadora.
2. Entra a **Extensiones > Apps Script**.
3. Borra lo que aparezca y pega todo el contenido de `apps-script/Code.gs`.
4. En la línea `const PIN = '1234';` cambia `1234` por un PIN tuyo de 6 a 8 números. Guarda con el ícono del disquete.
5. Entra a **Implementar > Nueva implementación**. En el engranaje elige **Aplicación web** y configúrala así:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
6. Pulsa **Implementar** y autoriza los permisos. Google te mostrará un aviso de "app no verificada": entra a *Configuración avanzada > Ir a…*. Es normal porque el script es tuyo.
7. Copia la **URL de la aplicación web** (termina en `/exec`).

La pestaña **Registro** se crea sola con el primer gasto.

## 2. Publicar la app en GitHub Pages
1. Sube `index.html`, `manifest.json` e `icon.svg` a un repositorio de GitHub.
2. Entra a **Settings > Pages**. En "Branch" elige `main` y la carpeta `/ (root)`, y guarda.
3. Al minuto tendrás un enlace como `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

## 3. Instalarla en el celular
1. Abre el enlace en el celular. En **Ajustes**, pega la URL del paso 1 y tu PIN, y pulsa "Guardar y probar conexión".
2. Desde el menú del navegador elige **Agregar a pantalla de inicio**. Te quedará con su propio ícono.

## Cómo funciona
- **Registrar:** escribe el monto, elige la categoría y pulsa Guardar. La nota es opcional; la fecha y el método ya vienen puestos.
- **Sin internet:** el gasto se guarda en el celular y se envía solo cuando vuelve la conexión.
- **Quincenas:** van del 15 al 28 (quincena del 15) y del 29 al 14 (quincena del 30).
- **Quincena:** muestra cuánto entró, cuánto salió, lo que llevas por categoría frente a tu presupuesto y cuánto te queda libre después de los pagos fijos pendientes.
- **Fijos:** son los pagos de la quincena. Al marcar uno como "Pagado" se registra el gasto.
- **Ajustes:** ahí cambias el presupuesto por categoría y la lista de pagos fijos. Se guardan en el celular.

Tu PIN no va en el código de GitHub; solo vive en tu Hoja y en tu celular.
