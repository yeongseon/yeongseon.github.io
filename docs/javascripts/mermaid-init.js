(function () {
  function render() {
    if (window.mermaid) {
      window.mermaid.initialize({ startOnLoad: false });
      window.mermaid.run({ querySelector: ".mermaid" });
    }
  }
  if (typeof document$ !== "undefined") {
    document$.subscribe(render);
  } else {
    document.addEventListener("DOMContentLoaded", render);
  }
})();
