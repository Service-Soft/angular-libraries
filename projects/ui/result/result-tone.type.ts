/**
 * What a result page tells, which sets its icon and color: neutral for anything else, like maintenance, a note, that
 * something worked, a warning, or that something failed. The tones of ui-callout, without its promo, as a result is
 * never an offer.
 */
export type ResultTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';