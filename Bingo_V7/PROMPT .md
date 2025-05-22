# Propuesta Mejorada para el Sistema de Bingo Interactivo

## Pantalla de CONTROL (Panel de Operador)

### Visualización de Números
- **Historial lateral**: Mostrar los últimos 5 números sorteados en una columna dedicada, con estilo discreto pero legible
- **Formato numérico**: Todos los números mostrados en formato de 2 dígitos (00-90)

### Funcionalidad de Sorteo
- **Modo manual**: Botón tradicional para sacar bolilla con un click
- **Modo automático**: 
  - Selector de intervalo (3, 4 o 5 segundos)
  - Botón de inicio/parada para el modo automático
  - Indicador visual del estado (activo/inactivo)

### Estructura de Acordeón
1. **Datos de la Jugada**:
   - Configuración básica del evento (nombre, descripción)
   - Carga de logo (opcional)

2. **Premios** (sistema de pestañas):
   - **Regla de habilitación**: Solo se puede activar Línea 2 si Línea 1 está habilitada, igual para Línea 3
   - **Nomenclatura fija**: Los premios se llaman siempre "Línea 1", "Línea 2", "Línea 3" y "Bingo"
   - **Configuración por premio**:
     - Descripción editable
     - Selector de imagen (agregar/remover)
     - Estado (habilitado/deshabilitado)

3. **Controles**:
   - Gestión del juego (sorteo, verificación)
   - Configuración del modo automático
   - Reinicio y exportación

## Pantalla de DISPLAY (Visualización Pública)

### Jerarquía Visual
1. **Elementos principales** (máxima prioridad):
   - Bolilla actual (énfasis visual)
   - Tablero de números (00-90)

2. **Elementos secundarios**:
   - Historial de bolillas
   - Información del evento (reducido, discreto)

### Flujo de Verificación
- **Fase de verificación**:
  - No ocultar el tablero principal
  - Mostrar mensaje de verificación superpuesto pero transparente
- **Anuncio de ganador**:
  - Efecto de overlay completo solo al confirmar ganador
  - Animación de destacado
  - Shadow/blur en el fondo

## Implementación Técnica

### Estructura de Archivos
- **CSS**: Un único archivo `bingo-styles.css` con:
  - Estilos para ambas pantallas (control + display)
  - Media queries para responsividad
  - Variables CSS para consistencia visual

- **JavaScript**: Un único archivo `bingo-core.js` con:
  - Lógica compartida
  - Comunicación entre paneles
  - Gestión de estado

### Restricciones
- **Rango numérico**: 00-90 (siempre mostrados con 2 dígitos)
- **Dependencias externas**:
  - Solo librerías esenciales (jsPDF, html2canvas, confetti)
  - Sin frameworks adicionales

### Consideraciones de UX
- Minimizar clicks innecesarios
- Feedback visual claro para todas las acciones
- Transiciones suaves entre estados
- Priorización del contenido según importancia
