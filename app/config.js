// selectors for DOM elements
$helpIcon = $('[data-role="helpIcon"]'),
$counter = $('[data-role="counter"]'),
$authorAccordion = $('[data-role="authorAccordion"]'),
$slideContainer = $('[data-role="slides"]');
$dimmer = $('[data-role="dimmer"]')
$button = {
  // wrapper for slide movement buttons
  wrapper: $('[data-role="buttons"]'),
  // slide movement
  first: $('[data-role="btnFirst"]'),
  prev: $('[data-role="btnPrev"]'),
  black: $('[data-role="blackScreen"]'),
  jump: $('[data-role="jumpToSlide"]'),
  next: $('[data-role="btnNext"]'),
  last: $('[data-role="btnLast"]'),
  // ui toggler
  toggle: $('[data-role="toggle"]')
};
about = {
  authorEmail: $('[data-role="authorEmail"]'),
  authorGitHub: $('[data-role="authorGitHub"]'),
  appVersion: $('[data-role="appVersion"]')
};
