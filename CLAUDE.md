## Contexto del Proyecto

Este es un proyecto React Native / Expo usando TypeScript. Al sugerir builds o flujos de testing, siempre preferir builds de produccion EAS sobre Expo Go o builds de desarrollo a menos que se pida explicitamente lo contrario.

## Desarrollo de UI

Al hacer cambios de UI (especialmente layout, posicionamiento, o estilos visuales), pedir o referenciar un screenshot/mockup antes de implementar. Si el primer intento no coincide visualmente, preferir enfoques basados en SVG o matematicamente precisos sobre ajuste manual de Bezier.

## Exploracion Antes de Implementar

Antes de hacer cambios en componentes complejos (tab bar, navegacion, SVG, etc.), usar un agente para explorar la implementacion actual, la configuracion de renderizado, y la estructura existente. Resumir que componentes existen y como se componen antes de hacer ningun cambio.

## Testing y Verificacion

Despues de hacer cambios en la app, verificar que el build compile exitosamente ejecutando el comando apropiado de build/type-check antes de commitear. No asumir que el testing con codigo QR / Expo Go funcionara para features que requieran modulos nativos (ej. RevenueCat).
