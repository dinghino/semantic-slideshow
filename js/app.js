/**
 * Main application object. Handles events, initialization and general state of
 * the app.
 */
var App = {
  // author info
  info: {
    author: 'Daniele Calcinai',
    email: 'dinghino@gmail.com',
    gitHub: 'https://github.com/dinghino',
    version: '0.9.3b'
  },
  // current state of the app
  state : {
    /** @property {boolean} UI is toggled */
    buttonShown: false,
    /** @property {boolean} app initialization status */
    initialized: false,
    /** @property {boolean} true if custom events are present and ready */
    events: false,
    /** @property {string} status of the dimmer. uses semantic dimmer options */
    dimmer: 'hide'
  },
  __logState: function () { console.log( App.state )},
  init: function (config, info) {
    /** EVENT LISTENERS */
    // listen to window resize to handle slide dimensions and translation
    App.addWindowListeners()
    // custom events for the application
    App.events()
    /** APPLY SETTINGS AND INFO */
    // set the about section content
    App.setAboutInfo()
    
    /** COMPONENTS INITIALIZATION */

    // initialize interface with semantic-ui modules
    App.semanticModules()
    // initialize the buttons and their events
    Interface.init()
  },

  /**
   * validate the selected folder before calling App.loadSlideshow()
   * avoiding unwanted initialization
   * @param  {string} folderName folder to validate
   * @param  {func}   success    called if folderName is found
   * @param  {func}   failure    called if foldername is NOT found
   */
  validateSlideshowFolder: function (folderName, success, failure) {
    // define the path to the test file
    var test = folderName + '/0.html'

    $.get(test)
    .success(function () {
        console.info('success in accessing', folderName + '/')
        if (success) success();
      })
    .fail(function () {
        console.warn('failure in accessing', folderName + '/');
        if (failure) failure();
      })

  },

  events: function () {
    $(App)
    .on('setConfig', function (e, config) {
      // assigning configuration to app
      Slides.config = Object.assign(Slides.config, config)
    })
    .on('loadSlides', function (e, config) {
      // initializing slideshow
      App.updateConfig(config)
      Slides.init()
    })
    .on('slideShowReady', function (e) {
      // if custom events are present in config and not yet executed run that
      // first before finalizing initialization
      if(Slides.config.events && !App.state.events) {
        Slides.config.debug ? console.info('enabling your custom events') : null
        App.enableEvents()
        return
      // if no extra events are presents or are already set, finalize init
      } else {
        Slides.config.debug ? console.info('finalizing initialization') : null
        App.finalizeApp()
      };
    })
    .on('finalizeAppInit', function (e) {
      // if app is already initialized warn the user
      if (App.state.initialized === true) {
        console.warn('initialization called more than once. check it!')
        return
      }

      Slides.config.debug ? console.info('I\'m done! Slideshow is ready'): null
      

      // set initial state for the buttons
      // if necessary do stuff to the UI
      if (Slides.config.showCounter && !App.state.initialized) Counter.init();
      if (Slides.config.showButtons && !App.state.initialized) {
        setTimeout(Interface.toggle, 250);
      };

      // remove the dimmer
      setTimeout(function () { App.dim('hide')}, 150)

      // call the onEnter event for the first slide after loading
      Slides.onEnter(Slides.currentSlide)
      App.state.initialized = true
    })
    .on('renderSlides', function (e, prevSlide, nextSlide) {
      Slides.render(prevSlide, nextSlide)
    })
    .on('moveTo', function (e, nextPosition) {
      // move to a direction
      Slides.onGo(nextPosition)
      Interface.toggleButtons()
    })
    .on('enableCustomEvents', function (e) {
      Slides.config.events = window._slidesEvents
      var events = Slides.config.events
      // if events exists and is  function execute.
      // timeout is needed for the DOM creation
      events && typeof events === 'function' ? setTimeout(events, 50) : null
      
      // set events as executed
      App.state.events = true
      // run init validation again
      App.slidesReady()
    })
    .on('dimSlides', function (e, status) {
      var state = App.state.dimmer,
          states = ['show', 'hide'];

      if (status) {
        $dimmer.dimmer(status)
        App.state.dimmer = status
        return
      }
      $dimmer.dimmer('toggle')
      App.state.dimmed = state === 'show' ? 'hide' : 'show'
    })
  },

  /**
   * event triggers
   */
  /** load a slideshow with the given total slides and configuration */
  loadSlideshow: function (config) {
    // trigger the loading of the slideshows
    $(App).trigger('loadSlides', [config])
  },
  /** update Slides.config object with custom config */
  updateConfig: function (config) {$(App).trigger('setConfig', [config]) },
  /** get the custom script file from the slideshow folder 
   * @param  {string} fileName will be used in a later release,
   *                           allowing custom names for script.js
   */
  fetchEvents: function (fileName) {
    if (!fileName) fileName = 'script'
    var path = Slides.config.folder + '/' + fileName + '.js'

    $.getScript(path)
    .done(function (script, status) {
      console.info('script found!', status, 'activating.')
      App.enableEvents()
    })
    .fail(function (jqxhr, settings, exception) {
      console.warn(
        'no extra script found in "' + Slides.config.folder + '/"', jqxhr.status
      )
      App.slidesReady()
    });
  },
  /** enable custom events */
  enableEvents: function () { $(App).trigger('enableCustomEvents') },
  /** finalize the initialization of the slides */
  slidesReady: function () { $(App).trigger('slideShowReady') },
  /** finalize initialization of the whole app */
  finalizeApp: function () { $(App).trigger('finalizeAppInit') },
  /**  move the slides */
  go: function (direction) { $(App).trigger('moveTo', [direction]) },
  /** rerender the slides and content, adjusting to window resize */
  render: function () { $(App).trigger('renderSlides') },
  dim: function (status) { $(App).trigger('dimSlides', [status]) },

  /** get the about info and set them into the page */
  setAboutInfo: function () {
    var info = App.info
    if(!info.email) about.authorEmail.hide()
    if(!info.gitHub) about.authorGitHub.hide()
    
    about.appVersion.text(info.version)
    about.authorEmail.attr('href', ('mailto:'+ info.email))
    about.authorGitHub.attr('href', info.gitHub)
  },

  /** Activate slideshow UI semantic-ui modules */
  semanticModules: function () {
    $helpIcon.popup({
      inline: true,
      position: 'top left',
      on: 'click',
      transition: 'vertical flip',
      // close the about section when popup closes
      onHide: function () { $authorAccordion.accordion('close', 0) }
    });

    $authorAccordion.accordion()
    $dimmer
      .dimmer({
        duration: {
          show: 200,
          hide: 200
        }
      })
  },

  /** add event listeners to document to handle events */
  addWindowListeners: function () {
    // add event and attach render method as callback
    window.addEventListener('resize', App.render);
  }
};

