# DiscoLab · Digitalización de 4.º ESO

Laboratorio de almacenamiento con teoría y seis actividades. El ordenador ya tiene Windows instalado. Se consultan discos y se conservan archivos al reorganizar volúmenes, sin repetir el montaje ni la instalación del sistema operativo.

## Abrir en el ordenador

1. Extrae el ZIP completo en una carpeta.
2. Abre `index.html` con Chrome, Edge o Firefox actualizado.
3. Conserva los demás archivos y la carpeta `vendor` junto al HTML.

La aplicación funciona sin instalar programas ni usar el terminal. La biblioteca que genera los informes PDF está incluida: no descarga dependencias desde servicios externos.

## Publicar con GitHub Pages

1. Crea un repositorio para la práctica.
2. En **Add file → Upload files**, sube el contenido extraído del ZIP, conservando la carpeta `vendor`. No subas únicamente el ZIP.
3. Comprueba que `index.html` está en la raíz, junto a `styles.css`, `core.js`, `app.js` y `report.js`.
4. En **Settings → Pages**, selecciona **Deploy from a branch**, la rama que contiene los archivos (normalmente `main`) y **/(root)**. Guarda.
5. Abre el enlace que muestre Pages cuando termine la publicación.

`.nojekyll` está vacío a propósito y permite publicar los archivos estáticos. Al actualizar una publicación, sustituye todos los archivos, no solo `index.html`. Si el navegador conserva archivos antiguos, recarga con Ctrl+F5.

Documentación oficial: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Actividades

- **0. Teoría:** firmware, UEFI/BIOS, particiones, MBR/GPT, sistemas de archivos y seguridad.
- **1. Inspección:** equipo y cuatro discos, en modo de consulta.
- **2. MBR y GPT:** comparación de tres organizaciones, distinguiendo entradas de la tabla y unidades de datos; aplicación a discos grandes.
- **3. Organización:** 3A con guía paso a paso para copiar, reducir, crear, observar RAW, formatear y copiar; 3B con otro encargo autónomo, dos nuevos volúmenes NTFS/exFAT y reserva sin asignar.
- **4. Formatos:** explicación previa de cinco sistemas de archivos y cinco usos simulados.
- **5. Incidencias:** cuatro incidencias por modelo, de un banco de siete. Se elige una alternativa, se ejecuta una sola vez y se escribe el análisis posterior de los cambios y del cumplimiento del encargo. No hay plan inicial redactado.
- **6. Cuestionario e informe:** doce preguntas tipo test, una comparación con palabras propias que cambia según el modelo y PDF de todo el trabajo.

Uno de dieciséis modelos se asigna al azar al comenzar. El código queda oculto en la web y aparece en el PDF del alumno para corregir. No hay selector para cambiarlo. Se conserva al guardar, cargar y reiniciar. Cambian capacidades, etiquetas, comparación final, incidencias y orden de alternativas. La asignación puede repetirse entre alumnos: no hay un registro central de la clase. Los fabricantes mostrados son reales; los discos y sus contenidos son simulados.

La práctica ampliada está planteada para aproximadamente 1 h 40 min, ajustable al ritmo del grupo. No hay botones de pistas: se pueden consultar Teoría y Glosario.

El banco de incidencias cubre ampliación bloqueada, archivo grande en FAT32, copia frente a avería física, unidad con datos que aparece RAW, ampliación con reserva, límite de primarias MBR y cambio de letra de unidad.

Las zonas pequeñas de los discos tienen etiquetas completas. Los bloques conservan el orden de las zonas, pero su anchura no representa sus capacidades. Los tamaños se consultan en las cifras.

No hay botones de corrección ni notas automáticas. Las marcas de progreso indican respuestas y operaciones registradas, sin evaluar su contenido. Las simulaciones describen consecuencias técnicas, por ejemplo una copia detenida por falta de sistema de archivos.

## Guardar y cargar

