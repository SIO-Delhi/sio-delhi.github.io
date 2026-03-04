import React, { useMemo } from 'react';
import rawSvg from '../../assets/Form_Banner.svg?raw';

interface FormFooterProps {
  bgColor?: string;
  textColor?: string;
  patternColor?: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}

/**
 * Renders Form_Banner.svg inline and applies dynamic colors to its styling.
 * Canvas: 1080×297.3 — Banner rect: x=57.6 y=106.8 w=964.8 h=83
 */
export const FormFooter: React.FC<FormFooterProps> = ({ 
  className, 
  style,
  bgColor = '#6a63fe',
  patternColor = '#6e6ef9',
  textColor = '#fdedcb'
}) => {
  const coloredSvg = useMemo(() => {
    let svg = rawSvg;
    
    // Replace styles for the theme customization
    svg = svg.replace(/fill:\s*#6a63fe;/gi, `fill: ${bgColor};`);
    svg = svg.replace(/fill:\s*#6e6ef9;/gi, `fill: ${patternColor};`);
    svg = svg.replace(/fill:\s*#fff;/gi, `fill: ${textColor};`);
    
    // Replace the viewBox so it crops exactly to the banner rect visually 
    // when setting dangerouslySetInnerHTML on a responsive container
    svg = svg.replace(/viewBox="0 0 1080 297\.3"/, 'viewBox="57.6 106.8 964.8 83"');

    // Make sure SVG scales cleanly
    svg = svg.replace(/<svg/, `<svg preserveAspectRatio="xMidYMid slice" style="display:block; width:100%; height:100%;"`);
    
    return svg;
  }, [bgColor, patternColor, textColor]);

  return (
    <div
      className={className}
      style={{ 
        display: 'block', 
        borderRadius: '12px', 
        overflow: 'hidden',
        width: '100%',
        aspectRatio: '964.8 / 83',
        ...style 
      }}
      dangerouslySetInnerHTML={{ __html: coloredSvg }}
    />
  );
};
