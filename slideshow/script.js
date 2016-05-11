/**
 * This script tag contains all the functionality and event listeners for the
 * content of the slides. Functions and events can access the App methods to
 * execute events like moving through slides directly.
 * Event listeners will activate immediately.
 *
 * @var {object} _slidesEvents contains the onEnter and onLeave events for the
 *               single slides. the object will be loaded and used by the app
 *               and every method will be called when needed.
                 i.e.: _slidesEvents.1.onLeave will be called when leaving the
                       second slide (index starts from 0)
 */
var $s1Btn = $('#s1_btn') 

$s1Btn.on('click', function () {
  console.log('You triggered an App event from a slide!')
  $s1Btn.transition('remove looping')
  /** accessing App methods to control the slides */
  Slides.go('next')
});

/**
 * this object will be automatically loaded inside Slides.config.events and
 * contains user defined callbacks for the slides onEnter and onLeave events
 */
_slidesEvents = {
  1: {
    onEnter: function () {
      // console.log('entering slide 0')
        /**
         * hook is called in the first load too, so it can activate stuff
         */
        console.log('entering first slide')
        setTimeout(function () {
        $s1Btn.transition('set looping').transition('jiggle', '1000ms')
        }, 800);
    },
    onLeave: function () {
      console.log('leaving first slide')
      /** removing the button looping */
      $s1Btn.transition('remove looping')
    },
  },
  2: {
    onEnter: function () { console.log('entering second slide') },
    onLeave: "I'm not a function so I don't count :(",
  }
};
