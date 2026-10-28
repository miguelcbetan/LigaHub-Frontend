<div align="center">

<img src="public/logo.png" alt="Logo de LigaHub" width="110" />

# LigaHub — Frontend

**Panel de administración de seguridad (usuarios, roles, permisos y matriz de acceso) conectado en tiempo real al microservicio `ms-security`.**

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Backend-Spring_Boot-6DB33F?logo=springboot&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT_Bearer-000000?logo=jsonwebtokens&logoColor=white)

</div>

---

## Tabla de contenido

- [Descripción](#descripción)
- [Funcionalidades](#funcionalidades)
- [Tecnologías](#tecnologías)
- [Arquitectura y funcionamiento](#arquitectura-y-funcionamiento)
- [Integración con el backend](#integración-con-el-backend)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Solución de problemas](#solución-de-problemas)

## Descripción

LigaHub Frontend es la interfaz web del sistema de gestión de seguridad de LigaHub. Consume la API REST de **ms-security** (Spring Boot + MySQL) para administrar quién puede entrar al sistema y qué puede hacer cada persona.

Lo más importante: **la interfaz se adapta a los permisos reales del usuario autenticado**. El backend decide qué rutas y métodos puede invocar cada rol, y el frontend lo refleja ocultando módulos, bloqueando rutas y cargando solo los datos que el usuario tiene derecho a consultar.

## Funcionalidades

| Módulo | Qué permite |
| --- | --- |
| **Autenticación** | Inicio de sesión con JWT, registro público de usuarios, cierre de sesión automático al expirar el token. |
| **Camerino (Dashboard)** | Resumen con totales de usuarios, roles y permisos, cobertura de permisos por rol y últimos usuarios registrados. |
| **Usuarios** | Listado con búsqueda, alta, edición, eliminación, activar/desactivar, detalle con perfil y asignación de roles. |
| **Roles** | CRUD de roles, detalle de cada rol y administración de los usuarios que lo tienen. |
| **Permisos** | CRUD de permisos (URL + método HTTP + módulo) con detalle y badges por método. |
| **Matriz de permisos** | Edición visual de qué permisos tiene cada rol; solo se envían al servidor los cambios (diff). |
| **Mi perfil** | Edición de teléfono y fecha de nacimiento del usuario autenticado. |
| **Experiencia** | Modo claro/oscuro, diseño responsive, notificaciones (toasts), diálogos de confirmación y estados vacíos/de carga. |

## Tecnologías

| Capa | Tecnología | Uso |
| --- | --- | --- |
| Framework | [Next.js 15](https://nextjs.org/) (App Router) | Enrutamiento, layouts por grupo de rutas `(auth)` y `(dashboard)`. |
| UI | [React 19](https://react.dev/) | Componentes y estado mediante Context API. |
| Lenguaje | [TypeScript 5](https://www.typescriptlang.org/) | Tipado estricto (`strict: true`) de DTOs, contextos y componentes. |
| Estilos | [Tailwind CSS 4](https://tailwindcss.com/) | Sistema de diseño propio con soporte de tema oscuro. |
| Iconos | [Lucide React](https://lucide.dev/) | Iconografía de la interfaz. |
| Utilidades | [clsx](https://github.com/lukeed/clsx) | Composición condicional de clases. |
| Comunicación | `fetch` nativo | Cliente HTTP propio (`src/lib/api/http.ts`), sin dependencias extra. |
| Backend | Spring Boot 4 · Java 17 · Spring Security (OAuth2 Resource Server) · JPA · MySQL | Servicio `ms-security` al que se conecta este frontend. |

## Arquitectura y funcionamiento

```text
┌──────────────────────────── Navegador ────────────────────────────┐
│                                                                   │
│  Páginas (App Router)  ──►  Componentes de features / UI          │
│          │                                                        │
│          ▼                                                        │
│  AuthContext  ── sesión, token, usuario y permisos (/auth/me)     │
│  DataContext  ── usuarios, roles, permisos, matriz (CRUD)         │
│          │                                                        │
│          ▼                                                        │
│  lib/api/*  ── un módulo por controlador del backend              │
│          │       └─ http.ts: Bearer token + errores normalizados  │
└──────────┼────────────────────────────────────────────────────────┘
           │  HTTP / JSON  (CORS permitido para http://localhost:3000)
           ▼
   ms-security  (Spring Boot · :8181)  ──►  MySQL (security_ms_db)
```

### Flujo de sesión

1. El usuario envía correo y contraseña a `POST /api/auth/login`.
2. El backend responde con un JWT (`accessToken`, `expiresAt`). No hay refresh token.
3. El frontend guarda la sesión en `localStorage` (si se marca "mantener sesión") o en `sessionStorage`.
4. Con el token se consulta `GET /api/auth/me`, que devuelve la identidad, los roles y los **permisos efectivos** (método + URL + módulo).
5. Cada petición posterior lleva `Authorization: Bearer <token>`.
6. Si el token expira, se borra del storage o el servidor responde `401`, la sesión se cierra y se redirige a `/login`.

### Control de acceso dirigido por permisos

- `src/lib/access.ts` convierte los permisos del usuario en reglas (`hasModule`, `hasUrl`).
- `src/lib/navigation.ts` usa esas reglas para mostrar solo los ítems de menú permitidos y bloquear rutas no autorizadas.
- `DataContext` solo solicita cada colección (usuarios, roles, permisos, matriz) si el rol tiene permisos sobre ese módulo, evitando respuestas `403` innecesarias.
- Un usuario sin roles ve el Camerino vacío ("Aún estás en el vestuario") hasta que un administrador le asigne uno.

### Manejo de errores

`src/lib/api/http.ts` unifica los tres formatos de error del backend en un único `ApiError`:

| Origen | Formato | Resultado en el frontend |
| --- | --- | --- |
| `GlobalExceptionHandler` | `{ errorCase, message }` | Mensaje del servidor. |
| Validaciones (`400`) | `{ campo: mensaje }` | `fieldErrors` por campo en los formularios. |
| Filtro de seguridad (`401` / `403`) | Cuerpo vacío | Mensaje por defecto; el `401` cierra la sesión. |
| Servidor caído | Fallo de red | Aviso para verificar que `ms-security` esté activo. |

## Integración con el backend

Cada archivo de `src/lib/api/` corresponde a un controlador de `ms-security`.

| Módulo del frontend | Recurso | Operaciones |
| --- | --- | --- |
| `auth.ts` | `/api/auth/login`, `/api/auth/me`, `POST /api/users` (registro) | Login, identidad actual, registro público |
| `users.ts` | `/api/users` | CRUD, cambio de estado, detalle con perfil, sesiones y roles |
| `profiles.ts` | `/api/profile/me`, `/api/users/{id}/profile` | Consultar, crear, actualizar y eliminar perfil |
| `roles.ts` | `/api/roles` | CRUD y detalle con permisos |
| `permissions.ts` | `/api/permissions` | CRUD |
| `user-roles.ts` | `/api/user-roles` | Asignar y quitar roles a usuarios |
| `role-permissions.ts` | `/api/role-permissions` | Asignar y quitar permisos a roles (matriz) |
| `sessions.ts` | `/api/users/{id}/sessions` | CRUD de sesiones de un usuario |

`src/lib/api/adapters.ts` traduce los DTOs del backend a los tipos que usa la interfaz (ids numéricos ↔ ids de UI, módulos derivados de los permisos, etc.).

> **Requisitos de contraseña** (validados también en el cliente para evitar un `400`): entre 8 y 72 caracteres, sin espacios, con mayúscula, minúscula, número y uno de `@$!%*?&`.

## Estructura del proyecto

```text
frontend/
├─ public/                      # Logos e imágenes estáticas
└─ src/
   ├─ app/
   │  ├─ (auth)/                # login · registro · recuperar · verificar-2fa
   │  ├─ (dashboard)/           # dashboard · usuarios · roles · permisos · matriz · perfil
   │  ├─ layout.tsx             # Layout raíz y proveedores globales
   │  └─ globals.css            # Tema y tokens de diseño
   ├─ components/
   │  ├─ ui/                    # Sistema de diseño: Button, Modal, DataTable, Field…
   │  ├─ layout/                # AppShell, Sidebar, Topbar, ThemeToggle, Logo
   │  └─ features/              # Componentes por dominio: auth, users, roles, permissions, matrix
   ├─ context/                  # AuthContext · DataContext · ThemeContext · ToastContext
   ├─ hooks/                    # useDisclosure · usePermissionMatrix
   ├─ lib/
   │  ├─ api/                   # Cliente HTTP, módulos por controlador, DTOs y adaptadores
   │  ├─ access.ts              # Reglas de acceso según permisos del usuario
   │  ├─ navigation.ts          # Menú y rutas protegidas por permiso
   │  ├─ jwt.ts                 # Decodificación de claims del token
   │  └─ constants.ts           # Operaciones, métodos HTTP, reglas de contraseña
   ├─ types/                    # Tipos de dominio del frontend
   └─ utils/                    # cn, formato y fortaleza de contraseña
```

## Puesta en marcha

### Requisitos

- **Node.js 18.18** o superior y **npm**
- **ms-security** en ejecución (Java 17+, Maven y MySQL en `localhost:3306`)

### 1. Levantar el backend

Desde la carpeta del microservicio:

```bash
cd ms-security/ms_security
./mvnw spring-boot:run      # En Windows (CMD/PowerShell): mvnw.cmd spring-boot:run
```

Por defecto el backend escucha en `http://localhost:8181`, usa la base de datos `security_ms_db` y acepta peticiones desde `http://localhost:3000` (`security.cors.allowed-origins`).

### 2. Levantar el frontend

```bash
git clone https://github.com/MiguelAngelCruzBetancourt/LigaHub.git
cd LigaHub
npm install
cp .env.example .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) e inicia sesión con un usuario existente en la base de datos del backend.

### 3. Build de producción

```bash
npm run build
npm run start
```

## Variables de entorno

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8181` | URL base de `ms-security`. Si cambias el puerto o el host del backend, actualiza también `security.cors.allowed-origins` en su configuración. |

Las variables `NEXT_PUBLIC_*` se incrustan en el build: reinicia `npm run dev` o vuelve a ejecutar `npm run build` tras modificarlas.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente. |
| `npm run build` | Compila la aplicación para producción. |
| `npm run start` | Sirve la versión de producción generada con `build`. |

## Solución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| "No se pudo contactar el servidor" | `ms-security` no está en ejecución o usa otro puerto. | Inicia el backend y revisa `NEXT_PUBLIC_API_BASE_URL`. |
| Error de CORS en la consola | El origen del frontend no está permitido. | Ajusta `security.cors.allowed-origins` en el backend. |
| Aparece "Aún estás en el vestuario" | El usuario no tiene roles o sus roles no tienen permisos. | Asigna un rol con permisos desde un usuario administrador. |
| Se cierra la sesión sola | El token expiró (≈15 min) o fue modificado en el storage. | Vuelve a iniciar sesión. |
| Error `400` al crear usuario | La contraseña no cumple el patrón requerido. | Usa 8–72 caracteres con mayúscula, minúscula, número y `@$!%*?&`. |

---

<div align="center">

Hecho con Next.js, React y TypeScript · LigaHub

</div>
