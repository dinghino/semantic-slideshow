// selectors for DOM elements
$helpIcon         = $('[data-role="helpIcon"]'),
$slidesHelpPopup  = $('[data-role="helpPopup"]'),
$counter          = $('[data-role="counter"]'),
$authorAccordion  = $('[data-role="authorAccordion"]'),
$slideContainer   = $('[data-role="slides"]');
$dimmer           = $('[data-role="dimmer"]')

$button           = {};
/** wrapper for slide movement buttons */
$button.wrapper   = $('[data-role="buttons"]');
/** slide movement */
$button.first     = $('[data-role="btnFirst"]');
$button.prev      = $('[data-role="btnPrev"]');
$button.black     = $('[data-role="blackScreen"]');
$button.next      = $('[data-role="btnNext"]');
$button.last      = $('[data-role="btnLast"]');
/** ui toggler */
$button.toggle    = $('[data-role="toggle"]')

/** about spaces in the UI */
about             = {};
about.authorEmail = $('[data-role="authorEmail"]');
about.authorGitHub= $('[data-role="authorGitHub"]');
about.appVersion  = $('[data-role="appVersion"]');
