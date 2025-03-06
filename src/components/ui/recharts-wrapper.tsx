"use client"

import React from 'react';

/**
 * This component serves as a wrapper for Recharts components to prevent
 * React DOM prop warnings. It filters out non-DOM props that Recharts
 * tries to pass to DOM elements.
 */
export function RechartsWrapper({ 
  component: Component, 
  children,
  ...props 
}: { 
  component: React.ElementType; 
  children?: React.ReactNode;
  [key: string]: unknown;
}) {
  // Include valid DOM and SVG props
  const validDOMProps = [
    // Common HTML attributes
    'id', 'className', 'style', 'onClick', 'onMouseEnter', 'onMouseLeave',
    'onMouseMove', 'onMouseOver', 'onMouseOut', 'onKeyDown', 'onKeyUp',
    'onKeyPress', 'tabIndex', 'role', 'aria-label', 'aria-labelledby',
    'aria-describedby', 'aria-hidden', 'data-testid',
    
    // SVG specific attributes
    'x', 'y', 'cx', 'cy', 'r', 'width', 'height', 'fill', 'stroke',
    'strokeWidth', 'strokeDasharray', 'strokeLinecap', 'strokeLinejoin',
    'strokeOpacity', 'fillOpacity', 'opacity', 'd', 'points',
    'viewBox', 'transform', 'textAnchor', 'dominantBaseline',
    'alignmentBaseline', 'baselineShift', 'fontSize', 'fontFamily',
    'fontWeight', 'textDecoration', 'letterSpacing', 'wordSpacing'
  ];
  
  // Create a new props object with only valid DOM props
  const domProps: Record<string, unknown> = {};
  
  Object.keys(props).forEach(key => {
    if (validDOMProps.includes(key) || key.startsWith('data-') || key.startsWith('aria-')) {
      domProps[key] = props[key];
    }
  });
  
  return <Component {...domProps}>{children}</Component>;
}
