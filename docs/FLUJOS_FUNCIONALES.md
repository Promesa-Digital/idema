# Flujos funcionales de la plataforma IDEMA

Este documento organiza la operación del sistema en diez flujos. Agrupa módulos relacionados para mostrar el recorrido completo desde la publicación de la oferta educativa hasta el pago, la matrícula y la atención posterior del alumno.

## Actores

| Actor | Responsabilidad principal |
|---|---|
| Visitante | Consulta la oferta, responde campañas y deja sus datos. |
| Alumno | Administra su cuenta, realiza pagos y consulta su historial. |
| Marketing y Ventas | Crean campañas y popups; capturan interesados. |
| Dirección de Marketing | Aprueba y publica popups. |
| Ventas | Atiende leads y gestiona descuentos comerciales. |
| Área Académica | Gestiona programas, matrículas y reglas de electivos. |
| Administración | Controla órdenes, comprobantes, pagos y conciliaciones. |
| Administrador del Sistema | Gestiona usuarios y brinda soporte transversal. |

## Mapa de módulos

| Flujo | Módulos incluidos |
|---|---|
| 1 | Programas |
| 2 | Popups |
| 3 | Leads |
| 4 | Usuarios y roles |
| 5 | Combos |
| 6 | Conceptos de cobro y descuentos |
| 7 | Órdenes y pagos |
| 8 | Comprobantes y conciliación |
| 9 | Cuenta del alumno |
| 10 | Matrículas y electivos |

El dashboard y los reportes son funciones transversales: consultan información producida por los diez flujos y no generan una entidad de negocio independiente.

## 1. Programas

**Objetivo:** registrar y publicar carreras, auxiliares, especializaciones y cursos.

**Inicio:** el Área Académica necesita crear o actualizar una oferta educativa.

```text
Académico crea programa
        ↓
Completa datos académicos y comerciales
        ↓
Programa no publicado
        ↓
Revisión de contenido y precio
        ↓
Publicación inmediata o programada
        ↓
Programa visible en la oferta pública
        ↓
Actualización posterior o archivado
```

**Datos principales:** código, abreviatura, nombre, tipo, categoría, descripción, año, malla, número de lecciones, certificación, tutor, fecha programada y estado.

**Estados:** `no_publicado → publicado → archivado`.

**Resultado:** el programa queda disponible para consultas, conceptos de cobro, combos, órdenes, matrículas y electivos.

**Pendiente de decisión:** confirmar quién autoriza la publicación final. El sistema permite gestión académica y soporte del Administrador del Sistema, pero el aprobador funcional no está formalmente definido.

## 2. Popups

**Objetivo:** crear campañas emergentes y controlar su aprobación, vigencia y publicación.

```text
Marketing o Ventas crea borrador
        ↓
El creador edita y envía a aprobación
        ↓
Dirección de Marketing revisa
       ↙ ↘
Rechaza   Aprueba
   ↓         ↓
Vuelve al   Publica
creador        ↓
          Visible en web
               ↓
            Finaliza
```

**Datos principales:** tipo, texto, imagen WebP, video opcional, enlace, páginas, concepto de cobro EDU-09, temporizador, texto superior y fechas de vigencia.

**Estados:** `borrador → pendiente → aprobado → publicado → finalizado`, con retorno a `rechazado` cuando la revisión no se aprueba.

**Reglas:** Marketing y Ventas crean y editan sus propios borradores o rechazados. Dirección de Marketing aprueba, rechaza, publica y finaliza. El Administrador del Sistema puede intervenir como respaldo en todo el flujo. No existe eliminación física: un popup publicado se finaliza y conserva su historial. La web pública solo recibe registros publicados y vigentes desde el backend.

**Resultado:** el visitante ve la campaña en las rutas configuradas. El anuncio aparece en cada visita a la página principal y el descuento una vez al día por visitante; en empates prevalece el último activado.

**Estado:** completado. Incluye carga y conversión WebP, vista previa, video para anuncios, descuento enlazado a EDU-09, temporizador de diez minutos, reglas por página y comportamiento adaptable a móvil y escritorio. El popup institucional anterior fue migrado al backend y eliminado como dato estático del frontend. Analítica de vistas/clics permanece fuera del alcance de EDU-02.

## 3. Leads

**Objetivo:** convertir consultas públicas en oportunidades comerciales atendibles.

```text
Visitante completa formulario o popup
        ↓
Validación de datos y consentimiento
        ↓
Búsqueda de posible duplicado
       ↙ ↘
Existe    No existe
  ↓          ↓
Se informa  Se crea lead nuevo
                 ↓
          Asignación de asesor
                 ↓
          Contacto de Ventas
              ↙     ↘
        Descartado   Pago
                         ↓
                Posible cuenta de alumno
```

**Estados:** `nuevo → contactado → pago` o `nuevo/contactado → descartado`.

**Origen:** formulario o popup.

