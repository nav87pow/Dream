import React, { useMemo, useEffect, useRef, useState } from "react";
import { useTranslation } from "../../TranslationContext";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";

import { categories } from "../../data/Categories";
import { methods } from "../../data/Methods";

import InfiniteMarquee from "../common/InfiniteMarquee";

// stable shuffle once per mount
function shuffleOnce(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Area 4 */
function CategoryTag({ icon, label, isRTL }) {
  return (
    <div
      className="inline-flex items-center bg-white px-3 py-2"
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        borderRadius: "0.25rem 0",
        border: "1px solid var(--color-pink-200, #FFCAD4)",
        boxShadow: "4px 4px 0 0 var(--color-pink-200, #FFCAD4)",
        gap: "6px",
      }}
    >
      <span
        className="text-[18px] leading-none"
        style={{ color: "var(--color-pink-400, #FFC4D6)" }}
        aria-hidden="true"
      >
        {icon}
      </span>

      <span className="text-[16px] font-medium text-[var(--color-neutral-900,#191919)] capitalize">
        {label}
      </span>
    </div>
  );
}

/** Area 5 */
function MethodTag({ icon, label, isRTL }) {
  return (
    <div
      className="inline-flex items-center bg-white"
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        border: "0.8px solid var(--color-baby-blue-ice, #ABC4FF)",
        padding: "0.375rem 0.5rem",
        gap: "4px",
      }}
    >
      <span
        className="text-[12px] leading-none"
        style={{ color: "var(--color-baby-blue-ice, #ABC4FF)" }}
        aria-hidden="true"
      >
        {icon}
      </span>

      <span className="text-[10px] font-medium tracking-[0.025rem] uppercase text-black">
        {label}
      </span>
    </div>
  );
}

/** Area 14 */
function ActionButton({ icon, label, onClick, isRTL }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full inline-flex items-center justify-center rounded-md"
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        width: "100%",
        padding: "0.5rem 0.75rem",
        gap: "8px",
        border: "1px solid var(--color-pink-600, #FF5D8F)",
        background: "var(--color-dusty-bright-600, #FFFEFD)",
      }}
    >
      <span
        className="text-[12px] leading-none"
        style={{ color: "var(--color-pink-600, #FF5D8F)" }}
        aria-hidden="true"
      >
        {icon}
      </span>

      <span className="text-[12px] font-normal leading-[1.62] text-[var(--color-neutral-900,#191919)]">
        {label}
      </span>
    </button>
  );
}

