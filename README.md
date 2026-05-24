# BancoXYZ - Banca Móvil 📱💸

![React Native](https://img.shields.io/badge/React_Native-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)

Es una aplicación móvil transaccional de banca digital desarrollada con **React Native** y **Expo Router**. La plataforma permite a los usuarios autenticarse de forma segura, visualizar su saldo disponible en tiempo real, realizar transferencias inmediatas o programadas, e inspeccionar su historial de movimientos mediante un sistema avanzado de filtrado cruzado.

```text
██████╗  █████╗ ███╗   ██╗ ██████╗ ██████╗ L █ L   L █ L   L █ L
██╔══██╗██╔══██╗████╗  ██║██╔════╝██╔═══██╗  \ \     \ \     \ \
██████╔╝███████║██╔██╗ ██║██║     ██║   ██║   \ \     \ \     \ \
██╔══██╗██╔══██║██║╚██╗██║██║     ██║   ██║    \ \     \ \     \ \
██████╔╝██║  ██║██║ ╚████║╚██████╗╚██████╔╝   (_X_)   (_Y_)   (_Z_)
╚══════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═════╝  [#a5c5f5][#0052cc][#de350b]
 ─────────────────── BANCO XYZ ───────────────────
```

---

## 🚀 Características Clave y Funcionalidades

- **Autenticación Segura (JWT):** Inicio de sesión integrado con APIs de verificación y persistencia de sesión cifrada localmente a través de `expo-secure-store`.
- **Dashboard Financiero (`HomeScreen`):** Tarjeta reactiva de visualización de Saldo Disponible con formato nativo de moneda brasileña (`BRL`).
- **Módulo de Transferencias (`TransferScreen`):**
  - Envío inmediato o agendamiento a futuro mediante un componente nativo `DateTimePicker`.
  - Validación local de fondos insuficientes en tiempo real.
  - Sincronización asíncrona de datos reactivos de sesión.
- **Historial de Movimientos Avanzado (`HistoryScreen`):**
  - Motor de filtrado combinatorio simultáneo por **Nombre**, **Rango de montos (Mínimo / Máximo)** y **Fecha**.
  - Mecanismo inteligente de clonación de nombres (escanea transferencias previas para emparejar documentos con nombres reales).
- **UI/UX Consistente:** Paleta de colores corporativa (`#0052cc`, `#a5c5f5`, `#de350b`), layouts con áreas seguras nativas y tipografía de alto contraste.

---

## 🛠️ Stack Tecnológico Utilizado

- **Framework Base:** React Native (vía Expo SDK).
- **Enrutamiento Nativo:** Expo Router (File-based routing con estructuras `(home)` de Layout protegido).
- **Gestión de Estado:** React Context API (`AuthContext`) actuando como Single Source of Truth.
- **Cliente HTTP:** Axios configurado con Interceptores automáticos de cabeceras `Authorization: Bearer <token>`.
- **Manejo de Fechas:** `date-fns` para normalización y parseo de ISO strings.
- **Suite de Pruebas:** Jest y `@testing-library/react-native`.

---

## 🧠 Arquitectura y Solución de Retos Técnicos

Durante el desarrollo se identificaron y solucionaron desafíos críticos para el negocio:

### 1. Corrección de Contrato de API (Typo en el Endpoint)

La documentación técnica del examen especificaba la llave `"payeer Document"` (con espacio) para la estructura del cuerpo en `POST /transfer`. Mediante pruebas de bisección en el entorno de desarrollo, se descubrió un error de digitación (_typo_) en el servidor de evaluación de AWS. El código fue blindado utilizando la estructura correcta y tipada bajo **`payeerDocument`** en formato _CamelCase_, logrando un procesamiento de transacciones exitoso (`200 OK`).

### 2. Sincronización Local Reactiva sin Estado Inconsistente

Debido a que las APIs de evaluación operan bajo entornos _stateless/mock_ (los endpoints `GET` devuelven listados fijos preconfigurados en AWS Lambda y no persisten los datos del `POST`), se diseñó un mecanismo de sincronización paralela en memoria RAM mediante el contexto de autenticación. Tras un envío exitoso, la app descuenta el balance de forma síncrona e inyecta la nueva transferencia en la cima del historial de transacciones local, garantizando una UX idéntica a un entorno real.

---

## 📦 Instalación y Configuración

Sigue estos pasos para clonar y ejecutar el entorno de desarrollo de forma local:

1. **Clonar el repositorio:**

   ```bash
   git clone [https://github.com/danielfduenas/BancoXYZ](https://github.com/danielfduenas/BancoXYZ)
   cd BancoXYZ
   ```

2. **Instalar dependencias del ecosistema:**

   ```bash
   npm install
   ```

3. **Vincular utilidades nativas de Expo:**

   ```bash
   npx expo install expo-secure-store @react-native-community/datetimepicker
   ```

4. **Iniciar el servidor de Metro:**
   ```bash
   npx expo start
   ```

> **Tip de Ejecución:** Puedes presionar la tecla `a` en tu terminal para abrir el emulador de Android, `i` para el simulador de iOS, o escanear el código QR con la app de Expo Go en tu dispositivo móvil real.

---

## 🧪 Ejecución de Pruebas Unitarias (Jest)

La aplicación cuenta con cobertura de pruebas unitarias para blindar las reglas de negocio, renderizado de componentes y contratos de peticiones asíncronas HTTP.

Para correr toda la suite de pruebas automatizadas, ejecuta:

```bash
npm test
```

### Escenarios Evaluados en los Tests:

- **`authContext.test.tsx`**: Persistencia de tokens en almacenamiento cifrado y manejo de sesiones caducadas (`401 Unauthorized`).
- **`homeScreen.test.tsx`**: Carga reactiva del balance y redirecciones de seguridad.
- **`transferScreen.test.tsx`**: Validaciones del formulario de envío, comportamiento del switch de programación, y verificación del contrato HTTP enviando `payeerDocument`.
- **`historyScreen.test.tsx`**: Comportamiento aislado del motor de filtrado por rangos y recarga limpia.

---

## 👥 Desarrollador

- **Daniel Felipe Dueñas Rodríguez** - _Full Stack & Mobile Software Developer_