**Reglas:** si no existe conexión, el formulario público conserva temporalmente el envío para reintentarlo. La conversión a cuenta de alumno es opcional y un lead solo puede originar una cuenta.

**Resultado:** Ventas dispone de datos de contacto, origen, estado y asesor responsable.

**Pendiente de decisión:** confirmar si Marketing y Administración pueden modificar y reasignar leads o si esa operación corresponde exclusivamente a Ventas.

## 4. Usuarios y roles

**Objetivo:** controlar quién entra al panel y qué módulos puede utilizar.

```text
Administrador crea usuario
        ↓
Asigna rol y estado
        ↓
Usuario inicia sesión
        ↓
Backend valida credenciales
        ↓
Entrega token de acceso
        ↓
Frontend consulta identidad y rol
        ↓
Muestra únicamente módulos autorizados
        ↓
Administrador actualiza o desactiva cuenta
```

**Roles implementados:** Marketing, Dirección de Marketing, Ventas, Académico, Administración y Administrador del Sistema.

**Reglas:** una cuenta inactiva no debe iniciar sesión. Las restricciones del frontend facilitan la navegación, pero el backend debe volver a validar cada permiso.

**Resultado:** acceso segmentado y sesiones administrativas separadas de las sesiones de alumnos.

**Pendiente de decisión:** definir si Dirección de Marketing seguirá como rol independiente o será Marketing con un permiso especial. También falta identificar al responsable real del rol Administrador del Sistema.

## 5. Combos

**Objetivo:** vender dos o más programas como un paquete comercial.

```text
Marketing o Ventas propone combo
        ↓
Selecciona dos o más programas
        ↓
Define nombre, orden y vigencia
        ↓
Asocia un concepto de cobro
        ↓
Activa el combo
        ↓
Combo disponible para venta
        ↓
Final de vigencia o desactivación
```

**Datos principales:** nombre, descripción, inicio y fin de vigencia, estado y programas incluidos.

**Estados:** `activo ↔ inactivo`.

**Reglas:** un combo debe contener al menos dos programas; no puede repetir el mismo programa y cada posición dentro del paquete debe ser única.

**Resultado:** el combo puede tener un precio propio mediante un concepto de cobro, aparece en la sección pública de Combos académicos y se agrega al carrito como un único paquete con sus programas incluidos.

**Estado:** completado. Marketing y Ventas gestionan el catálogo de combos; el concepto de cobro mantiene el precio y enlace de pago; el visitante puede añadir el paquete al carrito; y la baja es lógica, conservando el historial.

## 6. Conceptos de cobro y descuentos

**Objetivo:** definir qué se cobra, cuánto cuesta y qué beneficio puede aplicarse.

```text
Se selecciona programa o combo
        ↓
Se crea concepto de cobro
        ↓
Se define tipo, monto y descripción
        ↓
Concepto activo
        ↓
Ventas puede asociar descuento
        ↓
Validación de vigencia y límite
        ↓
Importe final disponible para una orden
```

**Tipos de concepto:** matrícula, inscripción, curso, pensión o gratuito.

**Tipos de descuento:** manual o pronto pago.

**Reglas:** un concepto pertenece a un programa o a un combo, nunca a ambos. El importe de una orden debe conservar una copia histórica y no recalcularse si el precio cambia después.

**Resultado:** precio base y posible descuento preparados para generar una orden.

**Pendiente de decisión:** definir si Académico propone precios y Administración los aprueba o si el Administrador del Sistema será el único operador. También falta distinguir formalmente descuentos de monto fijo y porcentaje.

## 7. Órdenes y pagos

**Objetivo:** registrar una obligación de pago y confirmar su resultado mediante Culqi o validación administrativa.

```text
Alumno selecciona concepto
        ↓
Backend valida precio y descuento
        ↓
Se crea orden pendiente
        ↓
Se inicia pago con Culqi
        ↓
Culqi procesa la operación
      ↙      ↘
   Fallida   Confirmada por webhook
      ↓             ↓
   Fallida        Pagada
                      ↓
          Comprobante o matrícula
                      ↓
                 Conciliada
```

**Estados:** `pendiente → pagada → conciliada`, `pendiente → fallida` o `pendiente/pagada → anulada` según la política autorizada.

**Reglas:** el frontend no confirma el pago. El backend debe crear la orden, validar el webhook, verificar importes y evitar procesar dos veces la misma notificación.

**Resultado:** una orden conserva alumno, concepto, descuento, monto histórico, referencia Culqi, fecha y estado.

**Pendiente técnico:** unificar los enlaces externos de suscripción y el carrito actual con la creación real de órdenes. También falta definir reembolsos y anulaciones.

## 8. Comprobantes y conciliación

**Objetivo:** documentar el pago y comprobar que el dinero registrado coincide con el abono de Culqi.

