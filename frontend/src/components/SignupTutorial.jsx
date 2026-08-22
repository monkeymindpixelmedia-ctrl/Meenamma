import React, { useState } from "react";

function PlayIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m10 8 6 4-6 4V8Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChevronIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function SignupTutorial() {
  const [open, setOpen] = useState(false);

  return (
    <details
      className="group mb-7 overflow-hidden rounded-xl border border-amber-500/20 bg-amber-400/[0.035]"
      onToggle={(event) => setOpen(event.currentTarget.open)}
      data-testid="signup-tutorial"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 text-left marker:hidden">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300">
          <PlayIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-sm text-amber-100">Watch the signup guide</span>
          <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-amber-200/45">
            Four steps · 30 seconds · captions included
          </span>
        </span>
        <ChevronIcon className="h-4 w-4 shrink-0 text-amber-300/60 transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="border-t border-amber-500/15 p-3">
        <video
          className="aspect-video w-full rounded-lg border border-amber-500/20 bg-black object-cover shadow-2xl"
          controls
          playsInline
          preload={open ? "metadata" : "none"}
          poster="/tutorials/meenamma-signup-poster.png"
          aria-label="Meenamma account signup tutorial"
          data-testid="signup-tutorial-video"
        >
          <source src="/tutorials/meenamma-signup-remotion.mp4" type="video/mp4" />
          Your browser does not support MP4 video playback.
        </video>
        <div className="mt-2.5 flex items-center justify-between gap-3 px-1 text-[10px] text-amber-100/45">
          <span>Best viewed full screen</span>
          <a
            href="/tutorials/meenamma-signup-hyperframes.mp4"
            target="_blank"
            rel="noreferrer"
            className="text-amber-300/75 underline decoration-amber-400/30 underline-offset-4 hover:text-amber-200"
          >
            Open portrait version
          </a>
        </div>
      </div>
    </details>
  );
}