export default function WelcomePage({ onContinue, onLearnMore, onInstall }) {
  const { t, languageFromContext } = useTranslation();
  const isRTL = languageFromContext === "he" || languageFromContext === "ar";

  const categoryById = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, []); // static export

  const shuffledMethods = useMemo(() => shuffleOnce(methods), []); // static export

  // Category translations:
  // Use your existing keys: interpretationCategories.<id>.label first, then categoryMeta.<id>.label, then fallback to data label.
  const categoryLabel = (cat) =>
    t(`interpretationCategories.${cat.id}.label`) ||
    t(`categoryMeta.${cat.id}.label`) ||
    cat.label ||
    cat.id;

  // Method translations: you already have "methods.<id>.label" in trans.json
  const methodLabel = (m) => t(`methods.${m.id}.label`) || m.label || m.id;

  // Language loading overlay (without touching LanguageSwitcher logic)
  const [isLangUpdating, setIsLangUpdating] = useState(false);
  const prevLangRef = useRef(languageFromContext);
  const prevProbeRef = useRef(t("welcome.title"));

  useEffect(() => {
    if (prevLangRef.current !== languageFromContext) {
      prevLangRef.current = languageFromContext;
      setIsLangUpdating(true);
    }
  }, [languageFromContext]);

  useEffect(() => {
    const probeNow = t("welcome.title");
    if (isLangUpdating && prevProbeRef.current !== probeNow) {
      prevProbeRef.current = probeNow;
      const tm = setTimeout(() => setIsLangUpdating(false), 140);
      return () => clearTimeout(tm);
    }
    return undefined;
  }, [isLangUpdating, t]);

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen text-[var(--color-neutral-900)]"
      style={{ background: "var(--color-neutral-50)" }}
    >
      {/* Language updating overlay */}
      {isLangUpdating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <div className="rounded-xl border border-[var(--color-neutral-200)] bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center" style={{ gap: "10px" }}>
              <div
                className="h-4 w-4 rounded-full border-2 border-[var(--color-pink-600)] border-t-transparent animate-spin"
                aria-hidden="true"
              />
              <div className="text-[12px] leading-[1.62] text-[var(--color-neutral-600)]">
                {t(
                  "welcome.languageUpdating",
                  "Please wait — updating the interface language…"
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[420px] px-4 py-6">
        <div className="flex flex-col" style={{ gap: "62px" }}>
          {/* 1) Language — style wrapper only, no logic change */}
          <div className="flex items-center justify-end">
            <div
              className={[
                // apply to any button inside (no DOM assumption)
                "[&_button]:inline-flex [&_button]:items-center [&_button]:justify-center",
                "[&_button]:rounded-lg [&_button]:bg-[#191919]",
                "[&_button]:px-4 [&_button]:py-2",
                "[&_button]:gap-[6px]",
                // text inside (works for spans inside button)
                "[&_button_span]:text-white [&_button_span]:text-[12px] [&_button_span]:font-semibold",
                "[&_button_span]:tracking-[0.06rem] [&_button_span]:capitalize",
                // icons
                "[&_button_svg]:text-white [&_button_i]:text-white",
              ].join(" ")}
            >
              <LanguageSwitcher />
            </div>
          </div>

          {/* 2) Title + logo placeholder */}
          <div className="flex items-center justify-center">
            <div
              className="flex items-center"
              style={{ gap: "10px", flexDirection: isRTL ? "row-reverse" : "row" }}
            >
              <div className="h-[27px] w-[27px] bg-[var(--color-neutral-200)] border border-[var(--color-neutral-400)] rounded-sm" />
              <h1 className="text-[32px] font-semibold leading-none">
                {t("welcome.title")}
              </h1>
            </div>
          </div>

          {/* 3) Subtitles */}
          <div className="text-center">
            <div className="text-[16px] font-medium leading-[1.62]">
              {t("welcome.subtitle1")}
            </div>
            <div className="mt-2 text-[12px] font-light leading-[1.72] text-[var(--color-neutral-600)]">
              {t("welcome.subtitle2")}
            </div>
          </div>

          {/* 4 + 5) Marquees — NO dir="ltr" wrappers */}
          <div className="flex flex-col" style={{ gap: "18px" }}>
            {/* 4) Categories — left */}
            <InfiniteMarquee
              items={categories}
              direction="left"
              durationSec={90}
              itemGapPx={14}
              ariaLabel="Dream categories"
              renderItem={(cat) => (
                <CategoryTag
                  icon={cat.iconFa ?? "◻︎"}
                  label={categoryLabel(cat)}
                  isRTL={isRTL}
                />
              )}
            />

            {/* 5) Methods — MUCH slower + left-to-right */}
            <InfiniteMarquee
              items={shuffledMethods}
              direction="right"
              durationSec={220}
              itemGapPx={10}
              ariaLabel="Dream interpretation methods"
              renderItem={(m) => {
                const cat = categoryById.get(m.categoryId);
                return (
                  <MethodTag
                    icon={cat?.iconFa ?? "◻︎"}
                    label={methodLabel(m)}
                    isRTL={isRTL}
                  />
                );
              }}
            />
          </div>

          {/* 6) Clarification heading 1 (arrow + text) */}
          <div
            className="flex items-center"
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              gap: "8px",
            }}
          >
            <span
              className="text-[18px]"
              style={{ color: "var(--color-pink-600, #FF5D8F)" }}
              aria-hidden="true"
            >
              {isRTL ? "→" : "←"}
            </span>
            <div
              className="text-[18px] font-medium"
              style={{ color: "var(--color-pink-600, #FF5D8F)" }}
            >
              {t("welcome.clarifyTitle1")}
            </div>
          </div>

          {/* 7) Text blocks */}
          <div className="space-y-4">
            <p className="text-[16px] font-normal leading-[1.42] text-[var(--color-neutral-600)]">
              {t("welcome.paragraph1")}
            </p>
            <p className="text-[12px] font-normal leading-[1.62] text-[var(--color-neutral-600)]">
              {t("welcome.paragraphSmall1")}
            </p>
          </div>

          {/* 9) Clarification heading 2 */}
          <div
            className="flex items-center"
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              gap: "8px",
            }}
          >
            <span
              className="text-[18px]"
              style={{ color: "var(--color-pink-600, #FF5D8F)" }}
              aria-hidden="true"
            >
              {isRTL ? "→" : "←"}
            </span>
            <div
              className="text-[18px] font-medium"
              style={{ color: "var(--color-pink-600, #FF5D8F)" }}
            >
              {t("welcome.clarifyTitle2")}
            </div>
          </div>

          {/* 10) Two privacy boxes (X + text RTL aware) */}
          <div className="grid gap-4">
            {[1, 2].map((idx) => (
              <div
                key={idx}
                className="bg-white p-4"
                style={{
                  borderRadius: "0.5rem",
                  borderRight: "4px solid var(--color-neutral-900, #191919)",
                  borderBottom: "4px solid var(--color-neutral-900, #191919)",
                }}
              >
                <div
                  className="flex items-start"
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    gap: "10px",
                  }}
                >
                  <span
                    className="text-[16px] leading-none"
                    style={{ color: "var(--color-neutral-900,#191919)" }}
                    aria-hidden="true"
                  >
                    ×
                  </span>
                  <div className="text-[16px] font-normal leading-[1.42] text-[var(--color-neutral-900,#191919)]">
                    {t(`welcome.privacyBox${idx}`)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 11) Emphasis */}
          <div className="text-[22px] font-semibold text-[var(--color-neutral-900,#191919)]">
            {t("welcome.emphasis")}
          </div>

          {/* 12) Terms title */}
          <div className="text-[18px] font-medium" style={{ color: "var(--color-pink-600, #FF5D8F)" }}>
            {t("welcome.termsTitle")}
          </div>

          {/* 13) Terms blocks + bullets (section 5) */}
          <div className="space-y-6">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <div key={n}>
                <div className="text-[12px] font-normal leading-[1.62] text-[var(--color-neutral-600)]">
                  {t(`terms.${n}.title`)}
                </div>

                <div className="mt-2 text-[12px] font-light leading-[1.62] text-[var(--color-neutral-600)]">
                  {t(`terms.${n}.text`)}
                </div>

                {n === 5 ? (
                  <ul
                    className="mt-3 list-disc text-[12px] font-normal leading-[1.62] text-[var(--color-neutral-600)]"
                    style={{
                      paddingInlineStart: isRTL ? "0" : "18px",
                      paddingInlineEnd: isRTL ? "18px" : "0",
                    }}
                  >
                    {/* keys exist as terms.5_bullets.b1...b5 in your trans.json */}
                    <li>{t("terms.5_bullets.b1")}</li>
                    <li>{t("terms.5_bullets.b2")}</li>
                    <li>{t("terms.5_bullets.b3")}</li>
                    <li>{t("terms.5_bullets.b4")}</li>
                    <li>{t("terms.5_bullets.b5")}</li>
                  </ul>
                ) : null}
              </div>
            ))}
          </div>

          {/* 14) Action buttons */}
          <div className="grid gap-3">
            <ActionButton
              icon="↪"
              label={t("welcome.actions.a")}
              onClick={onContinue}
              isRTL={isRTL}
            />

            {/* IMPORTANT: do NOT navigate internally here.
                Use onLearnMore (your app already knows how to show NoConsent/TermGate flow). */}
            <ActionButton
              icon="✕"
              label={t("welcome.actions.b")}
              onClick={onLearnMore}
              isRTL={isRTL}
            />

            <ActionButton
              icon="⬇"
              label={t("welcome.actions.c")}
              onClick={onInstall}
              isRTL={isRTL}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