```text
Orden pagada
     ↓
Administración solicita comprobante
     ↓
Boleta o factura pendiente
     ↓
Emisión o revisión
  ↙    ↓      ↘
Observado Emitido Anulado
             ↓
Agrupación por periodo de Culqi
             ↓
Comparar esperado, abonado y comisión
             ↓
Abierta → En revisión → Cerrada
             ↓
Orden conciliada
```

**Reglas:** una orden genera como máximo un comprobante. La constancia descargada por el alumno no reemplaza el comprobante electrónico de SUNAT. El monto esperado de una conciliación se calcula desde sus órdenes y no se almacena como dato independiente.

**Resultado:** evidencia del cobro y control de diferencias financieras.

**Pendiente de decisión:** confirmar responsable contable, integración de comprobantes, tolerancias de conciliación, manejo de diferencias y cierre formal del alcance.

## 9. Cuenta del alumno

**Objetivo:** permitir que una persona gestione su identidad y consulte su información académica y financiera.

```text
Persona se registra o convierte desde lead
        ↓
Valida DNI, correo y datos personales
        ↓
Acepta política de privacidad
        ↓
Cuenta activa
        ↓
Verificación de correo
        ↓
Acceso al portal privado
        ↓
Consulta perfil, órdenes, pagos, comprobantes y matrículas
        ↓
Actualiza datos, contraseña o consentimiento
        ↓
Puede solicitar baja
```

**Reglas:** DNI y correo son únicos. La contraseña solo se almacena como hash en el backend. El token de recuperación vence y deja de funcionar después del cambio de contraseña. Una cuenta administrativa nunca debe utilizar la sesión de un alumno.

**Baja:** si existen antecedentes académicos o financieros, se desactiva la cuenta conservando la información exigible; si no existen, el backend puede anonimizar los datos según la política acordada.

**Resultado:** identidad única del alumno relacionada con leads, órdenes y matrículas.

**Pendiente de decisión:** aprobación formal de alcance, validación legal de conservación y anonimización, y definición del soporte que pueden brindar Ventas, Académico y Administración.

## 10. Matrículas y electivos

**Objetivo:** convertir una orden válida en una inscripción académica y permitir la selección de cursos electivos.

```text
Orden válida para matrícula
        ↓
Se crea matrícula pendiente
        ↓
Área Académica revisa datos
      ↙          ↘
   Anulada       Activa
                    ↓
       Alumno consulta electivos disponibles
                    ↓
          Selecciona dentro del límite
                    ↓
             Electivo activo
               ↙         ↘
          Cancelado    Completado
```

**Tipos de matrícula:** nueva o retorno.

**Estados de matrícula:** `pendiente → activa` o `pendiente/activa → anulada`.

**Estados de electivo:** `activo → completado` o `activo → cancelado`.

**Reglas:** cada matrícula tiene una única orden obligatoria, un alumno y un programa. Un electivo pertenece a una matrícula y referencia un programa de tipo curso. Los límites deben depender del tipo de programa y ser validados por el backend.

**Resultado:** historial académico básico visible para el alumno y las áreas autorizadas.

**Pendiente de decisión:** confirmar si el alumno activa y retira electivos directamente o si Académico debe aprobarlos. Matrículas, electivos y portal requieren aprobación formal de la ampliación de alcance.

## Dashboard y reportes

El dashboard resume información según el rol autenticado. Los reportes consultan datos existentes y no agregan una entidad nueva.

- Marketing consulta rendimiento de popups y leads.
- Dirección de Marketing revisa campañas y conversiones.
- Administración consulta órdenes, pagos y conciliaciones.
- Académico consulta matrículas y electivos.
- El Administrador del Sistema puede consultar indicadores transversales.

Los reportes deben aplicar los mismos permisos del módulo de origen y permitir filtros por periodo, estado y categoría cuando corresponda.

## Recorrido integral

```text
Programa publicado
        ↓
Popup o formulario atrae visitante
        ↓
Lead nuevo y seguimiento de Ventas
        ↓
Creación de cuenta de alumno
        ↓
Concepto, combo o descuento aplicable
        ↓
Orden pendiente y pago Culqi
        ↓
Orden pagada
   ↙          ↘
Comprobante   Matrícula activa
   ↓               ↓
Conciliación     Electivos
        ↘       ↙
      Portal y reportes
```

## Observaciones técnicas pendientes

- **Conceptos de cobro y rol Marketing:** el backend permite a `marketing` consultar conceptos de cobro, mientras una prueba automatizada heredada espera `403`. El frontend no muestra actualmente este módulo a Marketing. Se debe confirmar con el responsable funcional si Marketing conserva lectura o debe restringirse; no afecta la creación, actualización ni activación de precios, reservadas a `admin_sistema`.
- **Advertencia técnica en pruebas:** Pydantic muestra una advertencia sobre `validate_default` en un campo de esquema. No causa fallos ni altera las respuestas actuales, pero queda pendiente actualizar la declaración del campo para eliminar el aviso.
