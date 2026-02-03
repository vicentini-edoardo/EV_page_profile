(function (global) {
  const qs = (sel, scope) => (scope || document).querySelector(sel);
  const qsa = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const on = (el, event, handler, opts) => el && el.addEventListener(event, handler, opts);

  global.DOM = { qs, qsa, on };
})(window);
