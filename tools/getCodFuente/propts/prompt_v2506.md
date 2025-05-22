Aquí tienes un **Prompt Técnico Completo para Reconstrucción del Proyecto** que cualquier IA podría interpretar para regenerar el código actual:

---

### **🔍 PROMPT PARA RECONSTRUCCIÓN DEL PROYECTO**

**Contexto**:  
Desarrollar un sistema web para reproducir audios del Via Crusis con autenticación básica, diseñado específicamente para el Barrio Yacampiz (2025).

---

### **🎯 Requisitos Clave**
1. **Autenticación**:  
   - Clave `VCV2025` vía parámetro GET  
   - Redirección a `error.php` si falla

2. **Estructura**:
   ```
   / (root)
   ├── css/style.css
   ├── incs/{audioFiles,footer,functions,header,kerberos,versionLogs}.php
   ├── media/ (audios MP3)
   ├── index.php
   ├── play.php
   └── serve.php
   ```

3. **Paleta de Colores** (HEX):
   - `#fdf7e3` (fondo)
   - `#806d5a` (header/footer)
   - `#e9d8b7` (botones)
   - `#4a3e31` (texto)

---

### **📜 Especificaciones Técnicas**

#### **1. Base de Datos de Audios** (`incs/audioFiles.php`)
```php
<?php
$audioFiles = [
    [
        'filename' => '101_v2502_La_entrada.mp3',
        'display_name' => '101 - Entrada a Jerusalén',
        'id' => '101_v2502',
        'order' => '0102',
        'short_url' => ''
    ],
    // ... (mínimo 20 entradas)
];
?>
```

#### **2. Componentes Críticos**
- **Header**: Título único "Via Crusis del Barrio Yacampiz - 2025"
- **Footer**: Versión + créditos en una línea
- **Player**:  
  - 100% ancho responsive
  - Controles navegables dentro de la pista
  - Autoplay con detección de bloqueo

#### **3. Funcionalidades Avanzadas**
```javascript
// play.php - Autodetección de autoplay
audio.addEventListener('playing', () => {
    autoplayMessage.style.display = 'none';
});
```

#### **4. Seguridad** (`serve.php`)
- Validar extensiones (.mp3)
- Prevenir directory traversal
- Headers `Content-Range` para streaming

---

### **🎨 Guía de Estilos (CSS)**
**Botones**:
```css
.nav-button {
    transition: all 0.3s ease;
    transform-origin: center;
}
.nav-button:hover {
    transform: scale(1.02);
    box-shadow: 0 3px 6px rgba(0,0,0,0.15);
}
```

**Lista de Audios**:
```css
.song-item:hover {
    transform: translateX(5px);
    background-color: #f0e6d2;
}
```

---

### **⚙️ Configuración del Servidor**
**Requisitos Mínimos**:
- PHP 8.0+
- Headers HTTP:
  ```apache
  AddType audio/mpeg .mp3
  Accept-Ranges bytes
  ```

---

### **📝 Ejemplo de Historial** (`incs/versionLogs.php`)
```php
$versionLogs = [
    '25.5' => [
        'date' => '2025-03-30',
        'changes' => [
            'Rediseño completo del reproductor',
            'Botones inferiores unificados',
            // ...
        ]
    ],
    // ...
];
```

---

### **🔗 Flujo de Navegación**
1. `index.php?key=VCV2025` → Lista audios
2. `play.php?id=ID` → Reproductor
3. Transición automática al finalizar audio

---

### **📌 Notas para la IA**
1. Priorizar:
   - Compatibilidad móvil
   - Accesibilidad (etiquetas ARIA)
   - Optimización de rendimiento

2. Patrones a seguir:
   - Funciones puras en PHP
   - Transiciones CSS hardware-accelerated
   - Validación estricta de inputs

3. Características únicas:
   - Efecto "onda" en botones (`::after`)
   - Animación pulsante en icono WhatsApp
   - Auto-scroll en lista de reproducción

---

Este prompt contiene toda la información necesaria para reconstruir el proyecto desde cero. ¿Necesitas que agregue algún detalle específico sobre algún componente?