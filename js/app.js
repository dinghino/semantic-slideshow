/**
 * @file
 * HTML Slideshow presenter.
 * This whole app is a style execrise to regain confidence with javascript ES5,
 * jQuery and semantic-ui framework. It's purpose is to have an instrument to
 * create an slideshow using simple <tt>HTML</tt> pages and <tt>javascript</tt>
 * configuration files and settings. This can allow a developer to quickly create
 * an insider slideshow to show progress on some code, live while presenting, to
 * have multiple team members create multiple slides that can work together with
 * no issues...
 * The App itself is a central state managed application, that uses
 * <tt>{@link App.setState}</tt> to modify the current state and triggers, if
 * needed, behaviours into the initialized main components (<tt>namespaces</tt>)
 * It dynamically loads slideshows and scripts from a specified folder.
 */

// NOTE: **developing information for documentation**
// jsdoc terminal call from ./semantic-slideshow:
// jsdoc ./js/app.js ./js/main.js ./app/config.js -d ./docs -t ../../node_modules/minami
// evaluate this file, main.js and config.js from ./app
// uses minami template from wamp/node_modules and put everything in semantic-slideshow/docs


var I = 0
/**
 * Logged when App.init runs, used for debugging purposes.
 * Can be used to create a elapsed timer for the app to be attached somewhere
 * and counting
 * @type {Date}
 */
var INIT_TIME

/**
 * Main application object. Handles events, initialization and general state of
 * the app.
 * This is the primary interface for the user to handle changes in the application
 * using App.setState() method.
 *
 * @version 0.9.4
 * @author Daniele Calcinai
 * @namespace
 */
