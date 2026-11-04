// Opening the Learn tab at a given place (a lesson, a practice scenario or the first-PR guide) from anywhere in Kitty.
export const LEARN_FOCUS_KEY = 'kitty:learn-focus';
export type LearnFocus = { view: 'lessons'; skill?: string } | { view: 'practice'; scenario?: string } | { view: 'first-pr' };
