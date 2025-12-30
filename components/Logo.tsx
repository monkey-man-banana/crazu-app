import React from 'react';

// Custom SVG to match the user's logo style:
// Background: Yellow
// Squares: Black (Top Left, Top Right, Bottom Center)
export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`${className} overflow-visible`} xmlns="http://www.w3.org/2000/svg">
    {/* Background */}
    <rect x="0" y="0" width="100" height="100" className="fill-brand-yellow" stroke="black" strokeWidth="0" />
    
    {/* Top Left Square */}
    <rect x="20" y="20" width="25" height="25" className="fill-black" />
    
    {/* Top Right Square */}
    <rect x="55" y="20" width="25" height="25" className="fill-black" />
    
    {/* Bottom Center Square */}
    <rect x="37.5" y="55" width="25" height="25" className="fill-black" />
  </svg>
);

export default Logo;