var App = {
  /**
   * author information and contacts. used to populate the about section
   * @type {Object}
   * @private
   */
  info: {
    author: 'Daniele Calcinai',
    email: 'dinghino@gmail.com',
    gitHub: 'https://github.com/dinghino',
    version: '0.9.4'
  },
  /**
   * Define the array length for App._prevStates
   * @type {Number}
   * @private
   */
  _maxStateHistory: 10,
  /**
   * stores App._maxStateHistory objects, being old App.state
   * @type {Array}
   * @private
   */
  _prevStates: [{ ready: true }],
  /**
   * Default global config for the app that can be overridden while calling
   * {@link App.init}
   * @type {Object}
   */
  config: {
    /**
     * Log events from the app, including detailed state changes
     * @type {Boolean}
     */
    verbose: false,
    /**
     * Turn on the semantic-ui default debugger. can't be set after calling {@link App.init}
     * @type {Boolean}
     */
    semanticLog: true
  },
  /**
   * Current state of the app. should be handled <strong>ONLY</strong> with .setState()
   */
  state : {
    /**
     * <tt>true</tt> if UI is toggled
     * @type {Boolean}
     */
    showUI: false,
    /**
     * <tt>true if the counter needs to be shown</tt>
     */
    showCounter: false,
    /**
     * <tt>true</tt> if app is initialized. internally managed
     * @type {Boolean}
     */
    initialized: false,
    /**
     * <tt>true</tt> if custom events are present and initialized
     * @type {Boolean}
     */
    events: false,
    /**
     * <tt>true</tt> if active
     * @type {Boolean}
     */
    dimmer: false,
    /**
     * Total number of slides in the current slideshow
     * @type {Number}
     */
    totalSlides: 0,
    /**
     * currently shown slideshow
     * @type {Number}
     */
    currentSlide: 1,
    /**
     * previous slide shown. Used and set in transitions
     * @type {Number}
     */
    prevSlide: undefined,
    /**
     * Next slide to show. Usually set with {@link Slides.go} and used in transitions
     * @type {Number}
     */
    nextSlide: undefined,

    timer: {
      /** @type {Number} Interval for the timer to update */
      interval: 1000,
      /** @type {Number} holds the start time of the slideshow */
      start: 0,
      /** @type {Number} holds the last time the timer has been paused */
      pausedAt: 0,
      /** @type {Number} holds the last time the timer started */
      resumeAt: 0,
      /** @type {String} current timer state */
      state: false,
      /** @type {Array} contains duration of the pauses done */
      pauses: []
    }
  },

  /**
   * Primary API for the application. changes the internal state object.
   * Has different callbacks for default and user definable actions based on
   * state changes
   * @param {object} nextState requested changes in the application
   */
  setState: function (nextState) {
    var verbose = App.config.verbose;
    if(verbose) console.time('this set state took');


    // validation for arguments
    if (typeof nextState !== 'object') {
      throw new Error('new state should be an object!')
    };
    /**
     * Assign oldState and newState objects properties
     */
    var prevState = $.extend(true, {}, App.state),
        /** {object} merge the old state with the new props passed */
        newState  = $.extend(true, App.state, nextState);

    /** add last state as first of _prevStates */
    App._prevStates.unshift(prevState)

    /** if length of array is > 10, remove oldest one */
    if(App._prevStates.length > App._maxStateHistory) { App._prevStates.pop() }

    /**
     * check the changes in the state and return a diff object
     * {objects} differences between old state and new state
     *                 diff is structured as diff[propName]: {prev, next}
     */
    var diff = App.checkStateDiffs(prevState, newState)
    /** if requested log the state update informations */
    if (verbose) App.__setStateLog(prevState, nextState, diff, newState)

    /**
     * update current state with the new object
     * @private
     */
    App.state = newState


    /** if <diff> is popuplated handle the change */
    if (diff) App.onStateChange(prevState, newState, diff);

    /** call the user defined method */
    App.didUpdate(prevState);
  },

  /**
   * retrieve a state object from the history (_prevStates) or the whole array
   * if no argument is specified
   * @param  {number} idx optional. range from 0 to App._maxStateHistory
   */
  getOldState: function (idx) {
    /** if no idx is passed return the whole array */
    if(typeof idx !== 'number') return App._prevStates;

    /** {Boolean} wether the passed index is a valid OLD App.state  */
    isOldState = typeof idx === 'number' && 0 >= idx <= App._maxStateHistory;

    if (!isOldState) {
      var err = 'passed index is not valid. values from 0 to '
                + App._maxStateHistory + ' are valid';

      throw new Error(err)
    };

    /** find the requested old state */
    var oldState = App._prevStates[idx]

    /** check if it's an object. if not (undefined) return it */
    if (typeof oldState === 'object') return oldState;

    /** if oldState is not an {object} throw an error just in case */
    throw new Error('requested old state index do not exists yet.')
  },

  /**
   * evaluate the differences between two state objects
   * @private
   * @param  {object} prevState - a previous state of the app
   * @param  {object} nextState - a next state of the app
   * @return {object|Boolean}     if diffs exists return an object containing
   *                                the differences from prevState to nextState
   *                                otherwhise return false
   */
  checkStateDiffs: function (prevState, nextState) {
    var keys    = Object.keys(nextState),
        getDiff = false
        /** log strings */
        changes  = {};

    keys.forEach(function (k, i) {
      /** check for changes in present properties */
      var changed = prevState[k] !== nextState[k];

      if (changed) {
      getDiff = true;
      /** {Object} store changes informations */
      var change  = { previous: prevState[k], next: nextState[k] };

      /** assign newly created object to changes[k] */
      changes[k] = change;
      }
    })
    /** return the objects containing the changes */
    if(getDiff) return changes
    return false
  },

  /**
   * Default behaviour on state changes. triggers app events.
   * should only be used internally and not accessed from the user
   * @param  {object} prevState previous state of the app
   * @param  {object} nextState next state of the app
   * @param  {object} diff      must contains the diffs within the
   *                            <strong>passed</strong> states
   * @private
   */
  onStateChange: function (prevState, nextState, diff) {
    /** {array} property changed */
    var d       = diff,
        changed = Object.keys(d),
        pS      = prevState,
        nS      = nextState;

    /** toggle the UI on state initialization */
    if(d.initialized && Slides.config.showButtons) Interface.toggle()

    /** activate the dimmer if state changed */
    if (d.dimmer) Dimmer.set(nS.dimmer);

    /** Toggle the ui if requested */
    if (d.showUI) Interface.toggleUI();
    if (d.showCounter) Counter.toggle();
    /**
     * if nextSlide changed and is present in nextSlide, render the slides.
     * evaluation of the next slide number is already done. after animating state
     * will get the new current (should be old next), new prev and undefined next
     */
    if (d.nextSlide && nS.nextSlide) Slides.render();

    /**
     * if nexSlide changed and is falsy means a transition has been executed
     * and stuff in the UI needs to be updated
     */
    if (d.nextSlide && !nS.nextSlide) {
      Counter.set();
      Interface.updateButtons();
      Slides.updateHash();
    };
  },

  /**
   * Similar to react's componentDidUpdate, is called after the app updated
   * its state and the old state is set to into the history
   * @param  {object} prevState App.state before the update
   */
  didUpdate: function (prevState) {
    // user definable function, can be used to trigger stuff if App.state[prop] !== prevState[prop]
  },

  /**
   * be verbose about changes in App.state and go full console!
   * Must be called after the {@link App.setState} completed the update
   * @private
   * @param  {object} oldState  - the immediately previous state of the app
   * @param  {object} nextState - the changes that triggered the state change
   * @param  {object} changes   - a diff object created with {@link App.checkStateDiffs}
   * @param  {object} newState  - the newly created state
   */
  __setStateLog: function (oldState, nextState, changes, newState) {
    var propsChanged = changes ? Object.keys(changes).length : 0,
        now          = new Date().getTime(),
        timestamp    = ((now - INIT_TIME) / 1000).toFixed(3) + 's'

    console.groupCollapsed(
      '[%s][%d] updating state with %d changes:',
      timestamp, I++, propsChanged, nextState)
      console.trace('update callers chain')
      console.groupCollapsed('changes table')
        console.table(changes)
      console.groupEnd()
      console.groupCollapsed('state objects')
        console.log('prev:', oldState)
        console.log('next:', newState)
      console.groupEnd()
    console.timeEnd('this set state took')
    console.groupEnd()

  },

  /**
   * Initialize the whole app, starting sub .init() method, activating event
   * listeners and setting default parameters here and there
   * @param  {object} [config] configuration object for the app. will merge with {@link App.config}
   * @private
   */
  init: function (config) {
    /** save the time of the App.init to be used in logs and stuff */
    INIT_TIME = new Date().getTime()
    /** merge custom config for the app. used primarly to toggle debugging */
    if (config) {
      console.info('custom global config detected! merging', config)
      App.config = Object.assign(App.config, config)
    };

    /** enable semantic-ui debugger if verbose is true */
    if (App.config.semanticLog) $.site('enable debug');

    /** add custom app event listeners to objects and DOM */
    App._events()
    /** set the about section content */
    App.setAboutInfo()
    /** initialize the buttons and their events */
    Interface.init()
  },

  /**
   * validate the selected folder name trying to GET file <tt>1.html</tt>.
   * Method is used before calling {@link App.loadSlideshow} to verify that the
   * folder exists, avoiding unwanted initialization.
   * @param  {string} folderName folder to validate
   * @param  {func}   success    called if folderName is found
   * @param  {func}   failure    called if foldername is NOT found
   * @private
   */
  validateSlideshowFolder: function (folderName, onSuccess, onFail) {
    // define the path to the test file
    var test    = folderName + '/1.html',
        verbose = App.config.verbose;

    $.get(test)
    .success(function () {
        if (verbose) console.info(folderName + '/ found! proceeding')
        if (onSuccess) onSuccess();
      })
    .fail(function () {
        if (verbose) console.warn(folderName + '/ NOT found! Check it');
        if (onFail) onFail();
      }
    )
  },

  /**
   * event triggers
   */

  /**
   * Triggers the loading of a slideshow, using the passed config object to
   * set it up
   * @param  {object} config The configuration file for the slideshow
   *                         is compiled from the UI form and dispatched
   *                         when the slideshow has been validated.
   */
  loadSlideshow: function (config) {
    $(App).trigger('app:loadSlides', [config])
  },

  /**
   * Triggers the update {@link Slides.config} merging the passed config object
   * @param  {object} config config object as in {@link App.loadSlideshow}
   * @private
   */
  updateConfig: function (config) {
    $(App).trigger('app:set-slide-config', [config])
  },

  /**
   * Try to get the custom script file from the slideshow folder then, depending
   * the result of $.getScript(), proceed initializing it or directly to app
   * finalization
   *
   * @param  {string} fileName will be used in a later release allowing custom names for script.js
   * @private
   */
  fetchEvents: function (fileName) {
    var verbose = App.config.verbose;
    // default fileName to fetch the script
    if (!fileName) fileName = 'script'

    // if getEvents is true don't even try to fetch the custom .js
    if (!Slides.config.getEvents) {
      App.slidesReady();
      return
    }
    // create the path-to-file for the custom script
    var path = Slides.config.folder + '/' + fileName + '.js'

    // try to get the script. if success enable it, else jump to finalizing
    $.getScript(path)
    .done(function (script, status) {
      if (verbose) console.info('script found!', status, 'activating.')
      App.enableEvents();
    })
    .fail(function (jqxhr, settings, exception) {
      if (verbose) console.warn(
        'no extra script found in "' + Slides.config.folder + '/"', jqxhr.status
      )
      App.slidesReady();
    });
  },

  /**
   * If called try to enable the custom script file, searching for the config object
   * in <tt>window._slidesEvents</tt>, storing it in <tt>Slides.config.events</tt>
   * and, just to be sure, if it's not an object but a function try to run it.
   * @private
   */
  enableEvents: function () { $(App).trigger('app:enable-custom-events') },

  /**
   * Confirm the activation of custom events in {@link Slides.config} or
   * finalize the app initialization
   * @private
   */
  slidesReady: function () { $(App).trigger('app:slides-ready') },

  /**
   * Finalize the initialization of the app, setting initial things, removing the
   * dimmer and calling the first slides onEnter event (if present)
   * @private
   */
  finalizeApp: function () { $(App).trigger('app:finalize-init') },

  /**
   * Adds custom event listeners to {@link App}, created with jQuery.
   * @private
   */
  _events: function () {
    $(App)
    .on('app:set-slide-config', App._onSetConfig)
    .on('app:loadSlides', App._onLoadSlides)
    .on('app:slides-ready', App._onSlideShowReady)
    .on('app:finalize-init', App._onFinalizeInit)
    .on('app:enable-custom-events', App._onEnableEvents)
  },

  /**
   * Internal event handlers that are used to perfom some basic actions like
   * updating the {@link App} config and/or trigger other events to chain them
   * in a proper workflow
   * @TODO: create comments for each one of these so it's easier to know what they
   * do. make them if seems the right thing to do.
   * @private
   */
  _onLoadSlides: function (e, config) {
    // initia lizing slideshow
    App.updateConfig(config)
    Slides.init()
  },
  _onSetConfig: function (e, config) {
    // assigning configuration to app
    Slides.config = Object.assign(Slides.config, config)
  },
  _onSlideShowReady: function (e) {
    Interface.updateButtons()
    // if custom events are present in config and not yet executed run that
    // first before finalizing initialization
    if(Slides.config.events && !App.state.events) {
      App.enableEvents()
      return
    // if no extra events are presents or are already set, finalize init
    } else { App.finalizeApp() };
  },
  _onFinalizeInit: function (e) {
    // if app is already initialized warn the user
    if (App.state.initialized === true) {
      console.warn('initialization called more than once. check it!')
      return
    }

    // set initial state for the buttons.
    // if necessary do stuff to the UI
    Counter.init();

    // remove the dimmer
    setTimeout(function () {
      App.setState({
        dimmer: false,
        initialized: true
      })
    }, 600)

    // call the onEnter event for the first slide after loading
    Slides._onEnter(App.state.currentSlide)
  },
  _onEnableEvents: function (e) {
    console.log('activating events')
    Slides.config.events = window._slidesEvents
    var events = Slides.config.events
    // if events exists and is  function execute.
    // timeout is needed for the DOM creation
    events && typeof events === 'function'
      ? setTimeout(events, 50)
      : null

    // set events as executed
    App.setState({ events: true })
    // run init validation again
    App.slidesReady()
  },

  /**
   * utility methods
   */

  /**
   * Update the about section of the application using the information stored
   * inside {@link App.info} or a custom info object. can be called to customize
   * the slideshow.
   * @param {object} [info] the object used to populate the about.
   * @example
   * info = {
   *   version: 1.0,
   *   email: 'johnDoe@slideshows.org',
   *   github: 'https://github.com/superJohnDoe'
   * };
   */
  setAboutInfo: function (info) {
    // use default if nothing is provided
    if (!info) info = App.info;

    if(!info.email) about.authorEmail.hide()
    if(!info.gitHub) about.authorGitHub.hide()

    about.appVersion.text(info.version)
    about.authorEmail.attr('href', ('mailto:'+ info.email))
    about.authorGitHub.attr('href', info.gitHub)
  },
};

