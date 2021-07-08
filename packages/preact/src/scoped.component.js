import { Component, toChildArray, isValidElement, Fragment, cloneElement } from 'preact';
import { createPortal } from 'preact/compat';
import { styleTags, newCssState } from 'kremling-core';

const preactSupportsReturningArrays = !!createPortal;

export class Scoped extends Component {
  static defaultNamespace = 'kremling'

  constructor(props) {
    super(props);
    this.state = {};
    if (!props.css) throw Error(`Kremling's <Scoped /> component requires the 'css' prop.`);
    if (typeof props.css === 'object' && (
      typeof props.css.id !== 'string' ||
      typeof props.css.styles !== 'string')
    ) throw Error(`Kremling's <Scoped /> component requires either a string or an object with "id" and "styles" properties.`);
    this.state = newCssState(props, Scoped.defaultNamespace)
  }

  addKremlingAttributeToChildren = (children) => {
    return (toChildArray(children)).map(child => {
      if (isValidElement(child)) {
        if (child.type === Fragment && Fragment) {
          const fragmentChildren = this.addKremlingAttributeToChildren(child.props.children);
          return cloneElement(child, {}, fragmentChildren);
        } else {
          console.log('here', {[this.state.kremlingAttr]: this.state.kremlingAttrValue})
          return cloneElement(child, {[this.state.kremlingAttr]: this.state.kremlingAttrValue});
        }
      } else {
        return child;
      }
    });
  }

  render() {
    if (
      this.props.children === undefined ||
      this.props.children === null ||
      this.props.children === false ||
      this.props.children === true
    ) {
      return null;
    }

    const kremlingChildren = this.addKremlingAttributeToChildren(this.props.children);

    if (preactSupportsReturningArrays) {
      return kremlingChildren;
    } else {
      if (kremlingChildren.length > 1) {
        throw new Error(`kremling's <Scoped /> component requires exactly one child element unless you are using preact@>=10`);
      } else if (kremlingChildren.length === 1) {
        return kremlingChildren[0];
      } else {
        return null;
      }
    }
  }

  componentDidUpdate(prevProps) {
    const oldCss = prevProps.postcss || prevProps.css
    const newCss = this.props.postcss || this.props.css
    if (
      oldCss !== newCss ||
      oldCss.id !== newCss.id ||
      oldCss.styles !== newCss.styles ||
      oldCss.namespace !== newCss.namespace
    ) {
      this.doneWithCss()
      this.setState(this.newCssState(this.props))
    }
  }

  componentWillUnmount() {
    this.doneWithCss()
  }

  doneWithCss = () => {
    if (this.state.styleRef && --this.state.styleRef.kremlings === 0) {
      delete styleTags[this.state.rawCss];
      this.state.styleRef.parentNode.removeChild(this.state.styleRef);
    }
  }
}
