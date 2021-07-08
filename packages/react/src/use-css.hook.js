import {useLayoutEffect, useEffect, useState} from 'react'
import {Scoped} from './scoped.component.js'
import {styleTags, incrementCounter, transformCss} from '@kremling/core/src/style-element-utils.js'

export function useCss(css, overrideNamespace) {
  const cssIsPrebuilt = typeof css === 'object'
  if (cssIsPrebuilt && !(css.id && typeof css.styles === 'string')) {
    throw Error(`Kremling's "useCss" hook requires "id" and "styles" properties when using the kremling-loader`)
  }
  const namespace = overrideNamespace || (cssIsPrebuilt && css.namespace) || Scoped.defaultNamespace
  const [styleElement, setStyleElement] = useState(() => getStyleElement(cssIsPrebuilt, css, namespace, true))
  useStyleElement()

  return {
    [styleElement.kremlingAttr]: String(styleElement.kremlingValue).toString(),
  }

  function useStyleElement() {
    useLayoutEffect(() => {
      const newStyleElement = getStyleElement(cssIsPrebuilt, css, namespace)
      setStyleElement(newStyleElement)

      return () => {
        if (--styleElement.kremlings === 0) {
          const rawCss = cssIsPrebuilt ? css.styles : css
          document.head.removeChild(styleElement)
          delete styleTags[rawCss]
        }
      }
    }, [css, namespace, cssIsPrebuilt])
  }
}

function getStyleElement(cssIsPrebuilt, css, namespace, incrementKremingsIfFound = false) {
  const kremlingAttr = cssIsPrebuilt ? namespace : `data-${namespace}`
  const kremlingValue = cssIsPrebuilt ? css.id : incrementCounter()

  let styleElement = cssIsPrebuilt ? styleTags[css.styles] : styleTags[css]

  if (styleElement) {
    // This css is already being used by another instance of the component, or another component altogether.
    if (incrementKremingsIfFound) {
      styleElement.kremlings++
    }
  } else {
    const kremlingSelector = `[${kremlingAttr}='${kremlingValue}']`
    const rawCss = cssIsPrebuilt ? css.styles : css
    const cssToInsert = cssIsPrebuilt ? css.styles : transformCss(css, kremlingSelector)

    styleElement = document.createElement('style')
    styleElement.type = 'text/css'
    styleElement.textContent = cssToInsert
    styleElement.kremlings = 1
    styleElement.kremlingAttr = kremlingAttr
    styleElement.kremlingValue = kremlingValue
    document.head.appendChild(styleElement)

    styleTags[rawCss] = styleElement
  }

  return styleElement
}
