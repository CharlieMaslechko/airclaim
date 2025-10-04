import React, { useState, useEffect, useRef, useCallback } from "react";

interface HUDProps {
  balance: string | null;
  onClose?: () => void;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

const HUD: React.FC<HUDProps> = ({ balance, onClose }) => {
  console.log("🎨 Vector HUD: Component rendering with balance:", balance);

  // Constants for responsive design
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 600;
  const MIN_HEIGHT = 120;
  const MAX_HEIGHT = 800;
  const DEFAULT_WIDTH = 300;
  const DEFAULT_HEIGHT = 180;
  const MINIMIZED_WIDTH = 160;
  const MINIMIZED_HEIGHT = 60;

  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [size, setSize] = useState<Size>({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const hudRef = useRef<HTMLDivElement>(null);
  const dragDataRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);
  const resizeDataRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  // Load saved state on mount
  useEffect(() => {
    try {
      const savedPosition = localStorage.getItem("vector-hud-position");
      const savedSize = localStorage.getItem("vector-hud-size");
      const savedMinimized = localStorage.getItem("vector-hud-minimized");

      if (savedPosition) {
        const pos = JSON.parse(savedPosition);
        if (pos.x !== undefined && pos.y !== undefined) {
          setPosition(pos);
        }
      }

      if (savedSize) {
        const size = JSON.parse(savedSize);
        if (size.width !== undefined && size.height !== undefined) {
          setSize({
            width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, size.width)),
            height: Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, size.height)),
          });
        }
      }

      if (savedMinimized) {
        setIsMinimized(JSON.parse(savedMinimized));
      }
    } catch (e) {
      console.warn("Could not load HUD state:", e);
    }
  }, []);

  // Save state when it changes
  useEffect(() => {
    try {
      localStorage.setItem("vector-hud-position", JSON.stringify(position));
    } catch (e) {
      console.warn("Could not save HUD position:", e);
    }
  }, [position]);

  useEffect(() => {
    try {
      localStorage.setItem("vector-hud-size", JSON.stringify(size));
    } catch (e) {
      console.warn("Could not save HUD size:", e);
    }
  }, [size]);

  useEffect(() => {
    try {
      localStorage.setItem("vector-hud-minimized", JSON.stringify(isMinimized));
    } catch (e) {
      console.warn("Could not save HUD minimized state:", e);
    }
  }, [isMinimized]);

  // Clamp position and size to viewport
  const clampToViewport = (
    pos: Position,
    size: Size
  ): { position: Position; size: Size } => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Clamp size first
    const clampedWidth = Math.max(
      MIN_WIDTH,
      Math.min(MAX_WIDTH, Math.min(size.width, viewportWidth * 0.9))
    );
    const clampedHeight = Math.max(
      MIN_HEIGHT,
      Math.min(MAX_HEIGHT, Math.min(size.height, viewportHeight * 0.9))
    );

    // Then clamp position
    const clampedX = Math.max(0, Math.min(pos.x, viewportWidth - clampedWidth));
    const clampedY = Math.max(
      0,
      Math.min(pos.y, viewportHeight - clampedHeight)
    );

    return {
      position: { x: clampedX, y: clampedY },
      size: { width: clampedWidth, height: clampedHeight },
    };
  };

  // Handle window resize
  useEffect(() => {
    const handleWindowResize = () => {
      const currentSize = isMinimized
        ? { width: MINIMIZED_WIDTH, height: MINIMIZED_HEIGHT }
        : size;

      const clamped = clampToViewport(position, currentSize);
      setPosition(clamped.position);
      if (!isMinimized) {
        setSize(clamped.size);
      }
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [position, size, isMinimized]);

  // Drag handlers
  const handleDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    dragDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };

    setIsDragging(true);
  };

  const handleDragMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !dragDataRef.current) return;

      const deltaX = e.clientX - dragDataRef.current.startX;
      const deltaY = e.clientY - dragDataRef.current.startY;

      const newPos = {
        x: dragDataRef.current.startPosX + deltaX,
        y: dragDataRef.current.startPosY + deltaY,
      };

      const currentSize = isMinimized
        ? { width: MINIMIZED_WIDTH, height: MINIMIZED_HEIGHT }
        : size;

      const clamped = clampToViewport(newPos, currentSize);
      setPosition(clamped.position);
    },
    [isDragging, isMinimized, size]
  );

  // Resize handlers
  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    resizeDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    };

    setIsResizing(true);
  };

  const handleResizeMove = useCallback(
    (e: PointerEvent) => {
      if (!isResizing || !resizeDataRef.current) return;

      const deltaX = e.clientX - resizeDataRef.current.startX;
      const deltaY = e.clientY - resizeDataRef.current.startY;

      const newSize = {
        width: resizeDataRef.current.startWidth + deltaX,
        height: resizeDataRef.current.startHeight + deltaY,
      };

      const clamped = clampToViewport(position, newSize);
      setSize(clamped.size);
    },
    [isResizing, position]
  );

  // Global pointer handlers
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      handleDragMove(e);
      handleResizeMove(e);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      dragDataRef.current = null;
      resizeDataRef.current = null;
    };

    if (isDragging || isResizing) {
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("pointercancel", handlePointerUp);
    }

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isDragging, isResizing, handleDragMove, handleResizeMove]);

  const currentWidth = isMinimized ? MINIMIZED_WIDTH : size.width;
  const currentHeight = isMinimized ? MINIMIZED_HEIGHT : size.height;

  const hudStyles: React.CSSProperties = {
    position: "fixed",
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${currentWidth}px`,
    height: `${currentHeight}px`,
    background: "#213743",
    borderRadius: "12px",
    boxShadow:
      isDragging || isResizing
        ? "0 15px 40px rgba(0,0,0,0.4), 0 5px 15px rgba(0,0,0,0.3)"
        : "0 10px 30px rgba(0,0,0,0.3), 0 1px 8px rgba(0,0,0,0.2)",
    zIndex: 2147483647,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "14px",
    color: "white",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
    transition: isDragging || isResizing ? "none" : "all 0.2s ease-out",
    userSelect: "none",
    pointerEvents: "auto",
    transform: isDragging || isResizing ? "scale(1.01)" : "scale(1)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const headerStyles: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: isMinimized ? "8px 12px" : "12px 16px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "12px 12px 0 0",
    cursor: isDragging ? "grabbing" : "grab",
    borderBottom: isMinimized ? "none" : "1px solid rgba(255,255,255,0.1)",
    flexShrink: 0,
  };

  const titleStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: isMinimized ? "4px" : "8px",
    fontFamily: "proxima-nova, sans-serif",
    fontWeight: "600",
    fontSize: isMinimized ? "14px" : "16px",
  };

  // const logoStyles: React.CSSProperties = {
  //   fontSize: isMinimized ? "16px" : "18px",
  //   filter: "drop-shadow(0 0 8px rgba(255,255,0,0.6))",
  // };

  const controlsStyles: React.CSSProperties = {
    display: "flex",
    gap: "4px",
  };

  const buttonStyles: React.CSSProperties = {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    borderRadius: "6px",
    width: isMinimized ? "20px" : "24px",
    height: isMinimized ? "20px" : "24px",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: isMinimized ? "12px" : "14px",
    fontWeight: "bold",
    transition: "all 0.2s ease",
  };

  const contentStyles: React.CSSProperties = {
    padding: "16px",
    display: isMinimized ? "none" : "flex",
    flexDirection: "column",
    gap: "12px",
    flex: 1,
    overflow: "auto",
  };

  const statStyles: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "8px",
    transition: "background 0.2s ease",
  };

  const labelStyles: React.CSSProperties = {
    fontWeight: "500",
    opacity: 0.9,
  };

  const valueStyles: React.CSSProperties = {
    fontWeight: "600",
    fontFamily: '"SF Mono", "Monaco", "Inconsolata", monospace',
    background: "rgba(255,255,255,0.1)",
    padding: "2px 8px",
    borderRadius: "4px",
  };

  return (
    <div ref={hudRef} style={hudStyles}>
      <div style={headerStyles} onPointerDown={handleDragStart}>
        <div style={titleStyles}>
          <span>vector{">"}</span>
        </div>
        <div style={controlsStyles}>
          <button
            style={buttonStyles}
            onClick={() => setIsMinimized(!isMinimized)}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background =
                "rgba(255,255,255,0.3)";
              (e.target as HTMLElement).style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background =
                "rgba(255,255,255,0.2)";
              (e.target as HTMLElement).style.transform = "scale(1)";
            }}
          >
            {isMinimized ? "□" : "−"}
          </button>
          {onClose && (
            <button
              style={buttonStyles}
              onClick={onClose}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background =
                  "rgba(255,99,99,0.8)";
                (e.target as HTMLElement).style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background =
                  "rgba(255,255,255,0.2)";
                (e.target as HTMLElement).style.transform = "scale(1)";
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <div style={contentStyles}>
          <div style={statStyles}>
            <span style={labelStyles}>Bankroll:</span>
            <span style={valueStyles}>{balance || "Loading..."}</span>
          </div>
          <div style={statStyles}>
            <span style={labelStyles}>Status:</span>
            <span style={valueStyles}>Active</span>
          </div>
        </div>
      )}

      {!isMinimized && (
        <div
          role="separator"
          aria-label="Resize HUD"
          onPointerDown={handleResizeStart}
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: "20px",
            height: "20px",
            cursor: isResizing ? "nwse-resize" : "nw-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            touchAction: "none",
            background: isResizing ? "rgba(255,255,255,0.2)" : "transparent",
            borderRadius: "0 0 12px 0",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!isResizing) {
              (e.target as HTMLElement).style.background =
                "rgba(255,255,255,0.1)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              (e.target as HTMLElement).style.background = "transparent";
            }
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRight: "2px solid rgba(255,255,255,0.7)",
              borderBottom: "2px solid rgba(255,255,255,0.7)",
              borderRadius: "0 0 2px 0",
              transform: isResizing ? "scale(1.2)" : "scale(1)",
              transition: "transform 0.2s ease",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default HUD;
