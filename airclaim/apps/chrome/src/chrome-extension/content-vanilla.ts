// content-vanilla.ts
// Vanilla JavaScript content script for Vector Chrome Extension

/*global chrome*/

// Define message types for type safety
interface RequestInterceptedMessage {
  type: "REQUEST_INTERCEPTED";
  data: unknown;
}

// HUD state management
class VectorHUD {
  private hudElement: HTMLDivElement | null = null;
  private balance: string | null = null;
  private position = { x: 20, y: 20 };
  private size = { width: 300, height: 180 };
  private isMinimized = false;
  private isDragging = false;
  private isResizing = false;
  private dragOffset = { x: 0, y: 0 };
  private resizeData: {
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null = null;

  // Responsive design constants
  private readonly MIN_WIDTH = 200;
  private readonly MAX_WIDTH = 600;
  private readonly MIN_HEIGHT = 120;
  private readonly MAX_HEIGHT = 800;
  private readonly MINIMIZED_WIDTH = 160;
  private readonly MINIMIZED_HEIGHT = 60;

  constructor() {
    this.loadSavedState();
    this.createHUD();
    this.setupMessageListeners();
    this.startBalancePolling();
    this.setupCurrencyObserver();
    this.setupWindowResize();
  }

  private loadSavedState(): void {
    try {
      const savedPosition = localStorage.getItem("vector-hud-position");
      const savedSize = localStorage.getItem("vector-hud-size");
      const savedMinimized = localStorage.getItem("vector-hud-minimized");

      if (savedPosition) {
        const pos = JSON.parse(savedPosition);
        if (pos.x !== undefined && pos.y !== undefined) {
          this.position = pos;
        }
      }

      if (savedSize) {
        const size = JSON.parse(savedSize);
        if (size.width !== undefined && size.height !== undefined) {
          this.size = {
            width: Math.max(
              this.MIN_WIDTH,
              Math.min(this.MAX_WIDTH, size.width)
            ),
            height: Math.max(
              this.MIN_HEIGHT,
              Math.min(this.MAX_HEIGHT, size.height)
            ),
          };
        }
      }

      if (savedMinimized) {
        this.isMinimized = JSON.parse(savedMinimized);
      }
    } catch (e) {
      console.warn("Could not load HUD state:", e);
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem(
        "vector-hud-position",
        JSON.stringify(this.position)
      );
      localStorage.setItem("vector-hud-size", JSON.stringify(this.size));
      localStorage.setItem(
        "vector-hud-minimized",
        JSON.stringify(this.isMinimized)
      );
    } catch (e) {
      console.warn("Could not save HUD state:", e);
    }
  }

  private clampToViewport(
    pos: { x: number; y: number },
    size: { width: number; height: number }
  ): {
    position: { x: number; y: number };
    size: { width: number; height: number };
  } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Clamp size first
    const clampedWidth = Math.max(
      this.MIN_WIDTH,
      Math.min(this.MAX_WIDTH, Math.min(size.width, viewportWidth * 0.9))
    );
    const clampedHeight = Math.max(
      this.MIN_HEIGHT,
      Math.min(this.MAX_HEIGHT, Math.min(size.height, viewportHeight * 0.9))
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
  }

  private createHUD(): void {
    console.log("🎨 Vector HUD: Creating vanilla JS HUD");

    this.hudElement = document.createElement("div");
    this.hudElement.id = "vector-hud";

    this.updateHUDContent();
    this.applyStyles();
    this.setupDragListeners();
    this.setupResizeListeners();

    document.body.appendChild(this.hudElement);

    // Apply saved position and size with viewport clamping
    const currentSize = this.isMinimized
      ? { width: this.MINIMIZED_WIDTH, height: this.MINIMIZED_HEIGHT }
      : this.size;

    const clamped = this.clampToViewport(this.position, currentSize);
    this.position = clamped.position;
    if (!this.isMinimized) {
      this.size = clamped.size;
    }

    this.hudElement.style.left = `${this.position.x}px`;
    this.hudElement.style.top = `${this.position.y}px`;
  }

  private updateHUDContent(): void {
    if (!this.hudElement) return;

    this.hudElement.innerHTML = `
      <div class="vector-hud-header" id="vector-hud-header">
        <div class="vector-hud-title">
          <span>vector_</span>
        </div>
        <div class="vector-hud-controls">
          <button class="vector-btn vector-minimize" id="vector-minimize">${
            this.isMinimized ? "□" : "−"
          }</button>
          <button class="vector-btn vector-close" id="vector-close">×</button>
        </div>
      </div>
      <div class="vector-hud-content" id="vector-hud-content" style="${
        this.isMinimized ? "display: none" : ""
      }">
        <div class="vector-stat">
          <span class="vector-label">Bankroll:</span>
          <span class="vector-value" id="vector-balance">${
            this.balance || "Loading..."
          }</span>
        </div>
        <div class="vector-stat">
          <span class="vector-label">Status:</span>
          <span class="vector-value">Active</span>
        </div>
      </div>
      ${
        !this.isMinimized
          ? `
        <div class="vector-resize-handle" id="vector-resize-handle">
          <div class="vector-resize-icon"></div>
        </div>
      `
          : ""
      }
    `;

    this.setupControlButtons();
  }

  private applyStyles(): void {
    if (!this.hudElement) return;

    const currentWidth = this.isMinimized
      ? this.MINIMIZED_WIDTH
      : this.size.width;
    const currentHeight = this.isMinimized
      ? this.MINIMIZED_HEIGHT
      : this.size.height;

    // Apply inline styles to avoid CSS conflicts
    Object.assign(this.hudElement.style, {
      position: "fixed",
      width: `${currentWidth}px`,
      height: `${currentHeight}px`,
      background: "#213743",
      borderRadius: "12px",
      boxShadow:
        this.isDragging || this.isResizing
          ? "0 15px 40px rgba(0,0,0,0.4), 0 5px 15px rgba(0,0,0,0.3)"
          : "0 10px 30px rgba(0,0,0,0.3), 0 1px 8px rgba(0,0,0,0.2)",
      zIndex: "2147483647",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: "14px",
      color: "white",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.1)",
      transition:
        this.isDragging || this.isResizing ? "none" : "all 0.2s ease-out",
      userSelect: "none",
      pointerEvents: "auto",
      transform:
        this.isDragging || this.isResizing ? "scale(1.01)" : "scale(1)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    });

    // Style header
    const header = this.hudElement.querySelector(
      ".vector-hud-header"
    ) as HTMLElement;
    if (header) {
      Object.assign(header.style, {
        display: "flex",
        fontFamily: "proxima-nova, sans-serif",
        justifyContent: "space-between",
        alignItems: "center",
        padding: this.isMinimized ? "8px 12px" : "12px 16px",
        background: "rgba(255,255,255,0.1)",
        borderRadius: "12px 12px 0 0",
        cursor: this.isDragging ? "grabbing" : "grab",
        borderBottom: this.isMinimized
          ? "none"
          : "1px solid rgba(255,255,255,0.1)",
        flexShrink: "0",
      });
    }

    // Style other elements
    this.styleInternalElements();
  }

  private styleInternalElements(): void {
    if (!this.hudElement) return;

    const title = this.hudElement.querySelector(
      ".vector-hud-title"
    ) as HTMLElement;
    if (title) {
      Object.assign(title.style, {
        display: "flex",
        alignItems: "center",
        gap: this.isMinimized ? "4px" : "8px",
        fontWeight: "600",
        fontSize: this.isMinimized ? "14px" : "16px",
      });
    }

    const logo = this.hudElement.querySelector(".vector-logo") as HTMLElement;
    if (logo) {
      Object.assign(logo.style, {
        fontSize: this.isMinimized ? "16px" : "18px",
        filter: "drop-shadow(0 0 8px rgba(255,255,0,0.6))",
      });
    }

    const controls = this.hudElement.querySelector(
      ".vector-hud-controls"
    ) as HTMLElement;
    if (controls) {
      Object.assign(controls.style, {
        display: "flex",
        gap: "4px",
      });
    }

    const buttons = this.hudElement.querySelectorAll(".vector-btn");
    buttons.forEach((btn) => {
      const button = btn as HTMLElement;
      Object.assign(button.style, {
        background: "rgba(255,255,255,0.2)",
        border: "none",
        borderRadius: "6px",
        width: this.isMinimized ? "20px" : "24px",
        height: this.isMinimized ? "20px" : "24px",
        color: "white",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: this.isMinimized ? "12px" : "14px",
        fontWeight: "bold",
        transition: "all 0.2s ease",
      });
    });

    const content = this.hudElement.querySelector(
      ".vector-hud-content"
    ) as HTMLElement;
    if (content) {
      Object.assign(content.style, {
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        flex: "1",
        overflow: "auto",
      });
    }

    const stats = this.hudElement.querySelectorAll(".vector-stat");
    stats.forEach((stat) => {
      const statElement = stat as HTMLElement;
      Object.assign(statElement.style, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 12px",
        background: "#0F212E",
        borderRadius: "8px",
        transition: "background 0.2s ease",
      });
    });

    const labels = this.hudElement.querySelectorAll(".vector-label");
    labels.forEach((label) => {
      const labelElement = label as HTMLElement;
      Object.assign(labelElement.style, {
        fontWeight: "500",
        opacity: "0.9",
      });
    });

    const values = this.hudElement.querySelectorAll(".vector-value");
    values.forEach((value) => {
      const valueElement = value as HTMLElement;
      Object.assign(valueElement.style, {
        fontWeight: "600",
        fontFamily: '"SF Mono", "Monaco", "Inconsolata", monospace',
        background: "rgba(255,255,255,0.1)",
        padding: "2px 8px",
        borderRadius: "4px",
      });
    });

    // Style resize handle
    const resizeHandle = this.hudElement.querySelector(
      ".vector-resize-handle"
    ) as HTMLElement;
    if (resizeHandle) {
      Object.assign(resizeHandle.style, {
        position: "absolute",
        right: "0",
        bottom: "0",
        width: "20px",
        height: "20px",
        cursor: this.isResizing ? "nwse-resize" : "nw-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
        background: this.isResizing ? "rgba(255,255,255,0.2)" : "transparent",
        borderRadius: "0 0 12px 0",
        transition: "background 0.2s ease",
      });
    }

    const resizeIcon = this.hudElement.querySelector(
      ".vector-resize-icon"
    ) as HTMLElement;
    if (resizeIcon) {
      Object.assign(resizeIcon.style, {
        width: "8px",
        height: "8px",
        borderRight: "2px solid rgba(255,255,255,0.7)",
        borderBottom: "2px solid rgba(255,255,255,0.7)",
        borderRadius: "0 0 2px 0",
        transform: this.isResizing ? "scale(1.2)" : "scale(1)",
        transition: "transform 0.2s ease",
      });
    }
  }

  private setupControlButtons(): void {
    const minimizeBtn = this.hudElement?.querySelector(
      "#vector-minimize"
    ) as HTMLButtonElement;
    const closeBtn = this.hudElement?.querySelector(
      "#vector-close"
    ) as HTMLButtonElement;

    minimizeBtn?.addEventListener("click", () => {
      this.isMinimized = !this.isMinimized;
      this.updateHUDContent();
      this.applyStyles();
      this.saveState();
    });

    closeBtn?.addEventListener("click", () => {
      if (this.hudElement) {
        this.hudElement.style.transform = "scale(0)";
        this.hudElement.style.opacity = "0";
        setTimeout(() => this.hudElement?.remove(), 200);
      }
    });

    // Add hover effects
    minimizeBtn?.addEventListener("mouseenter", (e) => {
      const target = e.target as HTMLElement;
      target.style.background = "rgba(255,255,255,0.3)";
      target.style.transform = "scale(1.1)";
    });

    minimizeBtn?.addEventListener("mouseleave", (e) => {
      const target = e.target as HTMLElement;
      target.style.background = "rgba(255,255,255,0.2)";
      target.style.transform = "scale(1)";
    });

    closeBtn?.addEventListener("mouseenter", (e) => {
      const target = e.target as HTMLElement;
      target.style.background = "rgba(255,99,99,0.8)";
      target.style.transform = "scale(1.1)";
    });

    closeBtn?.addEventListener("mouseleave", (e) => {
      const target = e.target as HTMLElement;
      target.style.background = "rgba(255,255,255,0.2)";
      target.style.transform = "scale(1)";
    });
  }

  private setupDragListeners(): void {
    const header = this.hudElement?.querySelector(
      ".vector-hud-header"
    ) as HTMLElement;
    if (!header) return;

    header.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.isDragging = true;
      this.dragOffset = {
        x: e.clientX - this.position.x,
        y: e.clientY - this.position.y,
      };
      this.applyStyles();
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;

      const newX = e.clientX - this.dragOffset.x;
      const newY = e.clientY - this.dragOffset.y;

      const currentSize = this.isMinimized
        ? { width: this.MINIMIZED_WIDTH, height: this.MINIMIZED_HEIGHT }
        : this.size;

      const clamped = this.clampToViewport({ x: newX, y: newY }, currentSize);
      this.position = clamped.position;

      if (this.hudElement) {
        this.hudElement.style.left = `${this.position.x}px`;
        this.hudElement.style.top = `${this.position.y}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.saveState();
        this.applyStyles();
      }
    });
  }

  private setupResizeListeners(): void {
    const resizeHandle = this.hudElement?.querySelector(
      "#vector-resize-handle"
    ) as HTMLElement;
    if (!resizeHandle) return;

    resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      this.isResizing = true;
      this.resizeData = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: this.size.width,
        startHeight: this.size.height,
      };

      this.applyStyles();
    });

    // Add hover effects
    resizeHandle.addEventListener("mouseenter", () => {
      if (!this.isResizing && resizeHandle) {
        resizeHandle.style.background = "rgba(255,255,255,0.1)";
      }
    });

    resizeHandle.addEventListener("mouseleave", () => {
      if (!this.isResizing && resizeHandle) {
        resizeHandle.style.background = "transparent";
      }
    });

    // Global resize move and up handlers
    document.addEventListener("mousemove", (e) => {
      if (!this.isResizing || !this.resizeData) return;

      const deltaX = e.clientX - this.resizeData.startX;
      const deltaY = e.clientY - this.resizeData.startY;

      const newSize = {
        width: this.resizeData.startWidth + deltaX,
        height: this.resizeData.startHeight + deltaY,
      };

      const clamped = this.clampToViewport(this.position, newSize);
      this.size = clamped.size;

      if (this.hudElement) {
        this.hudElement.style.width = `${this.size.width}px`;
        this.hudElement.style.height = `${this.size.height}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      if (this.isResizing) {
        this.isResizing = false;
        this.resizeData = null;
        this.saveState();
        this.applyStyles();
      }
    });
  }

