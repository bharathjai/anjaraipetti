import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./TruckOrderButton.css";

/**
 * Props:
 *   label        – button text (idle state), e.g. "Place COD Order"
 *   successLabel – button text (done state), e.g. "Order Placed"
 *   disabled     – disables button interaction
 *   onValidate   – async function; throws to halt/block animation (e.g. form validation errors)
 *   onClick      – async function; runs in background during animation; throws to reset on failure
 *   onDone       – callback; called after truck animation completes and success state shows
 */
export default function TruckOrderButton({
  label        = "Place Order",
  successLabel = "Order Placed",
  disabled     = false,
  onValidate,
  onClick,
  onDone,
}) {
  const [phase, setPhase] = useState("idle"); // "idle" | "running" | "done"
  const buttonRef = useRef(null);
  const truckRef  = useRef(null);
  const boxRef    = useRef(null);

  // Clean up any active GSAP tweens when component unmounts
  useEffect(() => {
    return () => {
      if (buttonRef.current) gsap.killTweensOf(buttonRef.current);
      if (boxRef.current) gsap.killTweensOf(boxRef.current);
      if (truckRef.current) gsap.killTweensOf(truckRef.current);
    };
  }, []);

  const resetStyles = () => {
    const button = buttonRef.current;
    const truck  = truckRef.current;
    const box    = boxRef.current;

    if (!button || !truck || !box) return;

    // Reset GSAP animated CSS variables to defaults
    gsap.killTweensOf(button);
    gsap.killTweensOf(box);
    gsap.killTweensOf(truck);

    gsap.set(button, {
      '--progress': 0,
      '--hx': 0,
      '--bx': 0,
      '--box-s': 0.5,
      '--box-o': 0,
      '--truck-y': 0,
      '--truck-y-n': -26,
      '--rx': '0deg',
      '--br': '16px',
      '--truck-x': 4
    });

    gsap.set(box, {
      x: -24,
      y: -6
    });
  };

  const startAnimation = () => {
    const button = buttonRef.current;
    const truck  = truckRef.current;
    const box    = boxRef.current;

    if (!button || !truck || !box) return;

    // 1. Initial State Setup
    gsap.set(button, {
      '--progress': 0,
      '--hx': 0,
      '--bx': 0,
      '--box-s': 0.5,
      '--box-o': 0,
      '--truck-y': 0,
      '--truck-y-n': -26,
      '--truck-x': 4
    });
    gsap.set(box, {
      x: -24,
      y: -6
    });

    // 2. Animate Box Scale & Opacity (reveal box)
    gsap.to(button, {
      '--box-s': 1,
      '--box-o': 1,
      duration: 0.3,
      delay: 0.5
    });

    // 3. Slide Box inside truck back flap
    gsap.to(box, {
      x: 0,
      duration: 0.4,
      delay: 0.7
    });

    // 4. Tailgate closes (hx turns negative, bx shifts right)
    gsap.to(button, {
      '--hx': -5,
      '--bx': 50,
      duration: 0.18,
      delay: 0.92
    });

    // 5. Drop Box vertically into cargo hold
    gsap.to(box, {
      y: 0,
      duration: 0.1,
      delay: 1.15
    });

    // 6. Truck starts bouncing (idle vibration)
    gsap.set(button, {
      '--truck-y': 0,
      '--truck-y-n': -26
    });

    // 7. Drive truck across road
    gsap.to(button, {
      '--truck-y': 1,
      '--truck-y-n': -25,
      duration: 0.2,
      delay: 1.25,
      onComplete() {
        // Calculate dynamic travel coordinates based on actual button width
        const w = button.clientWidth || 172;
        const step1 = 0;
        const step2 = Math.round((w - 72) * 0.40);
        const step3 = Math.round((w - 72) * 0.20);
        const step4 = Math.round((w - 72) * 0.96);

        // Drive timeline
        gsap.timeline({
          onComplete() {
            setPhase("done");
            // Allow the user to enjoy the premium green "Order Placed" success checkmark animation before showing the confirmation popup!
            setTimeout(() => {
              if (onDone) onDone();
            }, 1000);
          }
        })
        .to(button, {
          '--truck-x': step1,
          duration: 0.4
        })
        .to(button, {
          '--truck-x': step2,
          duration: 1
        })
        .to(button, {
          '--truck-x': step3,
          duration: 0.6
        })
        .to(button, {
          '--truck-x': step4,
          duration: 0.4
        });

        // Road progress sweep
        gsap.to(button, {
          '--progress': 1,
          duration: 2.4,
          ease: "power2.in"
        });
      }
    });
  };

  const handleClick = async () => {
    if (disabled || phase === "running") return;

    // Reset from done -> idle if clicked after completion (allows re-trigger)
    if (phase === "done") {
      resetStyles();
      setPhase("idle");
      return;
    }

    // ── Step 1: Form Validation ──
    try {
      if (onValidate) await onValidate();
    } catch (e) {
      // Stay in idle phase; errors will be handled and shown by parent
      return;
    }

    // ── Step 2: Validation Succeeded -> Play Animation ──
    setPhase("running");
    startAnimation();

    // ── Step 3: Run Background API call (e.g. place order / payment) ──
    try {
      if (onClick) await onClick();
    } catch (e) {
      // If network call / server request fails, cancel animation & reset styles back to idle
      resetStyles();
      setPhase("idle");
    }
  };

  const cls = [
    "truck-button",
    phase === "running" && "animation",
    phase === "done"    && "animation done",
    disabled            && "disabled",
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={buttonRef}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cls}
      aria-label={phase === "done" ? successLabel : label}
      style={{
        userSelect: "none"
      }}
    >
      <span className="default">{label}</span>
      <span className="success" aria-hidden={phase !== "done"}>
        <svg viewBox="0 0 12 10">
          <polyline points="1.5 6 4.5 9 10.5 1" />
        </svg>
        {successLabel}
      </span>
      <div className="truck" ref={truckRef} aria-hidden="true">
        <div className="wheel"></div>
        <div className="back"></div>
        <div className="front"></div>
        <div className="box" ref={boxRef}></div>
      </div>
    </div>
  );
}
