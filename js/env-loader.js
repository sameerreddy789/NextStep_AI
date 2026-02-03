/**
 * Environment Loader
 * Safely exposes Vite environment variables to the global window.ENV object.
 * This file must be loaded with type="module" to access import.meta.env.
 */

window.ENV = window.ENV || {};

if (import.meta.env) {
    Object.assign(window.ENV, import.meta.env);
    console.log('Environment variables loaded from Vite');
}
