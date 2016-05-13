/**
 * @file
 *
 * This file provides global variables containing jQuery selected DOM elements
 * for the UI components. this allow to have them globally declared and usable
 * from the app and from user custom scripts for slideshows.
 */

/** button that toggles the help/about popup */
$helpIcon         = $('[data-role="helpIcon"]');
/** help/about popup container */
$slidesHelpPopup  = $('[data-role="helpPopup"]');
/** about section of the popup */
$authorAccordion  = $('[data-role="authorAccordion"]');
/** main container for the whole slide counter/jumper elements */
$counter          = $('[data-role="counter"]');
/** wrapper element that will contain the slides */
$slideContainer   = $('[data-role="slides"]');
/** page dimmer */
$dimmer           = $('[data-role="dimmer"]');

/**
 * Contains all the UI buttons references. Can contain extra elements added from
 * {@link ./app.js}
 * @type {Object}
 */
$button           = {};
/** wrapper for ALL the control buttons (movement, dimmer etc...) */
$button.wrapper   = $('[data-role="buttons"]');
/** go first slide button */
$button.first     = $('[data-role="btnFirst"]');
/** go previous slide button */
$button.prev      = $('[data-role="btnPrev"]');
/** dimmer toggle button */
$button.black     = $('[data-role="blackScreen"]');
/** go next slide button */
$button.next      = $('[data-role="btnNext"]');
/** go last slide button */
$button.last      = $('[data-role="btnLast"]');

/** button used to toggle the UI */
$button.toggle    = $('[data-role="toggle"]')

/**
 * selector for the label part of the counter (<strong>NOT</strong> the label
 * itself, that you can find using $.find('.labelText')
 */
$counterLabel     = $('[data-role="jumpToSlide"]')

/** input element for the <em>jump to slide</em> functionality */
$jumperInput      = $('[data-role="jumperInput"]')
/** button to confirm a jump to a slide */
$button.jump      = $('[data-role="jumperBtn"]')

/**
 * containers for the about section of the popup
 * @type {Object}
 */
$about             = {};
/** space for the author email */
$about.authorEmail = $('[data-role="authorEmail"]');
/** space for the github link of the author */
$about.authorGitHub= $('[data-role="authorGitHub"]');
/** app version label */
$about.appVersion  = $('[data-role="appVersion"]');
