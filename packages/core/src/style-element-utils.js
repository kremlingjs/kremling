let counter = 0;

export const incrementCounter = () => counter++

// For tests
export function resetState() {
  counter = 0;
  styleTags = {}
}

export let styleTags = {}

export function transformCss(css, kremlingSelector) {
  return css.replace(/& ([^{}])+{/g, (match, cssRule) => {
    return match
      .split(",") // multiple rules on the same line split by a comma
      .map(cssSplit => {
        cssSplit = cssSplit.trim();

        // ignore css rules that don't begin with '&'
        if (cssSplit.indexOf('&') === -1) return cssSplit.replace('{', '').trim();

        cssSplit = (/[^&](.+)[^{]+/g).exec(cssSplit)[0].trim();

        let builtIn = false;
        if (!/^([.#]\w+)/.test(cssSplit)) {
          builtIn = true;
        }
        // if it's not a built-in selector, prepend the data attribute. Otherwise, append
        return !builtIn
          ? `${kremlingSelector} ${cssSplit}, ${kremlingSelector}${cssSplit}`
          : `${kremlingSelector} ${cssSplit}, ${cssSplit}${kremlingSelector}`;
      })
      .join(", ") + ' {';
  });
}

export function newCssState(props, defaultNamespace) {
  const css = props.postcss || props.css
  const cssIsBuilt = Boolean(css && css.id)
  const namespace = (cssIsBuilt ? css.namespace : props.namespace) || defaultNamespace;
  const rawCss = cssIsBuilt ? css.styles : css

  let styleRef, kremlingAttr, kremlingAttrValue

  if (!cssIsBuilt) {
    if (typeof css !== 'string') {
      return
    }

    if (css.indexOf("&") < 0 && css.trim().length > 0) {
      const firstRule = css.substring(0, props.css.indexOf("{")).trim();
      console.warn(
        `Kremling's <Scoped css="..."> css prop should have the '&' character in it to scope the css classes: ${firstRule}`
      );
    }
  }

  const existingDomEl = styleTags[rawCss];

  if (existingDomEl) {
    styleRef = existingDomEl;
    existingDomEl.kremlings++;
    kremlingAttr = styleRef.kremlingAttr;
    kremlingAttrValue = styleRef.kremlingValue;
  } else {
    // The attribute for namespacing the css
    kremlingAttr = namespace;
    kremlingAttrValue = cssIsBuilt ? css.id : incrementCounter();

    // The css to append to the dom
    const kremlingSelector = `[${kremlingAttr}="${kremlingAttrValue}"]`;
    const transformedCSS = cssIsBuilt ? rawCss : transformCss(rawCss, kremlingSelector)

    // The dom element
    const el = document.createElement('style');
    el.setAttribute('type', 'text/css');
    el.textContent = transformedCSS;
    el.kremlings = 1;
    el.kremlingAttr = kremlingAttr;
    el.kremlingValue = kremlingAttrValue;
    document.head.appendChild(el);
    styleTags[rawCss] = el;
    styleRef = el;
  }

  return {
    cssIsBuilt,
    rawCss,
    styleRef,
    kremlingAttr,
    kremlingAttrValue,
  };
}