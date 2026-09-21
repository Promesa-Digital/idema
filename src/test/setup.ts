import '@testing-library/jest-dom/vitest'

// jsdom no implementa scrollIntoView. Cualquier componente que mantenga visible la
// opción resaltada al navegar con el teclado revienta sin este relleno.
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {})
