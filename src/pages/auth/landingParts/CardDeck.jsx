/**
 * CardDeck — s87 (25 Aug 2026), the mobile-homepage diet.
 *
 * The landing page measured 15,628px tall at 390x844 — ~18.5 screens — and
 * the bulk of it was card decks (services, features, what's-new, pricing)
 * each rendering as one long single column on mobile. Nothing was wrong with
 * the CONTENT; the cost was purely vertical.
 *
 * Below md this renders its children as a horizontal snap carousel — one
 * card mostly filling the viewport with the next card peeking in from the
 * right as the swipe affordance. From md up it renders EXACTLY the grid it
 * replaced: pass the original md+/lg+ grid classes via gridClassName and
 * they apply verbatim, so desktop is untouched by construction.
 *
 * The -mx-6 px-6 pair bleeds the scroll area through <Section>'s px-6
 * padding so cards scroll edge-to-edge instead of clipping at the gutter.
 */
import React from 'react';

export default function CardDeck({ gridClassName = '', cardClassName = '', children }) {
  return (
    <div
      className={
        'flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 ' +
        'md:grid md:gap-5 md:overflow-visible md:pb-0 md:mx-0 md:px-0 ' +
        gridClassName
      }
    >
      {React.Children.map(children, (child) =>
        child == null ? child : (
          <div className={'snap-start shrink-0 w-[82vw] max-w-[330px] md:w-auto md:max-w-none md:shrink ' + cardClassName}>
            {child}
          </div>
        )
      )}
    </div>
  );
}
