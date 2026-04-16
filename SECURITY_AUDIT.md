# Security Audit Report — Weather App

**Fecha:** 16 de abril de 2026  
**Analista:** GitHub Copilot  
**Versión auditada:** 0.1.0  
**Alcance:** Código fuente, dependencias npm, configuración de servidor, privacidad de datos

---

## Resumen Ejecutivo

| Categoría | Hallazgos | Críticos | Corregidos |
|---|---|---|---|
| OWASP Top 10 | 3 | 1 | 3 ✅ |
| Vulnerabilidades CVE (npm) | 5 | 1 (HIGH) | 5 ✅ |
| Licencias de dependencias | 1 aviso | 0 | — |
| Privacidad / GDPR | 2 | 0 | Pendiente ⚠️ |

---

## 1. OWASP Top 10

### 🔴 A06 — Componentes Vulnerables y Desactualizados `[CRÍTICO — CORREGIDO]`

`axios 1.7.0` tenía **5 CVEs activos**, uno de severidad **HIGH (SSRF)**:

| Advisory | Descripción | Severidad |
|---|---|---|
| [GHSA-8hc4-vh64-cxmj](https://github.com/advisories/GHSA-8hc4-vh64-cxmj) | Server-Side Request Forgery via URL absoluta | 🔴 High |
| [GHSA-jr5f-v2jv-69x6](https://github.com/advisories/GHSA-jr5f-v2jv-69x6) | SSRF + filtración de credenciales via URL absoluta | 🔴 High |
| [GHSA-4hjh-wcwx-xvwj](https://github.com/advisories/GHSA-4hjh-wcwx-xvwj) | DoS por ausencia de validación de tamaño de datos | 🟡 Medium |
| [GHSA-43fc-jf86-j433](https://github.com/advisories/GHSA-43fc-jf86-j433) | Prototype pollution via `__proto__` en `mergeConfig` | 🟡 Medium |
| [GHSA-3p68-rc4w-qgx5](https://github.com/advisories/GHSA-3p68-rc4w-qgx5) | Bypass de `NO_PROXY` → SSRF por normalización de hostname | 🟡 Medium |
| [GHSA-fvcv-3m26-pcqx](https://github.com/advisories/GHSA-fvcv-3m26-pcqx) | Exfiltración de Cloud Metadata via inyección de headers | 🟡 Medium |

**Corrección aplicada:** `axios` actualizado de `1.7.0` → `1.15.0` en `package.json`.

```diff
- "axios": "1.7.0",
+ "axios": "1.15.0",
```

---

### 🔴 A05 — Security Misconfiguration `[CRÍTICO — CORREGIDO]`

`next.config.js` no configuraba ningún **HTTP Security Header** para las páginas de la aplicación. Esto expone a los usuarios a múltiples vectores de ataque:

| Header faltante | Riesgo |
|---|---|
| `Content-Security-Policy` | XSS; carga de scripts de terceros maliciosos |
| `X-Frame-Options` | Clickjacking |
| `X-Content-Type-Options` | MIME-type sniffing attacks |
| `Strict-Transport-Security` | Downgrade de HTTPS a HTTP (man-in-the-middle) |
| `Referrer-Policy` | Filtración de URL completa al navegar a otras páginas |
| `Permissions-Policy` | Acceso no restringido a cámara, geolocalización y micrófono |

**Corrección aplicada:** todos los headers añadidos en `next.config.js`. La directiva `connect-src` de la CSP limita las conexiones de red únicamente a los dominios de Open-Meteo, previniendo exfiltración de datos a dominios no autorizados.

```js
// Fragmento de la CSP aplicada:
"connect-src 'self' https://geocoding-api.open-meteo.com https://api.open-meteo.com"
```

---

### 🟡 A09 — Fallo en Logging y Monitoreo `[CORREGIDO]`

`useWeather.ts` ejecutaba `console.error(...)` incondicionalmente, exponiendo **stack traces y mensajes de error internos** en la consola del navegador del usuario en producción. Esto puede revelar detalles de implementación útiles para un atacante (information disclosure).

**Corrección aplicada:** el log ahora está condicionado a `NODE_ENV === "development"`:

```diff
- console.error("Error fetching weather:", err);
+ if (process.env.NODE_ENV === "development") {
+   console.error("Error fetching weather:", err);
+ }
```

---

### ✅ A03 — Injection `[SIN RIESGO]`

- `validateCityInput()` aplica: verificación de tipo, trim, longitud máxima (100 chars) y rechazo de dígitos.
- Los parámetros de API se envían mediante el objeto `params` de axios (URL-encoding automático, sin concatenación de strings).
- React escapa todo el output renderizado por defecto.
- No se usa `dangerouslySetInnerHTML` en ningún componente.

---

### ✅ A02 — Fallos Criptográficos `[SIN RIESGO]`

Todas las variables de entorno son `NEXT_PUBLIC_*` y solo contienen URLs públicas y configuración no sensible. No hay API keys, tokens ni secretos en el repositorio ni en `.env.local`.

> `.env.local` está correctamente incluido en `.gitignore`.

---

### ✅ A01 / A07 — Control de Acceso / Autenticación `[N/A]`

La aplicación es pública y no tiene sistema de autenticación ni rutas protegidas. No aplica.

---

## 2. Licencias de Dependencias

| Librería | Versión | Licencia | Uso Comercial |
|---|---|---|---|
| `react`, `react-dom` | 19.2.4 | MIT | ✅ Permitido |
| `next` | 15.5.15 | MIT | ✅ Permitido |
| `axios` | 1.15.0 | MIT | ✅ Permitido |
| `clsx` | 2.0.0 | MIT | ✅ Permitido |
| `class-variance-authority` | 0.7.0 | Apache 2.0 | ✅ Permitido (requiere conservar aviso de licencia en distribuciones) |
| `tailwindcss` | 3.4.0 | MIT | ✅ Permitido |
| `postcss` | 8.4.31 | MIT | ✅ Permitido |
| `eslint` | 8.56.0 | MIT | ✅ Permitido |
| `prettier` | 3.1.0 | MIT | ✅ Permitido |
| `typescript` | 5.x | Apache 2.0 | ✅ Permitido |
| `jest`, `ts-jest` | 29.x | MIT | ✅ Permitido |
| `@testing-library/*` | — | MIT | ✅ Permitido |
| `@types/*` | — | MIT | ✅ Permitido |

### ⚠️ Excepción Importante: API de Open-Meteo

La API externa consumida ([open-meteo.com](https://open-meteo.com)) es **gratuita únicamente para proyectos open-source y uso no comercial**, según sus [Términos de Servicio](https://open-meteo.com/en/terms).

**Si la aplicación es desplegada con fines comerciales** (genera ingresos, forma parte de un SaaS, o se integra en un producto empresarial), se **requiere una suscripción comercial de pago** con Open-Meteo. Operar en modo comercial sin dicha suscripción constituye una **violación de los términos de uso de la API**.

> **Acción requerida antes de cualquier deployment comercial:** contactar a Open-Meteo para adquirir plan comercial, o evaluar alternativas como OpenWeatherMap (plan gratuito con límites más amplios) o WeatherAPI.

---

## 3. Privacidad de Datos del Usuario

### Estado actual

| Aspecto | Estado |
|---|---|
| Datos personales (PII) recolectados | ✅ Ninguno — solo nombre de ciudad |
| Cookies de tracking o analytics | ✅ No hay |
| Telemetría / SDKs de terceros | ✅ No hay |
| `sessionStorage` | ⚠️ Almacena datos de clima (ciudad + meteorología); sin PII pero sin consentimiento informado |
| IP del usuario enviada a terceros | ⚠️ Sí — a `geocoding-api.open-meteo.com` y `api.open-meteo.com` en cada búsqueda |
| Aviso de privacidad al usuario | ❌ No existe |
| Política de Privacidad | ❌ No existe |

### Riesgo GDPR

Aunque Open-Meteo declara no almacenar IPs de forma persistente, la aplicación **transfiere datos a un tercero fuera del control del usuario sin informarle**. Para usuarios de la Unión Europea, esto puede constituir un incumplimiento del **GDPR, Art. 13 y 14**, que exigen:

1. Informar al usuario qué datos se transfieren, a quién y con qué finalidad.
2. Ofrecer una base legal para el tratamiento (interés legítimo o consentimiento).

### Acciones recomendadas (pendientes)

- [ ] Añadir un banner/footer con enlace a política de privacidad antes del deployment en producción.
- [ ] Redactar una política de privacidad que describa la transferencia de IP a Open-Meteo.
- [ ] Evaluar si se requiere un banner de consentimiento según la jurisdicción de los usuarios objetivo.

---

## 4. Resumen de Cambios Aplicados

| Archivo | Cambio | Razón |
|---|---|---|
| `package.json` | `axios` 1.7.0 → 1.15.0 | Eliminar CVE HIGH (SSRF) y 4 CVEs adicionales |
| `next.config.js` | Añadir CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | A05 Security Misconfiguration |
| `src/hooks/useWeather.ts` | `console.error` condicionado a `NODE_ENV === "development"` | A09 Information disclosure en producción |

---

## 5. Vulnerabilidades Residuales (no corregidas en esta auditoría)

| Paquete | Severidad | Motivo de no corrección |
|---|---|---|
| `jest-environment-jsdom` 27–30 (via `@tootallnate/once`) | Low | La corrección (`npm audit fix --force`) instala `jest-environment-jsdom@30` que es un **breaking change** en la configuración de Jest. Requiere validación manual antes de aplicar. Solo afecta al entorno de test, no a producción. |

---

*Generado el 16/04/2026 · Weather App v0.1.0*
