(() => {
  if (window.parent === window) {
    return;
  }

  const expectedOrigin = location.protocol === 'file:' ? 'null' : location.origin;

  function reportSize() {
    const style = getComputedStyle(document.body);
    const height = Math.ceil(document.body.getBoundingClientRect().height
      + parseFloat(style.marginTop) + parseFloat(style.marginBottom));

    window.parent.postMessage({ type: 'pocket-monkey:specimen-size', height }, expectedOrigin === 'null' ? '*' : expectedOrigin);
  }

  window.addEventListener('message', event => {
    if (event.source === window.parent && event.origin === expectedOrigin && event.data?.type === 'pocket-monkey:measure-specimen') {
      reportSize();
    }
  });

  new ResizeObserver(reportSize).observe(document.body);
  document.fonts.ready.then(reportSize);
  window.addEventListener('load', reportSize);
  reportSize();
})();