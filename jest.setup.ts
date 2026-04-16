/**
 * jest.setup.ts
 * Configuración inicial para tests
 */

import "@testing-library/jest-dom";

// Polyfill para TextEncoder y TextDecoder (requerido por axios)
const { TextEncoder, TextDecoder } = require("util");
if (typeof (global as any).TextEncoder === "undefined") {
  (global as any).TextEncoder = TextEncoder;
}
if (typeof (global as any).TextDecoder === "undefined") {
  (global as any).TextDecoder = TextDecoder;
}

// Mock de window.matchMedia para tests con Tailwind
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
