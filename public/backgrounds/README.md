# Fondos Dinámicos de Inicio de Sesión (Login)

Esta carpeta contiene las imágenes de fondo que se muestran de manera dinámica (con transición suave / slideshow) en la pantalla de inicio de sesión.

## Cómo agregar o cambiar tus imágenes

1. **Reemplazar las existentes:**
   - Puedes simplemente sobrescribir cualquiera de los siguientes archivos con tus propias fotos:
     - `bg1.jpg` (Fondo 1 - Montañas crepúsculo por defecto)
     - `bg2.jpg` (Fondo 2 - Ciudad / Skyline moderno por defecto)
     - `bg3.jpg` (Fondo 3 - Aurora boreal por defecto)
   
2. **Agregar nuevas imágenes:**
   - Coloca tus imágenes en esta carpeta (formatos recomendados: `.jpg`, `.jpeg`, `.png`, `.webp`, resolución ideal 1920x1080 o superior).
   - Puedes nombrarlas `bg4.jpg`, `bg5.jpg`, etc.
   - En el archivo `src/components/LoginBackgroundSlideshow.tsx`, puedes agregar las rutas en el arreglo `DEFAULT_BACKGROUNDS`:
     ```ts
     const DEFAULT_BACKGROUNDS = [
       "/backgrounds/bg1.jpg",
       "/backgrounds/bg2.jpg",
       "/backgrounds/bg3.jpg",
       "/backgrounds/mi-foto.jpg",
     ];
     ```

El sistema cambiará de fondo automáticamente cada 8 segundos y también cuenta con indicadores interactivos para que el usuario pueda cambiar de fondo con un solo clic.