/**
 * Controller for the slideshow. contains Slides.config, passed down on
 * initialization of the slideshow by {@link Slides.init}
 * Secondary API. exposes controls to manage state changes for the slideshow
 * such as {@link Slides.go} to request a change to a slide.
 *
 * @namespace
 */
var Slides = {
  /**
   * DOM Element that will contain our slides
   * @type {element}
   */
  container: $slideContainer,

  /**
   * Configuration for the application. contains default properties that will
   * be overwritten when initializing a new slideshow.
   * @type {Object}
   */
  config: {
    /**
     * Name of the folder that contains the slides
     * @memberof Slides.config
     * @type {String}
     */
    folder: 'slides',

    /**
     * Hash string for the browser address and the <tt>id attribute</tt> for the
     * slides containers. Will be setup with the number of the slide after
     * @memberof Slides.config
     * @type {String}
     * @example
     * Slides.config.hash = 'slide' // for slide 1 will turn in
     * <div id="slide1"... />
     */
    hash: 'slide',

    /**
     * Default animations for slide's <tt>semantic-ui transition module</tt>
     * @memberof Slides.config
     * @type {Object}
     * @property {String} left - used when going left
     * @propertt {String} right - used when going right
     */
    transition: {
      left: 'fade left',
      right: 'fade right',
    },

    /** {String} used when creating the slides to override semantic-ui */
    defaultSlideStyle: 'display: -webkit-flex!important; display: flex!important',

    /** {bool} if true try to get the custom .js file for the slideshow */
    getEvents: false,

    /** start with button toggled on or off */
    showButtons: true
  },

  /**
   * initialize the slideshow, enabling event listeners, emptying the DOM element
   * that will contain the slideshow, loading content and activating other basic
   * event listeners.
   * @private
   */
  init: function () {
    /** INITIALIZATION */

    /** toggle the dimmer to 'show', hiding content loading */
    App.setState({ dimmer: true })
    Slides.addEventListeners()

    /** reset app initialization to false if needed */
    App.state.initialized === true ? App.setState({ initialized: false }) : null;

    /** empty the slide container */
    Slides.container.empty();

    /** START LOADING */
    Slides.getContent()

    /** INITIAL EVENTS */

    /**  listen to key press events */
    Interface.addKeyPressEvents();

    Slides.updateHash();
  },

  /**
   * Add custom jQuery event listener for the Slides module
   * @private
   */
  addEventListeners: function () {
    $(Slides).on('slides:request-transition', Slides.evaluateTransition)
  },

  /**
   * Uses jQuery to create the DOM element(s) that will contain the slides
   * @param  {Number} idx - the index of the slide, starting from 1
   * @return {node}       - DOM element {<div>} that contains the slide
   * @private
   */
  _createSlide: function (idx)  {
    var hash = Slides.config.hash;

    return $('<div>', {
      id: hash + idx,
      class: idx > 1 ? 'transition hidden' : 'transition visible',
      style: idx === 1
                ? 'display: -webkit-flex!important; display: flex!important'
                : ''
    })[0]
  },

 /**
  * fetch content from folder specified in {@link Slides.config} until files are
  * found, then proceed with the activation calling other functions
  * @private
  */
  getContent: function () {
    if (App.config.verbose) console.log('fetching slides')
    // local config
    var frag        = document.createDocumentFragment(),
        hash        = Slides.config.hash,
        slidesQty   = 1,
        folder      = Slides.config.folder,
        loadStatus  = 'OK',
        i = 0,
        bit;


    /** handle the error from the ajax call in case it fails */
    function handleError (e) {
      if (e.status == 0) {
        return ' Check Your Network.';
      } else if (e.status == 404) {
        console.warn('Seems we loaded the last slide. You have ', slidesQty, 'slides');
      } else if (e.status == 500) {
        return 'Internel Server Error.';
      } else {
        return 'Unknow Error.\n' + e.responseText;
      }
    };

    // fetch function for ajax request with $.get()
    function ajaxCall () {
      if (loadStatus !== 'OK') return;

      var nextSlide = folder + '/' + slidesQty + '.html';
      bit = Slides._createSlide(slidesQty)

      $.get(nextSlide)
      .fail(function (e) {
        --slidesQty
        /** error handling */
        var error = handleError(e)
        if (error) throw new Error(error);

        /**
         * Since fail means that there are no more slides to load,
         * append everything into the dom and continue configuring the slideshow
         */

        /** save slide quantity in App.state */
        App.setState({ totalSlides: slidesQty })

        /** append the fragments to the DOM into this.config.container */
        Slides.container.append(frag)

        /** execute callback function */
        setTimeout(App.fetchEvents, 0);
      })
      .success(function(data, status, xhr) {
        /** create and append the slide to the fragments */
        $(bit).append($(data)[0]);
        frag.appendChild(bit);

        if (status === 'error') loadStatus = status
        ++slidesQty
        ajaxCall()
      })
    };

    /** execute the slides fetching */
    ajaxCall()
  },

  /**
   * Calls {@link Slides.animate} with a small delay to be sure to have
   * everything updated before attempting the DOM update.
   */
  render: function () {
    /** execute the animation for the slides */
    setTimeout(Slides.animate, 10)
  },

  /**
   * evaluate transition if moving to {direction} and store into App.state
   * @param {string} direction the direction to move.
   *                 one of 'next', 'prev', 'first', 'last'
   * @private
   */
  evaluateTransition: function (e, data) {
    /** local variables */
    var currentSlide = App.state.currentSlide,
        lastSlide    = App.state.totalSlides,
        request      = data;

    /** validate and request transition if typeof data === number */
    if (typeof request === 'number') {
      if (request > 0 && request <= lastSlide) {
       App.setState({ nextSlide: request })
       return
      }

      if (request < 1) {
        console.warn('requested an invalid slide: #%d. going to first', request)
        App.setState({ nextSlide: 1 })
        return
      }

      if (request > lastSlide) {
        console.warn('requested slide [%d] do not exists. going to last', request)
        App.setState({ nextSlide: lastSlide})
        return
      }
      throw new Error('was trying to go slide %s, but it seems you crashed me.')
    }

    /**
     * update object properties depending on where we are going.
     * if case is no match throw an error | shouldn't happen from UI
     */
    switch (request) {
      case 'next':
        App.setState({ nextSlide: currentSlide + 1 })
        break

      case 'prev':
        App.setState({ nextSlide: currentSlide - 1 })
        break

      case 'first':
        App.setState({ nextSlide: 1 })
        break

      case 'last':
        App.setState({ nextSlide: lastSlide })
        break

      default:
        throw new Error('Error while moving... what did you do? You nasty...')
    }
  },

  /**
   * high level API. tries to move the slides in a direction
   * @param  {string|number} nextSlide one of 'next', 'prev', 'first', 'last'
   *                                   can also be a number to JUMP directly
   *                                   to a slide passing a number.
   */
  go: function (nextSlide) {
    $(Slides).trigger('slides:request-transition', [nextSlide])
  },

  /**
   * Hook for onEnter event of the given slide number. Automatically rertrieves
   * events to hook to from {@Slides.config}.events that are passed on by the
   * <tt>user-defined config object for the slideshow</tt> (see readme) and is
   * called by <tt>semantic-ui transition</tt> module when entering a slide.
   * If callback exists and is a function then is called, otherwise is not.
   *
   * @param  {Number} slide the number of the slide to handle
   * @private
   */
  _onEnter: function (slide) {
    var events        = Slides.config.events,
        slidesEvents  = {};

    if (events) { slidesEvents = Slides.config.events[slide] };

    if (!slidesEvents) return;
    var fn = slidesEvents.onEnter
    // end the function if event is not present
    if (!fn || typeof fn !== 'function') return

    fn()
  },

  /**
   * Similar to {@Slides.onEnter} but for the onLeave event.
   * @param  {Number} slide - The index of the slide to handle
   * @private
   */
  _onLeave: function (slide) {
    var events        = Slides.config.events,
        slidesEvents  = {};

    if (events) { slidesEvents = Slides.config.events[slide] };

    if (!slidesEvents) return;
    var fn = slidesEvents.onLeave

    // end the function if event is not present
    if (!fn || typeof fn !== 'function') return

    fn()
  },

  /**
   *  Handles the animation of the slideshow, using <tt>semantic-ui transition module</tt>
   *  Uses {@link App.state} and {@Slides.configto retrieve the information on how to
   *  animate which slides. Is called as final callback of the chain started with
   *  {@link Slides.go} directly from {@link App.setState}
   *
   * @private
   */
  animate: function () {
    var prevSlide   = App.state.currentSlide,
        nextSlide   = App.state.nextSlide,
        slides      = Slides.container.children(),
        hash        = Slides.config.hash;
        prev        = '',
        next        = '',
        transition = {
          enter: '',
          leave: ''
        };

    /**
     * Get the dom elements corresponding the slides to animate. also works as
     * validator for the passed values
     */
    if (typeof prevSlide === 'number') prev = $('#'+ hash + prevSlide);
    if (typeof nextSlide === 'number') next = $('#'+ hash + nextSlide);

    if (next.length === 0 || prev.length === 0) {
      throw new Error(
        'Error while trying to animate the slideshow',
        '\nSeems we couldn\'t find the slides to animate')
    }

    /** set the animations to use for the transition */
    if (prevSlide > nextSlide) {
      transition.leave = Slides.config.transition.left
      transition.enter = Slides.config.transition.right
    } else {
      transition.leave = Slides.config.transition.right
      transition.enter = Slides.config.transition.left
    }

    // update DOM
    prev.transition({
      animation: transition.leave,
      // handle the event listeners
      onStart: function () {
        /** disable transition controls to avoid mess */
        Interface.disableTransitions()
        /** call the onLeave method for current slide */
        Slides._onLeave(prevSlide)
      }
    })
    next.transition({
      animation: transition.enter,
      onStart: function () {
        /** activate onEnter for nextSlide slide */
        Slides._onEnter(nextSlide)
      },
      // handle the event listeners
      onComplete: function () {
        Interface.restoreTransitions()
      }
    })

    /** update the state object with the new slides status */
    App.setState({
      currentSlide: nextSlide,
      prevSlide: prevSlide,
      nextSlide: undefined
    })
  },

  /**
   *  update the address on the browser using {@link App.state} data
   *
   * @private
   */
  updateHash: function () {
    var hash  = Slides.config.hash,
        slide = App.state.currentSlide;

    // update the address hash
    location.hash = hash + slide
  }
};

