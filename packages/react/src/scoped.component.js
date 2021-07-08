import React from 'react';
import { createPortal } from 'react-dom';
import { styleTags, newCssState } from 'kremling-core';

const reactSupportsReturningArrays = !!createPortal;

export class Scoped extends React.Component {
  static defaultNamespace = 'kremling'

  constructor(props) {
    super(props);
    this.state = {};
    console.log('props', props);
    if (!props.css) throw Error(`Kremling's <Scoped /> component requires the 'css' prop.`);
    if (typeof props.css === 'object' && (
      typeof props.css.id !== 'string' ||
      typeof props.css.styles !== 'string')
    ) throw Error(`Kremling's <Scoped /> component requires either a string or an object with "id" and "styles" properties.`);
    this.state = newCssState(props, Scoped.defaultNamespace)
  }

  addKremlingAttributeToChildren = (children) => {
    return React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        if (child.type === React.Fragment && React.Fragment) {
          const fragmentChildren = this.addKremlingAttributeToChildren(child.props.children);
          return React.cloneElement(child, {}, fragmentChildren);
        } else {
          return React.cloneElement(child, {[this.state.kremlingAttr]: this.state.kremlingAttrValue});
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

    if (reactSupportsReturningArrays) {
      return kremlingChildren;
    } else {
      // React 15 or below
      if (kremlingChildren.length > 1) {
        throw new Error(`kremling's <Scoped /> component requires exactly one child element unless you are using react@>=16`);
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
