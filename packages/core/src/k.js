export const css = (strings, ...args) => {
  const evalString = evaluateString(strings, ...args);

  const [id, namespace, styles] = evalString.split('||KREMLING||');
  if (id && namespace && styles) {
    return { id, namespace, styles };
  }
  return evalString;
}

export const cssGlobal = (strings, ...args) => {
  return evaluateString(strings, ...args);
}

function evaluateString(strings, ...args) {
  return strings.map((item, i) => {
    return `${item}${args[i] || ''}`;
  }).join('');
}