/**
 * Handles the counter for the slide and the slide jumper behaviour
 * @namespace
 */
var Counter = {
  /**
   * Initialize the counter component and its functionalities.
   * calls {@link Counter.set} to set initial state
   *
   * @private
   */
  init: function () {
    /** set counter initial state */
    Counter.set()
  },

  /**
   * Set the value of the slides counter label to the value stored inside
   * {@link App.state}.currentSlide.
   * Gets invoked automatically during in {@link Counter.init) when finalizing
   * the loading of the slideshow and every time there is a change in the state
   * regarding the slides position, by {@link SLides.animate}.
   *
   * @private
   */
  set: function () {
    var current = App.state.currentSlide,
        total   = App.state.totalSlides,
        /** {string}  label text */
        text    = current + ' of ' + total,
        /** {node} DOM element for the label text */
        $label  = $counter.find('.labelText');

    /** update the label value */
    $($label[0]).text(text)
    $jumperInput.val(current)
  },

  /**
   * call semantic-ui transition to show or hide the Counter
   */
  toggle: function () { $counter.transition('fly up') }
}

/**
 * Handles the events for the control buttons rendered on screen
 * @namespace
 */
var Interface = {
  /**
   * Initialize parts of the UI and related event listeners.
   * Initialize the Dimmer with {@link Dimmer.init} and enables
   * <tt>semantic-ui modules</tt>
   *
   * @private
   */
  init: function () {
    if (App.config.verbose) console.log('initializing interface')

    /** initialize interface with semantic-ui modules */
    Interface.enableSemanticModules()

    /** initialize the dimmer */
    Dimmer.init()

    /** add basic event listeners */
    Interface.addEventListeners()
  },

  /**
   * Activate <tt>semantic-ui modules</tt> for UI components
   *
   * @private
   */
  enableSemanticModules: function () {
    /** help popup from [?] button */
    $helpIcon.popup({
      inline: true,
      position: 'top left',
      on: 'click',
      transition: 'vertical flip',
      // close the about section when popup closes
      onHide: function () { $authorAccordion.accordion('close', 0) }
    });

    $($counterLabel).popup({
      on: 'click',
      inline: true
    })

    /** about & contacts accordion */
    $authorAccordion.accordion()
    /** dimmer settings */
    $dimmer.dimmer({
      duration: {
        show: 500,
        hide: 500
      }
    })
  },

  /**
   * Add event event listeners to UI components and {@link Interface} module.
   * events range from <tt>onClick</tt> to custom <tt>jQuery triggers</tt>
   *
   * @private
   */
  addEventListeners: function () {
    /** custom events */
    $(Interface).on('interface:toggle', Interface.onToggleUI);
    $(Interface).on('interface:update-btns', Interface.onToggleButtons);

    /** click events for slides buttons */
    Interface.addNavigationListeners();

    /** event for the toggler button */
    $button.toggle.on('click', Interface.toggle);
    /** event for the black screen button */
    $button.black.on('click', Dimmer.toggle);
    /** event handler for the dimmer click */
    $dimmer.on('click', Dimmer.toggle)

    $button.jump.on('click', function () {
      var nextSlide = $jumperInput.val();
      isInvalid = !nextSlide || isNaN(parseInt(nextSlide))
      if (isInvalid) return
      console.log(nextSlide)
      Slides.go(parseInt(nextSlide))
    })

  },

  /**
   * Add event listeners to the navigational buttons.
   * These listeners are separated from other UI components since they are
   * enabled and disabled conditionally.
   *
   * @private
   */
  addNavigationListeners: function () {
    $button.first.on('click', function () {
      Slides.go('first')
    });
    $button.prev.on('click', function () {
      Slides.go('prev')
    });
    $button.next.on('click', function () {
      Slides.go('next')
    });
    $button.last.on('click', function () {
      Slides.go('last')
    });
  },

  /**
   * Validate an e.keyCode, checking what key is pressed and returning a string
   * equal to the event that needs to be triggered
   *
   * @param  {Number} key - keyCode to evaluate
   * @return {String}       empty string if validation failed, else one of the
   *                        actions that needs to be triggered
   *
   * @example
   * // returns 'toggle'
   * Interface.validateKeyPress(84)
   *
   * @private
   */
  validateKeyPress: function (key) {
    /**
     * keycode shortcuts * legend
     *
     * right:     -> key, presenter right, SPACE
     * left:      <- key, presenter left
     * home:      HOME key
     * end:       END key
     * toggle:    T key
     * blackout:  "." (mark) key, presenter black screen
     */
    if (key === 39 || key === 34 || key === 32) return 'right';
    if (key === 37 || key === 33) return 'left';
    if (key === 36) return 'home';
    if (key === 35) return 'end';
    if (key === 84) return 'toggle';
    if (key === 190) return 'dim';

    return ''
  },

  /**
   * Callback for {@link Interface.addKeyPressEvents} to validate a keypress with
   * {@link Interface.validateKeyPress} and triggering actions based on the result
   * @param  {event} e  $.keypress event
   *
   * @private
   */
  handleKeyPress: function(e) {
    var key     = Interface.validateKeyPress(e.keyCode),
        onFirst = App.state.currentSlide === 1,
        onLast  = App.state.currentSlide === App.state.totalSlides;

    /** if one of those is true decide what to do */
    switch (key) {
      case 'left':
        e.preventDefault();
        if (onFirst) break;
        Slides.go('prev')
        break

      case 'right':
        e.preventDefault();
        if (onLast) break;
        Slides.go('next')
        break

      case 'home':
        e.preventDefault();
        if(onFirst) break
        Slides.go('first')
        break

      case 'end':
        e.preventDefault();
        if(onLast) break
        Slides.go('last')
        break

      case 'toggle':
        e.preventDefault();
        Interface.toggle();
        break

      case 'dim':
        e.preventDefault()
        App.setState({
          dimmer: !App.state.dimmer
        })

      default:
        break
    }
  },

  /**
   * Add a <tt>$.keydown</tt> event listener to <tt>document</tt> and calling
   * {@Interface.handleKeyPress} in responseText
   * @private
   */
  addKeyPressEvents: function () {
    $(document).keydown(Interface.handleKeyPress);
  },

  /**
   * Remove event listeners from transition controls, preventing the user to
   * change slide using default application controls (both UI and HIDs)
   */
  disableTransitions: function () {
    $(document).unbind('keydown', Interface.handleKeyPress)

    $button.first.off('click');
    $button.prev.off('click');
    $button.next.off('click');
    $button.last.off('click');
  },

  /**
   * Revert the removal from {@link Interface.disableTransition} and reset the
   * removed event listeners, allowing the user to navigate the slides
   */
  restoreTransitions: function () {
    Interface.addKeyPressEvents()
    Interface.addNavigationListeners()
  },

  /**
   * Trigger to update the UI buttons. change classes and rerender the buttons.
   * Called on finalization of the slideshow init and on every successful render,
   * updating the UI to the current app state.
   * @private
   */
  updateButtons: function () { $(Interface).trigger('interface:update-btns') },

  /**
   * Trigger to toggle the UI from visible to hidden
   */
  toggleUI: function () { $(Interface).trigger('interface:toggle') },

  /**
   * Update {@link App.state}.showUI to trigger the update of the Interface
   * visibility
   *
   * @private
   */
  toggle: function () {
    App.setState({
      showUI: !App.state.showUI,
      showCounter: !App.state.showCounter
    })
  },

  /**
   * Update the navigational button classes, assigning or removing the class
   * <tt>disabled</tt> if the action is not available.
   *
   * @private
   */
  onToggleButtons: function () {
    var currentSlide = App.state.currentSlide,
        lastSlide    = App.state.totalSlides,
        allButtons   = $button.wrapper.children(),
        allDisabled  = $(allButtons[0]).is('disabled');

    /**
      * should be true after the next if statement is executed.
      * prevents useless checking if there is just one slide to show
      * and buttons are already disabled.
      * could be deprecated since there is no way onToggleButtons() is called
      * if there is just one slide to show
     */
    if (lastSlide === 1 && allDisabled) return;

    /**
     * should be true just the first time it runs or never.
     * disables all the buttons if there is just one slide to show
     * and the first one is not disabled
     */
    if (lastSlide === 1 && !allDisabled) {
      for (var i = 0; i < allButtons.length; i++) {
        var button = $(allButtons[i]);
        button.addClass('disabled');
      };
      return
    };

    /**
     * check current slideshow status and toggle disable class from buttons
     * if and where needed.
     */
    if (currentSlide === 1) {
      $button.first.addClass('disabled');
      $button.prev.addClass('disabled');
    } else {
      $button.first.removeClass('disabled');
      $button.prev.removeClass('disabled');
    };

    if (currentSlide === lastSlide) {
      $button.next.addClass('disabled');
      $button.last.addClass('disabled');
    } else {
      $button.next.removeClass('disabled');
      $button.last.removeClass('disabled');
    };
  },

  /**
   * programmatically switch from visible to hidden for all the UI component,
   * allowing the user to show or hide navigation buttons, counter and other
   * elements of the UI
   *
   * @private
   */
  onToggleUI: function () { $button.wrapper.transition('fly left') }
};

