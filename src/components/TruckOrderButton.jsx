import { useEffect, useRef, useState } from "react";
import "./TruckOrderButton.css";

/**
 * Props:
 *   label        – button text (idle state)
 *   successLabel – button text (done state)
 *   disabled     – disables button
 *   onValidate   – async fn; throw to block animation (validation errors)
 *   onClick      – async fn; runs during animation; throw to reset on failure
 *   onDone       – called after truck fully exits & success state shows
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
  const truckRef = useRef(null);
  const timers   = useRef([]);

  const schedule = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
  const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clearAll(), []);

  const resetStyles = () => {
    if (truckRef.current) truckRef.current.style.cssText = "";
  };

  const startAnimation = () => {
    const truck = truckRef.current;
    if (!truck) return;

    // Place truck off-screen left, hidden
    truck.style.cssText = "transform: translateX(-100px); transition: none; opacity: 0;";

    // Slide in to visible start position
    schedule(() => {
      truck.style.transition = "transform 0.5s ease-out, opacity 0.3s ease";
      truck.style.transform  = "translateX(16px)";
      truck.style.opacity    = "1";
    }, 200);

    // Pause (let user see the truck), then drive slowly across
    schedule(() => {
      truck.style.transition = "transform 4.5s cubic-bezier(0.4, 0, 0.2, 1)";
      truck.style.transform  = "translateX(calc(100% + 100px))";
    }, 1000);

    // Truck has exited — mark done and notify parent
    schedule(() => {
      setPhase("done");
      if (onDone) onDone();
    }, 5800);
  };

  const handleClick = async () => {
    if (disabled || phase === "running") return;

    // Reset from done → idle on re-click
    if (phase === "done") {
      clearAll();
      resetStyles();
      setPhase("idle");
      return;
    }

    // ── Step 1: Validate BEFORE animation starts ──────────────
    // If validation fails it throws and shows errors — no animation yet.
    try {
      if (onValidate) await onValidate();
    } catch {
      return; // stay idle, errors shown by parent
    }

    // ── Step 2: Validation passed → start animation ───────────
    setPhase("running");
    startAnimation();

    // ── Step 3: Place the order in the background ─────────────
    // If the network/server call fails, reset the animation.
    try {
      if (onClick) await onClick();
    } catch {
      clearAll();
      resetStyles();
      setPhase("idle");
    }
  };

  const cls = [
    "tob",
    phase === "running" && "tob--running",
    phase === "done"    && "tob--done",
  ].filter(Boolean).join(" ");

  return (
    <button
      type="button"           /* form submit handled by onValidate + onClick */
      disabled={disabled}
      onClick={handleClick}
      className={cls}
    >
      {/* amber road fill */}
      <span className="tob__road" aria-hidden="true">
        <span className="tob__dash" />
        <span className="tob__dash" />
        <span className="tob__dash" />
        <span className="tob__dash" />
        <span className="tob__dash" />
      </span>

      {/* labels */}
      <span className="tob__label tob__label--default">{label}</span>
      <span className="tob__label tob__label--success">
        <svg className="tob__tick" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
          <polyline
            points="5.5,10 8.5,13 14.5,7"
            stroke="#86efac"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="16"
            strokeDashoffset="16"
            className="tob__tick-path"
          />
        </svg>
        {successLabel}
      </span>

      {/* HD Delivery Truck */}
      <span className="tob__truck" ref={truckRef} aria-hidden="true">
        <svg viewBox="0 0 160 58" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* ground shadow */}
          <ellipse cx="80" cy="56" rx="72" ry="3" fill="rgba(0,0,0,0.18)" />
          {/* cargo body */}
          <rect x="2" y="6" width="96" height="38" rx="3" fill="#DCB97A"/>
          <rect x="2" y="6" width="16" height="38" rx="3" fill="#B89B66"/>
          <rect x="2" y="6" width="96" height="5" rx="3" fill="#EDD08E"/>
          <rect x="2" y="26" width="96" height="1.5" fill="rgba(0,0,0,0.10)"/>
          <rect x="50" y="6" width="1.5" height="38" fill="rgba(0,0,0,0.10)"/>
          <rect x="97" y="6" width="1" height="38" fill="rgba(0,0,0,0.15)"/>
          <rect x="48" y="12" width="4" height="3" rx="1" fill="#A07848"/>
          <rect x="48" y="35" width="4" height="3" rx="1" fill="#A07848"/>
          <rect x="18" y="16" width="28" height="12" rx="2" fill="rgba(255,255,255,0.18)"/>
          {/* cab */}
          <path d="M98 6 L98 44 L150 44 L150 26 L134 6 Z" fill="#C8A870"/>
          <path d="M98 6 L134 6 L140 10 L98 10 Z" fill="#DDBB88"/>
          <path d="M103 10 L132 10 L148 26 L103 26 Z" fill="#5B9FC8" opacity="0.88"/>
          <path d="M106 12 L118 12 L128 22 L106 22 Z" fill="rgba(255,255,255,0.22)"/>
          <rect x="100" y="28" width="18" height="12" rx="2" fill="#5B9FC8" opacity="0.75"/>
          <rect x="102" y="30" width="6" height="4" rx="1" fill="rgba(255,255,255,0.25)"/>
          <rect x="145" y="28" width="7" height="5" rx="1.5" fill="#FFFBE0"/>
          <rect x="146" y="29" width="5" height="3" rx="1" fill="#FFF176"/>
          <rect x="148" y="14" width="5" height="4" rx="1" fill="#B89B66"/>
          <rect x="115" y="34" width="6" height="2" rx="1" fill="rgba(0,0,0,0.2)"/>
          <rect x="148" y="38" width="8" height="5" rx="1" fill="#9E8050"/>
          {/* undercarriage */}
          <rect x="2" y="44" width="154" height="4" rx="2" fill="#7A5530"/>
          {/* rear wheel */}
          <circle cx="30" cy="50" r="10" fill="#1A0E05"/>
          <circle cx="30" cy="50" r="7"  fill="#3A2010"/>
          <circle cx="30" cy="50" r="4"  fill="#5A3820" className="tob__rim"/>
          <circle cx="30" cy="50" r="2"  fill="#C8A870"/>
          <path d="M21 47 A10 10 0 0 1 26 41" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round"/>
          {/* front wheel */}
          <circle cx="128" cy="50" r="10" fill="#1A0E05"/>
          <circle cx="128" cy="50" r="7"  fill="#3A2010"/>
          <circle cx="128" cy="50" r="4"  fill="#5A3820" className="tob__rim"/>
          <circle cx="128" cy="50" r="2"  fill="#C8A870"/>
          <path d="M119 47 A10 10 0 0 1 124 41" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round"/>
          {/* speed streaks */}
          <line x1="-10" y1="20" x2="-30" y2="20" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="-10" y1="28" x2="-38" y2="28" stroke="rgba(255,255,255,0.40)" strokeWidth="2"   strokeLinecap="round"/>
          <line x1="-10" y1="35" x2="-26" y2="35" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </span>
    </button>
  );
}