**Guardar** descarga un archivo JSON con nombres, posición, discos de ambos ejercicios, archivos simulados, respuestas, decisiones, reflexiones y registro. También se puede usar Ctrl+S.

**Cargar** recupera ese archivo en el mismo ordenador o en otro. Antes de sustituir el progreso actual pide confirmación. Los JSON de las versiones 1 y 2 son compatibles: conservan discos, respuestas y decisiones anteriores; las antiguas redacciones se archivan y aparecen en el informe. El ejercicio autónomo, las preguntas nuevas y las nuevas incidencias quedan disponibles para completar.

El navegador conserva una copia automática cuando su almacenamiento está disponible. En un equipo compartido o para cambiar de ordenador, guarda el JSON. El PDF y el JSON tienen funciones diferentes: el PDF documenta; el JSON permite continuar.

## Reinicios

**Reiniciar actividad actual**, encima de **Reiniciar simulación**, afecta solo al apartado abierto. Conserva los datos del alumnado, las otras actividades y el historial.

- Actividades 1 y 2: borra sus respuestas.
- Actividad 3: restaura los discos de 3A y 3B; no borra las respuestas de otras actividades.
- Actividad 4: borra sus elecciones, explicaciones y observaciones.
- Actividad 5: borra reflexiones posteriores y elecciones aún no ejecutadas. Conserva decisiones ya ejecutadas y consecuencias para impedir el tanteo de opciones desde esa actividad.
- Actividad 6: borra las doce respuestas tipo test y la única redacción.

La teoría no tiene datos que reiniciar. **Reiniciar simulación** restaura toda la práctica, conservando nombres, clase y la asignación inicial. Ambos reinicios muestran una confirmación para evitar pérdidas accidentales.

## Informe PDF

El botón final requiere los nombres del alumnado. El PDF incluye el modelo asignado, la distribución inicial y final de los discos de 3A y 3B, archivos, respuestas, elecciones, resultados de simulaciones, reflexiones y operaciones, incluidos los intentos detenidos. Conserva también las respuestas y consultas históricas de progresos de versiones anteriores.

**Generar el PDF no borra ni reinicia nada.** Se puede continuar, guardar y generar nuevos informes. Si faltan datos, se puede exportar igualmente y los campos sin responder quedan indicados. El documento no muestra soluciones ni califica las respuestas.

El solucionario explicado del profesorado se entrega por separado como `DiscoLab_Solucionario.pdf`. Incluye los cálculos y respuestas de los dieciséis modelos y las consecuencias de todas las alternativas de las siete incidencias. Conserva ese PDF fuera del repositorio público del alumnado.

## Criterios de la simulación

Se modela un gestor de Windows con discos básicos: reducción NTFS/RAW, ampliación NTFS con espacio sin asignar inmediatamente a la derecha en el mismo disco y creación de volúmenes sin formatear. No se modelan discos dinámicos, movimiento de particiones, RAID ni volúmenes distribuidos.

MB, GB y TB se rotulan como en la interfaz de Windows modelada. Los cuadros trabajan en escala binaria: en esta simulación, 1 GB mostrado equivale a 1.024 MB del cuadro. No se presenta esa conversión como una definición general de las unidades decimales comerciales. El límite individual de FAT32 es 4.294.967.295 bytes.

Los discos del sistema y sus particiones reservadas están protegidos. Las modificaciones de equipos reales se realizan solo en VM o con discos de práctica preparados.

## Archivos

- `index.html`, `styles.css`, `app.js`: interfaz.
- `core.js`: discos, operaciones, datos variables y validación del progreso.
- `report.js`: informe del alumnado.
- `vendor/pdf-lib.min.js` y `vendor/LICENSE-pdf-lib.md`: biblioteca PDF y licencia.
- `.nojekyll` y este documento: publicación e instrucciones.

La aplicación no utiliza cuentas, analítica ni servicios para enviar el trabajo. El progreso permanece en el navegador o en los archivos descargados.