/**
 * handles the page dimmer created in index.html.
 * @namespace
 */
var Dimmer = {
  states: ['show', 'hide'],

  /**
   * Forces a state onto the Dimmer component showing or hiding it
   * @param {Bool} status - <tt>true</tt> to show, <tt>false</tt> to hide the dimmer
   */
  set: function (status) { $(Dimmer).trigger('dimmer:set', [status]) },

  /**
   * Toggles the current state of the dimmer, using {@link {App.state}.dimmer.
   */
  toggle: function () { App.setState({ dimmer: !App.state.dimmer }) },

  /**
   * Initialize the Dimmer, adding jQuery event listeners
   * @private
   */
  init: function () {
    $(Dimmer).on('dimmer:set', { status: status }, Dimmer._changeState)
  },

  /**
   * change the state of the dimmer, showing or hiding it
   * @param  {object} e       event from $.trigger()
   * @param  {bool}   request true show, false hide
   *
   * @private
   */
  _changeState: function (e, request) {
    /** {string} 'show' or 'hide' depending on true|false */
    var state = request === true ? Dimmer.states[0] : Dimmer.states[1]
    $dimmer.dimmer(state)
  },
};

/**
 * Handles an elapsed time timer that can show the time from the start of the
 * slideshow.
 */
// TODO: render something on screen
// TODO: Add UI controls to start/pause
// TODO: store paused time into an array (or find another way to evaluate all the pauses)
//       this can allow to know how long you paused, how many pauses you did, get the total
//       time of the presentation (pauses included)
// TODO: Search state pattern timer example and use that
var Timer = {
  /** @type {Array} available timer states */
  states: ['stopped', 'running', 'paused'],

  /** initialize the timer and start it */
  init: function (i) {
    if (!i || i < 1000) var i = 1000

    var initState = {
      interval: i,
      // TODO: remove the start when implementing and set it in start
      start: new Date().getTime(),
      // set the timer as stopped
      state: Timer.states[0]
    };

    App.setState({ timer: initState });

    Timer.start(i)
  },

  /** calculate the elapsed time */
  _getTime: function () {
    var state = App.state.timer;

    var elapsedTime = new Date().getTime() - state.start;

    if (state.pausedAt) {
      elapsedTime -= (state.resumeAt - state.pausedAt)
    }
    return elapsedTime
  },

  /** format the calculated value to a more readable format */
  _formatTime: function () { return Math.floor(Timer._getTime() / 1000).toFixed(0) },

  /** start the interval for counting. resume timer and save resumeAt */
  start: function () {
    var timer     = App.state.timer,
        interval  = timer.interval,
        newState  = {},
        now       = new Date().getTime(),
        pauses    = timer.pauses

    if (!timer.state) {
      console.warn('Timer not initialized. initializing!')
      Timer.init()
      return
    }

    console.log(pauses, typeof pauses)

    // create the newState object properties based on the current state
    if (timer.state === 'stopped') {
      newState = { state: Timer.states[1] };
    } else {
      pauses.push({start: now, end: timer.state.pausedAt})
      newState = {
        resumeAt: now,
        state: Timer.states[1],
        pauses: pauses
      };
    };

    App.setState({ timer: newState });

    App.__slideshowElapsedTime__ = setInterval(Timer.render, interval, interval)
  },
  /** pause the slideshow, clearing the interval and saving pausedAt */
  pause: function () {
    var timer = App.state.timer;

    // if timer is not running there is no need to pause it
    if (timer.state !== 'running') {
      console.log('timer is not running. doing nothing!');
      return
    };

    // reset the start time
    var timer = {
      pausedAt: new Date().getTime(),
      state: Timer.states[2]
    };

    App.setState({ timer: timer });
    Timer._clearInterval()
  },
  /** stop the counter and evaluate totals */
  stop: function () {
    // TODO: clear interval, set state 'stopped', evaluate totals
  },

  /** clear the interval, pausing the counter.*/
  _clearInterval: function () {
    console.log('stopping the timer')

    clearInterval(App.__slideshowElapsedTime__)
  },

  /** render the timer somewhere */
  render: function (i) {
    console.info('elapsed time, logged every %dms:', i, Timer._formatTime() + 's')
  },
};