  private setupWindowResize(): void {
    window.addEventListener("resize", () => {
      const currentSize = this.isMinimized
        ? { width: this.MINIMIZED_WIDTH, height: this.MINIMIZED_HEIGHT }
        : this.size;

      const clamped = this.clampToViewport(this.position, currentSize);
      this.position = clamped.position;
      if (!this.isMinimized) {
        this.size = clamped.size;
      }

      if (this.hudElement) {
        this.hudElement.style.left = `${this.position.x}px`;
        this.hudElement.style.top = `${this.position.y}px`;
        if (!this.isMinimized) {
          this.hudElement.style.width = `${this.size.width}px`;
          this.hudElement.style.height = `${this.size.height}px`;
        }
      }

      this.saveState();
    });
  }

  private setupMessageListeners(): void {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(
      (request: RequestInterceptedMessage) => {
        if (request.type === "REQUEST_INTERCEPTED") {
          console.log("Received request data from background:", request.data);
        }
      }
    );

    // Listen for messages from injected script
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;

      const message = event.data;

      // Filter out irrelevant messages
      if (!message.type || typeof message.type !== "string") return;
      if (message.target === "metamask-inpage") return;
      if (message.type.includes("metamask") || message.type.includes("wallet"))
        return;

      // Process bet data messages
      if (
        message.type === "STAKE_PLINKO_BET_DATA" ||
        message.type === "STAKE_KENO_BET_DATA"
      ) {
        console.log("🎯 Intercepted API Response:", message.type, message.data);

        chrome.runtime.sendMessage({
          type: "INTERCEPTED_RESPONSE",
          gameType: message.type,
          data: message.data,
        });
      }
    });
  }

  private startBalancePolling(): void {
    const getPlayerBalance = (): string | null => {
      const balanceElement = document.getElementById("player-balance");
      return balanceElement ? balanceElement.textContent : null;
    };

    const updateBalance = () => {
      const newBalance = getPlayerBalance();
      if (newBalance !== this.balance) {
        this.balance = newBalance;
        const balanceElement =
          this.hudElement?.querySelector("#vector-balance");
        if (balanceElement) {
          balanceElement.textContent = this.balance || "Loading...";
        }
      }
    };

    // Initial update
    updateBalance();

    // Poll every 2 seconds
    setInterval(updateBalance, 2000);
  }

  private setupCurrencyObserver(): void {
    const targetElement = document.querySelector("[data-active-currency]");

    if (targetElement) {
      console.log(
        "🔍 Starting MutationObserver for currency changes found element"
      );

      const config = {
        attributes: true,
        attributeFilter: ["data-active-currency"],
      };

      const callback = (mutationsList: MutationRecord[]) => {
        console.log("🔍 MutationObserver callback triggered");
        for (const mutation of mutationsList) {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "data-active-currency"
          ) {
            const newValue = (mutation.target as HTMLElement).getAttribute(
              "data-active-currency"
            );
            console.log(
              `The data-active-currency attribute changed to: ${newValue}`
            );

            // Send a message to the background script with the new currency value
            chrome.runtime.sendMessage({
              type: "CURRENCY_CHANGED",
              newCurrency: newValue,
            });
          }
        }
      };

      const observer = new MutationObserver(callback);
      observer.observe(targetElement, config);
    } else {
      console.log(
        "Could not find the element with data-active-currency to observe."
      );
    }
  }
}

// Initialize the content script
const initContentScript = () => {
  console.log("🚀 Vector: Starting vanilla content script initialization...");

  try {
    new VectorHUD();
    console.log(
      "✅ Vector Chrome Extension: Vanilla content script initialized successfully"
    );
  } catch (error) {
    console.error("❌ Vector: Error initializing content script:", error);
  }
};

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initContentScript);
} else {
  initContentScript();
}
