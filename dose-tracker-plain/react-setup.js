// React itself is loaded as a plain global via <script> tags in index.html
// (the classic, build-free way React has always been usable from a CDN).
// htm gives us JSX-like syntax using plain template literals — no Babel,
// no compiler, just a tiny library that turns `html\`<div>...</div>\``
// into the same React.createElement(...) calls JSX would have produced.
import htm from 'https://esm.sh/htm@3.1.1';

export const html = htm.bind(React.createElement);