/**
 * STORAGE SECTION
 *
 * After here you can find temporary unused functions and methods that are
 * not deleted because they will be useful in future updates and functionalities
 * but are not used currently from the app.
 * @namespace
 */
var STORAGE = {
  /**
   * Can validate a @prop {string} <status> using an array of values
   * @TODO: Move somewhere. can be used to validate transition selection
   *       & customization, using an array of valid strings.
   *
   * Validate the dimmer transitions. true or an error if validation is falsy
   * @param  {string} status     desired new status to validate. optional
   * @param  {array}  array      Array of valid values to check with
   * @return {bool|Error}        true if valid, undefined if not
   *                             will throw an error if not valid
   */
  validate: function (status, validationArray) {
    //  if nothing is passed assume we want to toggle
    if (!status) return true;

    /** validation rules */
    var states        = validationArray,
        isString      = typeof status === 'string',
        /** actual validation of the passed string */
        isValid       = (function () {
          var valid = false
          for (var i = 0; i < states.length; i++) {
            if (status === states[i]) valid = true;
          }
          return valid
        })();

    /** error handling */
    if (status && !isString) {
      throw new Error('dimmer received an invalid status property somewhere!')
    };

    if (status && isString && !isValid) {
      throw new Error('passed status value to Dimmer is not valid. check')
    };

    /** everything is valid. return true */
    if (status && isString && isValid) { return true }

    /** in case something went wrong, throws an error to notify */
    throw new Error('Something went wrong while validating')
  }
};
