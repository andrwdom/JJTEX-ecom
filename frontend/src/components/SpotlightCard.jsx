import { useRef, useState } from "react";

const SpotlightCard = ({ children, className = "", spotlightColor = "rgb(255, 0, 191)" }) => {
  const divRef = useRef(null);
  const spotlightRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const positionRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef();

  const updateSpotlight = (x, y) => {
    if (spotlightRef.current) {
      spotlightRef.current.style.background = `radial-gradient(circle at ${x}px ${y}px, ${spotlightColor}, transparent 80%)`;
    }
  };

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    positionRef.current = { x, y };
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        updateSpotlight(positionRef.current.x, positionRef.current.y);
        rafRef.current = null;
      });
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(0.6);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = (e) => {
    setOpacity(0.6);
    // Update position immediately on enter
    handleMouseMove(e);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-3xl border border-neutral-200/10 bg-pink/5 overflow-hidden p-8 ${className}`}
      tabIndex={0}
    >
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          willChange: 'opacity, background',
        }}
      />
      {children}
    </div>
  );
};

export default SpotlightCard; 