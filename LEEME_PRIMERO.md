# TERRACO — Paquete maestro para Claude Code

Este paquete reúne el encargo de construcción, las decisiones, el catálogo y los materiales recibidos de TERRACO. Está pensado para crear una demo amplia y conectada, no para iniciar cobros reales.

## Cómo usarlo

1. Descomprimí el ZIP en una carpeta de trabajo. Conservá la estructura completa, incluidos `datos`, `documentacion` y `recursos`.
2. Abrí esa carpeta en Claude Code. Si vas a usar una carpeta con un proyecto existente, copiá el paquete dentro y avisale dónde está.
3. Pegá el texto siguiente. Claude debe leer los archivos e implementar, no solo responder con una propuesta.

```text
Estamos construyendo la demo web de TERRACO Social Club, proyecto JODA.
Leé completo PROMPT_MAESTRO_TERRACO.md y todos los archivos que indica,
incluidas las decisiones consolidadas, el catálogo y las referencias visuales.
Ese archivo es tu encargo de implementación. Prepará un plan breve y ejecutalo
hasta dejar una demo funcional, conectada entre todos los roles, con diseño
profesional, buena experiencia móvil y recorridos comprobados.
No te quedes en una landing, pantallas estáticas o un plan. Usá los materiales
de esta carpeta, identificá supuestos y simulaciones y documentá los pendientes.
Empezá inspeccionando el proyecto y seguí el orden de construcción del prompt.
```

Si el paquete quedó dentro de otra carpeta, ajustá la ruta del prompt en ese texto. No hace falta pegar toda la conversación ni enviar de nuevo cada imagen si Claude ya tiene acceso a estos archivos.

## Qué contiene

| Archivo/carpeta | Función |
| --- | --- |
| `PROMPT_MAESTRO_TERRACO.md` | Encargo completo de producto, diseño, reglas, alcance y validación. |
| `documentacion/04_DECISIONES_CONSOLIDADAS.md` | Reglas finales y resolución de complicaciones. |
| `documentacion/01_BASE_REAL_TERRACO.md` | Datos reales, carta transcrita y evidencia visual del establecimiento. |
| `documentacion/02_MATRIZ_72_PROBLEMAS.md` | Problemas investigados, soluciones, pruebas y fuentes. |
| `documentacion/03_PROPUESTAS_COMPETENCIA.md` | Seis mejoras seleccionadas y su fundamento. |
| `documentacion/00_INVESTIGACION_INICIAL_JODA.md` | Investigación inicial de competidores y referencias de los reels. |
| `datos/catalogo_base.json` | 99 referencias base, texto de fuente, opciones de precio y advertencias. |
| `datos/negocio_y_supuestos.json` | Contacto y decisiones de configuración de demostración. |
| `recursos/` | Cinco cartas, dos logos, tres capturas de referencia y el video recibido. |
| `CONTROL_DEL_PAQUETE.md` | Inventario y verificaciones del material, sin atribuir pruebas a una app todavía no construida. |

## Qué se puede decidir ya

Hay base suficiente para diseñar y construir la mayor parte de la experiencia de prueba: cliente, reservas, caja, cocina, barra, entrega, DJ, pantalla pública, encargado e informes. Deben compartir estados y permitir terminar tareas.

Todavía no hay datos suficientes para habilitar un servicio comercial: faltan relevamiento operativo, validación de catálogo y condiciones, infraestructura, integraciones y verificación de seguridad. La demo hace visibles esos puntos y permite revisarlos con el dueño y el equipo.

Las fases del prompt organizan el trabajo; no son una garantía de terminarlo en una sola respuesta o sesión de Claude. Si necesita continuar, debe dejar un estado y un próximo paso concretos. El alcance final se verifica con los recorridos y la cobertura, no con una promesa de “app completa”.