/**
 * TODO: rewrite description of this and ALL objects
 * Load, activate and manage the state and behaviour of the slides.
 * Starts calling init() and passing the number of slides as required argument.
 * init will load the slides from specified folder.
 * Contains config {object} for the slideshow
 */
var Slides = {
  // {number} the total ammount of slides of the project
  lastSlide: 0,

  // {number} current slide shown
  currentSlide: 0,

  // {number} width of the slides
  slideWidth: 0,

  // {number} current size of the window
  windowWidth: 0,

  // {number} current position on the slides
  translateAmount: 0,

  // {element} DOM Element that will contain our slides
  container: $slideContainer,

  // {object} configuration for the application. contains default properties
  config: {
    // folder that contains the slides
    folder: 'slides',

    // hash string for the browser address. will get the current slide # after
    hash: 'slide',

    // default animations for slide transition
    transition: {
      left: 'fly left',
      right: 'fly right',
    },

    // start with button toggled on or off
    showButtons: true,

    // create and use the counter for the slides
    showCounter: true,

    // {boolean} console log events
    debug: false
  },

  /**
   * initialize the slideshow
   */
  init: function () {
    /** INITIALIZATION */

    // empty the slide container
    App.dim('show')
    App.state.initialized = false;
    Slides.container.empty();
    
    Slides.windowWidth = 0;
    Slides.slideWidth = 0;
    
    /** START LOADING */
    Slides.getContent(App.fetchEvents)

    /** INITIAL EVENTS */

    //  listen to key press events
    !App.state.initialized ? Interface.addKeyPressEvents() : null;

    // determine width of the canvas and set properties
    var width = Slides.getWindowWidth();
    Slides.slideWidth = width;
    Slides.windowWidth = width;
    
    Slides.updateHash();

    if (Slides.config.debug) Slides.debugger(0);
  },

  debugger: function (nextSlide) {
    console.log('------ DEBUGGER ------')
    console.log('App current state', App.state)
    console.log('total slides: ' + (Slides.lastSlide + 1))
    console.log('going to slide # ' + nextSlide)
    console.log('window width: ' + Slides.windowWidth)
    console.log('slide width: ' + Slides.slideWidth)
    console.log('translation of: ' + Slides.translateAmount)
  },

  /** get the window dimensions */
  getWindowWidth: function () {
    var width = $(window).width() 
    return width
  },

  _createSlide: function (idx)  {
    var hash = Slides.config.hash;

    return $('<div>', {
      id: hash + idx,
      // TODO: use semantic-ui transitions setting initial status
      class: idx > 0 ? 'transition hidden' : 'transition visible',
      style: idx === 0 ? 'display: -webkit-box !important;' : ''
    })[0]
  },

  getContent: function (callback) {
    console.log('fetching slides')
    // local config
    var frag        = document.createDocumentFragment(),
        hash        = Slides.config.hash,
        slidesQty   = 0,
        folder      = Slides.config.folder,
        loadStatus  = 'OK',
        i = 0,
        bit;


    /** handle the error from the ajax call in case it fails */
    function handleError (e) {
      if (e.status == 0) {
        console.warn(' Check Your Network.');
      } else if (e.status == 404) {
        console.warn('Seems we loaded the last slide. You have', slidesQty, 'slides');
      } else if (e.status == 500) {
        console.warn('Internel Server Error.'); 
      } else {
        console.warn('Unknow Error.\n' + e.responseText);
      }
    };

    // fetch function for ajax request with $.get()
    function ajaxCall () {
      if (loadStatus !== 'OK') return;
      
      var nextSlide = folder + '/' + slidesQty + '.html'; 
      bit = Slides._createSlide(slidesQty)

      $.get(nextSlide)
      .fail(function (e) {
        /** error handling */
        handleError(e)

        /**
         * Since fail means that there are no more slides to load, 
         * append everything into the dom and continue configuring the slideshow
         */
        
        /** save slide quantity in Slides.lastSlide */
        Slides.lastSlide = --slidesQty

        // append the fragments to the DOM into this.config.container
        Slides.container.append(frag)

        // debug stuff
        Slides.config.debug ? console.info('All slides loaded. continuing') : null
        
        // set initial slide widths, applying left-margin to compensate
        setTimeout(App.render, 50);

        // execute callback function. Should be Slides.config.events
        if (callback) setTimeout(callback, 50);
      })
      .success(function(data, status, xhr) {
        /** success callback */
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
   * Handles the (re)size of the slideshow content.
   * Used at the beginning to set the spacing and every time that the window
   * changes its size, to handle the new width of the view
   * @param  {number} width new width of the container
   */
  _handleResize: function (width) {
    Slides.config.debug ? console.warn('Window width changed. handling') : null

    /** store the new width into Slides properties */
    Slides.slideWidth = width;
    Slides.windowWidth = width;


    /** if needed reset transition width to accomodate new window width */
    if (Slides.currentSlide > 0) {
      var width   = Slides.slideWidth,
          current = Slides.currentSlide;
      /** update the translateAmount for the transition */
      Slides.translateAmount = -(width * current)
    }
  },

  /** render and animate the slides, updating values if necessary */
  render: function (prevSlide, nextSlide) {
    /** @type {number} current window width */
    var width  = Slides.getWindowWidth(),
    /** @type {bool} true if window changed size */
        resize = Slides.windowWidth !== width;

    /** if app is still initializing set initial margins */

    // if (App.state.initialized && !resize) return;
    if (resize) Slides._handleResize(width);

    /** execute the animation for the slides */
    setTimeout(function () {
      Slides.animate(prevSlide, nextSlide)
    }, 0)
  },

  /////////////////////
  // EVENT HANDLERS ///
  /////////////////////

  /**
   * move the slides to {direction}.
   * @param {string} direction the direction to move. 
   *                 one of 'next', 'prev', 'first', 'last'
   */
  onGo: function (direction) {
    /** local variables */
    var nextSlide,
        previousSlide,
        currentSlide = Slides.currentSlide

    /**
     * update object properties depending on where we are going.
     * if case is no match throw an error | shouldn't happen from UI
     */
    switch (direction) {
      case 'next':
        Slides.onLeave(currentSlide)
        previousSlide = currentSlide
        nextSlide = ++Slides.currentSlide
        Slides.onEnter(nextSlide)
        Slides.translateAmount -= Slides.slideWidth
        break

      case 'prev':
        Slides.onLeave(currentSlide)
        previousSlide = currentSlide
        nextSlide = --Slides.currentSlide
        Slides.onEnter(nextSlide)
        Slides.translateAmount += Slides.slideWidth
        break

      case 'first':
        Slides.onLeave(currentSlide)
        previousSlide = currentSlide
        nextSlide = 0;
        Slides.currentSlide = 0;
        Slides.translateAmount = 0;
        Slides.onEnter(Slides.currentSlide)
        break

      case 'last':
        Slides.onLeave(currentSlide)
        previousSlide = currentSlide
        nextSlide = Slides.lastSlide
        Slides.currentSlide = Slides.lastSlide
        Slides.onEnter(Slides.currentSlide)
        Slides.translateAmount = -(Slides.slideWidth * Slides.currentSlide)
        break

      default:
        throw new Error('Error while moving... what did you do? You nasty...')
    }

    // be verbose if debug is true
    Slides.config.debug ? Slides.debugger(nextSlide) : null
    
    // execute the transition
    Slides.render(previousSlide, nextSlide)
  },

  onEnter: function (slide) {
    var events        = Slides.config.events,
        slidesEvents  = {};

    if (events) { slidesEvents = Slides.config.events[slide] };

    if (!slidesEvents) return;
    var fn = slidesEvents.onEnter
    // end the function if event is not present
    if (!fn || typeof fn !== 'function') return
    
    fn()
  },

  onLeave: function (slide) {
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
   *  handler for the animation to move the slides
   */
  animate: function (prevSlide, nextSlide) {
    var slides      = Slides.container.children(),
        value       = Slides.translateAmount,
        hash        = Slides.config.hash;
        prev        = '',
        next        = '',
        transition = {
          enter: '',
          leave: ''
        };

    /** get the dom elements corresponding the slides to animate */
    if (typeof prevSlide === 'number') prev = $('#'+ hash + prevSlide);
    if (typeof nextSlide === 'number') next = $('#'+ hash + nextSlide);

    /** set the animations to use for the transition */
    if (prevSlide > nextSlide) {
      transition.leave = Slides.config.transition.left
      transition.enter = Slides.config.transition.right
    } else {
      transition.leave = Slides.config.transition.right
      transition.enter = Slides.config.transition.left
    }


    // update DOM
    if (prev) {
      prev.transition({
        animation: transition.leave,
        // handle the event listeners
        onStart: Interface.disableTransitions
      })
    }
    if (next) {
      next.transition({
        animation: transition.enter,
        // handle the event listeners
        onComplete: Interface.restoreTransitions
      })
    }

    Slides.config.showCounter ? Counter.set() : null

    // apply the transition
    // slides.css('-webkit-transform', 'translateX(' + value + 'px)');
    // slides.css('transform', 'translateX(' + value + 'px)')

    setTimeout(Slides.updateHash, 600)
  },

  /**
   *  update the address on the browser
   */
  updateHash: function () {
    var hash  = Slides.config.hash,
        slide = Slides.currentSlide;

    // update the address hash
    location.hash = hash + slide
  }
};


var Counter = {
  init: function () {
    $counter.append('<div class="ui left pointing label"></div>')
    Counter.set()
  },
  /** set the value of the label if present */
  set: function () {
    var current = Slides.currentSlide + 1,
        total   = Slides.lastSlide + 1,
        text    = 'Slide ' + current + ' of ' + total,
        $label  = $counter.find('.label');

    $($label[0]).text(text)
  },
  toggle: function () {
    $counter.transition('fly up')
  }
}

/**
 * Handles the events for the control buttons rendered on screen
 */
var Interface = {
  /**
   * initialize the buttons with their events called from Slides.
   * @param {boolean} hide if true will hide the buttons and 
   *                       NOT active the event handlers
   */
  init: function (hide) {
    if(hide) Slides.config.showButtons = false
    Interface.addEventListeners()
  },

  addEventListeners: function () {
    // click events for slides buttons
    Interface.addNavigationListeners();

    // event for the toggler button
    $button.toggle.on('click', Interface.toggle);

    // event for the black screen button
    $button.black.on('click', function () { App.dim() });
    // event handler for the dimmer click
    $dimmer.on('click', function () { App.dim() })

    // custom events
    $(Interface).on('toggleUI', Interface.onToggleUI);
    $(Interface).on('setButtonsClass', Interface.onToggleButtons);
  },
 
  /** add functionality to the navigational buttons */
  addNavigationListeners: function () {
    $button.first.on('click', function () { App.go('first') });
    $button.prev.on('click', function () { App.go('prev') });
    $button.next.on('click', function () { App.go('next') });
    $button.last.on('click', function () { App.go('last') });
  },

  /** validate a keyCode from a keypress to handle navigation */
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

  /** handle a keypress in the page, when listeners are active */
  handleKeyPress: function(e) {
    var key = Interface.validateKeyPress(e.keyCode);

    // if one of those is pressed decide what to do
    switch (key) {
      case 'left':
        e.preventDefault();
        if (Slides.currentSlide === 0) break;
        App.go('prev')
        break

      case 'right':
        e.preventDefault();
        if (Slides.currentSlide === Slides.lastSlide) break;
        App.go('next')
        break

      case 'home':
        e.preventDefault();
        if(Slides.currentSlide === 0) break
        App.go('first')
        break

      case 'end':
        e.preventDefault();
        if(Slides.currentSlide === Slides.lastSlide) break
        App.go('last')
        break

      case 'toggle':
        e.preventDefault();
        Interface.toggle();
        break

      case 'dim':
        e.preventDefault()
        App.dim()

      default:
        break
    }
  },

  /** instantiate event listeners on key press */
  addKeyPressEvents: function () {
    $(document).keydown(Interface.handleKeyPress);
  },

  disableTransitions: function () {
    $(document).unbind('keydown', Interface.handleKeyPress)
    
    $button.first.off('click');
    $button.prev.off('click');
    $button.next.off('click');
    $button.last.off('click');
  },
  restoreTransitions: function () {
    Interface.addKeyPressEvents()
    Interface.addNavigationListeners()
  },

  /** event triggers */
  toggleButtons: function () { $(Interface).trigger('setButtonsClass') },
  toggle: function () { $(Interface).trigger('toggleUI') },

  /** event handlers */

  /**
   * toggle classes from buttons
   */ 
  onToggleButtons: function () {
    var currentSlide = Slides.currentSlide,
        lastSlide    = Slides.lastSlide,
        allButtons   = $button.wrapper.children(),
        allDisabled  = $(allButtons[0]).is('disabled');

    Slides.config.debug ? console.log('App current state', App.state) : null;

    /**
      * should be true after the next if statement is executed.
      * prevents useless checking if there is just one slide to show
      * and buttons are already disabled.
      * could be deprecated since there is no way onToggleButtons() is called
      * if there is just one slide to show
     */
    if (lastSlide === 0 && allDisabled) return;

    /**
     * should be true just the first time it runs or never.
     * disables all the buttons if there is just one slide to show
     * and the first one is not disabled
     */
    if (lastSlide === 0 && !allDisabled) {
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
    if (currentSlide === 0) {
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
   * Toggle the buttons (and count)
   */
  onToggleUI: function () {
    var state = App.state.buttonShown;
    Slides.config.debug ? console.log('App current state', App.state) : null;
    $button.wrapper.transition('fly left');
    Counter.toggle();
    App.state.buttonShown = !state;
  }
};
