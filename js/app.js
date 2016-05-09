// selectors for DOM elements
var $helpIcon = $('[data-role="helpIcon"]'),
    $counter = $('[data-role="counter"]'),
    $authorAccordion = $('[data-role="authorAccordion"]'),
    $slideContainer = $('[data-role="slides"]');
var $button = {
  // wrapper for slide movement buttons
  wrapper: $('[data-role="buttons"]'),
  // slide movement
  first: $('[data-role="btnFirst"]'),
  prev: $('[data-role="btnPrev"]'),
  next: $('[data-role="btnNext"]'),
  last: $('[data-role="btnLast"]'),
  // ui toggler
  toggle: $('[data-role="toggle"]')
};
var about = {
  authorEmail: $('[data-role="authorEmail"]'),
  authorGitHub: $('[data-role="authorGitHub"]'),
  appVersion: $('[data-role="appVersion"]')
};

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
    version: '0.8a'
  },
  // current state of the app
  state : {
    /** @property {boolean} UI is toggled */
    buttonShown: false,
    /** @property {boolean} app initialization status */
    initialized: false,
    /** @property {boolean} true if custom events are present and ready */
    events: false
  },

  init: function (totalSlides, config, info) {
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

    // FINALIZE INITIALIZATION
    // $(App).trigger('initDone')
  },

  events: function () {
    $(App)
    
    .on('setConfig', function (e, config) {
      // assigning configuration to app
      Slides.config = Object.assign(Slides.config, config)
    })

    .on('loadSlides', function (e, totalSlides, config) {
      // initializing slideshow
      App.updateConfig(config)
      Slides.init(totalSlides)
    })

    .on('slideShowReady', function (e) {
      // if custom events are present in config and not yet executed run that
      // first before finalizing initialization
      if(Slides.config.events && !App.state.events) {
        Slides.config.debug ? console.info('enabling your custom events') : null
        $(App).trigger('setSlidesEvents')
        return
      // if no extra events are presents or are already set, trigger initDone
      } else {
        Slides.config.debug ? console.info('finalizing initialization') : null
        $(App).trigger('initDone')
      };
    })

    .on('initDone', function (e) {
      // if app is already initialized warn the user
      if (App.state.initialized === true) {
        console.warn('initialization called more than once. check it!')
        return
      }

      App.state.initialized = true
      Slides.config.debug ? console.info('I\'m done! Slideshow is ready'): null
      
      // call the onEnter event for the first slide after loading
      Slides.onEnter(Slides.currentSlide)
    })

    .on('updateSlideSize', function (e) {
      // call the rendering of the app
      Slides.handleResize()
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
  },

  /**
   * event triggers
   */
  /** load a slideshow with the given total slides and configuration */
  loadSlideshow: function (totalSlides, config) {
    $(App).trigger('loadSlides', [totalSlides, config])
  },
  /** update Slides.config object with custom config */
  updateConfig: function (config) {$(App).trigger('setConfig', [config]) },
  /** get the custom script file from the slideshow folder */
  fetchEvents: function (fileName) {
    if (!fileName) fileName = 'script'
    var path = Slides.config.folder + '/' + fileName + '.js'
    
    console.log('trying to load', path) 
    $.getScript(path)
    .done(function (script, status) {
      console.log('script found!', status)
      App.enableEvents()
    })
    .fail(function (jqxhr, settings, exception) {
      console.log('no extra script found', jqxhr.status)
      App.slidesReady()
    });
  },
  /** enable custom events */
  enableEvents: function () { $(App).trigger('enableCustomEvents') },
  /**  move the slides */
  go: function (direction) { $(App).trigger('moveTo', [direction]) },
  /** finalize the initialization */
  slidesReady: function () { $(App).trigger('slideShowReady') },
  /** rerender the slides and content, adjusting to window resize */
  render: function () { $(App).trigger('updateSlideSize') },

  /** get the about info and set them into the page */
  setAboutInfo: function () {
    var info = App.info
    if(!info.email) about.authorEmail.hide()
    if(!info.gitHub) about.authorGitHub.hide()
    
    about.appVersion.text(info.version)
    about.authorEmail.attr('href', ('mailto:'+ info.email))
    about.authorGitHub.attr('href', info.gitHub)
  },

  /** Activate semantic-ui modules */
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
    
  },

  /**
   *  instantiate event listener on key press
   */
  onKeyPress: function () {
    $(document.body).keydown(function(e) {

      var key = e.keyCode
      /**
       * keycode shortcuts *
       *
       * right:  ->, SPACE, presenter right,
       * left:   <-, presenter left,
       * home:   HOME key,
       * end:    END key,
       * toggle: T key 
       */

      var right  = key === 39 || key === 34 || key === 32,
          left   = key === 37 || key === 33,
          home   = key === 36,
          end    = key === 35,
          toggle = key === 84;

      // if one of those is pressed decide what direction to go
      if (left) {
        e.preventDefault();
        if (Slides.currentSlide === 0) return;
        App.go('prev')
        return
      }
      if (right) {
        e.preventDefault()
        if (Slides.currentSlide === Slides.totalSlides) return;
        App.go('next')
        return
      }
      if (home) {
        e.preventDefault()
        if(Slides.currentSlide === 0) return
        App.go('first')
        return
      }
      if (end) {
        e.preventDefault()
        if(Slides.currentSlide === Slides.totalSlides) return
        App.go('last')
        return
      }
      if (toggle) {
        e.preventDefault()
        Interface.toggle()
        return
      }
    });
  },

  /** add event listeners to document to handle events */
  addWindowListeners: function () {
    window.addEventListener('resize', App.render)
  },

};


/**
 * Load, activate and manage the state and behaviour of the slides.
 * Starts calling init() and passing the number of slides as required argument.
 * init will load the slides from specified folder.
 * Contains config {object} for the slideshow
 */
var Slides = {
  // {number} the total ammount of slides of the project
  totalSlides: 0,

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

    // start with button toggled on or off
    showButtons: true,

    // create and use the counter for the slides
    showCounter: true,

    // {boolean} console log events
    debug: false
  },

  /**
   * initialize the application
   * @param {number}  totalSlides  the number of the slides to initialize
   */
  init: function (totalSlides) {
    // Throw an error if no slides number is passed
    if (!totalSlides) throw new Error('Please pass the total number of slides')

    /** INITIALIZATION */

    // empty the slide container
    Slides.container.empty()
    
    Slides.windowWidth = 0;
    Slides.slideWidth = 0;
    
    /** START LOADING */
    
    // set the number of the total slides
    Slides.totalSlides = (totalSlides - 1);

    // if everything's ok load the content of the slides
    Slides.loadContent(App.fetchEvents);
    // set initial slide widths, applying left-margin to compensate
    Slides.handleResize();
    // set initial state for the buttons
    Interface.toggleButtons();

    /** INITIAL EVENTS */

    // if necessary do stuff to the UI
    if (Slides.config.showCounter && !App.state.initialized) Counter.init();
    if (Slides.config.showButtons && !App.state.initialized) Interface.toggle();

    //  listen to key press events
    !App.state.initialized ? App.onKeyPress() : null;

    // determine width of the canvas and set properties
    var windowWidth = Slides.getWindowSize().width;
    Slides.slideWidth = windowWidth;
    Slides.windowWidth = windowWidth;
    
    Slides.updateHash();

    Slides.config.debug 
      ? console.info('Slideshow ready with ', Slides.totalSlides + 1, 'slides.')
      : null

    if(Slides.config.debug) {
      console.info('--- Initial state ---');
      console.log('App current state', App.state)
      console.info('total slides to show: ' + (Slides.totalSlides + 1));
      console.info('initial slide: ' + (Slides.currentSlide));
      console.info('initial window width: ' + Slides.windowWidth);
      console.info('initial slide width: ' + Slides.slideWidth);
      console.info('initial translation: ' + Slides.translateAmount);
    };
  },

  /** get the window dimensions */
  getWindowSize: function () {
    var $height = $(window).height()
    var $width = $(window).width() 

    return {
      height: $height,
      width: $width
    }
  },

  /**
   * load the content of the slides into the page.
   * Slides must be named as [n].html and be inside the folder specified
   * in config object (default is 'slides/')
   */
  loadContent: function (callback) {
    // DOM fragments. Will be al the slides content
    var frag = document.createDocumentFragment(),
        totalSlides = Slides.totalSlides,
        folder = Slides.config.folder,
    // piece of fragment, will contain one <div> for each slide
        bit;
    
    for (var i = 0; i < (totalSlides + 1); i++) {
      bit = $('<div id=' + Slides.config.hash + i + '"></div>') 
        .load(
          (folder + '/' + i + '.html'),
          function (response, status, xhr) { 
            if (status === 'error') {
              console.log('error in retrieving slide', i, 'from', folder)
            }
          }
        )[0];

      frag.appendChild(bit);
    } // end for cycle

    // append the fragments to the DOM into this.config.container
    Slides.container.append(frag)
    Slides.config.debug ? console.info('All slides loaded. continuing') : null
    // execute callback function.
    // should be Slides.config.events
    if (callback) setTimeout(callback, 50);
     
  },

  /** set the width of the slides, adding margin to accomodate all the slides */
  handleResize: function () {
    var width = Slides.getWindowSize().width
    
    // {boolean} true if window has been resized
    var widthChanged = !(width === Slides.windowWidth) 

    // if width didn't change do nothing
    if (!widthChanged) return;
    Slides.config.debug ? console.warn('Window width changed. handling') : null

    // assign width to Slides properties
    Slides.windowWidth = width
    Slides.slideWidth = width

    /** @var {array} all the slides */
    var slides = Slides.container.children()
    
    // add add a left margin to accomodate the other slides
    for (var i = 0; i < slides.length; i++) {
      var slide  = $(slides[i]),
          margin = Slides.slideWidth * i;

      slide.css('margin-left', margin)
    }

    /** reset transition width to accomodate new window width */
    if (Slides.currentSlide > 0) {
      var elements = Slides.container.children(),
          transition = elements.css('transition');

      // remove transition animation
      // elements.css('transition', '-webkit-transform 0s linear')
      // elements.css('-webkit-transition', '-webkit-transform 0s linear')

      Slides.translateAmount = -(Slides.slideWidth * Slides.currentSlide)
      Slides.animate()
      
      // re apply previous transition effects
      // elements.css('transition', transition)
      // elements.css('-webkit-transition', transition)
    }
  },

  debugger: function (nextSlide) {
    console.log('------ DEBUGGER ------')
    console.log('App current state', App.state)
    console.log('total slides: ' + (this.totalSlides + 1))
    console.log('going to slide # ' + nextSlide)
    console.log('window width: ' + this.windowWidth)
    console.log('slide width: ' + this.slideWidth)
    console.log('translation of: ' + this.translateAmount)
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
    var nextSlide,
        currentSlide = Slides.currentSlide

    // update object properties depending on where we are going.
    // if case is no match throw an error
    switch (direction) {
      case 'next':
        Slides.onLeave(currentSlide)
        nextSlide = ++Slides.currentSlide
        Slides.onEnter(nextSlide)
        Slides.translateAmount -= Slides.slideWidth
        break

      case 'prev':
        Slides.onLeave(currentSlide)
        nextSlide = --Slides.currentSlide
        Slides.onEnter(nextSlide)
        Slides.translateAmount += Slides.slideWidth
        break

      case 'first':
        Slides.onLeave(currentSlide)
        Slides.currentSlide = 0;
        Slides.translateAmount = 0;
        Slides.onEnter(Slides.currentSlide)
        break

      case 'last':
        Slides.onLeave(currentSlide)
        Slides.currentSlide = Slides.totalSlides
        Slides.translateAmount = -(Slides.slideWidth * Slides.currentSlide)
        Slides.onEnter(Slides.currentSlide)
        break

      default:
        throw new Error('Error while moving... what did you do? You nasty...')
    }

    // be verbose is debug is true
    Slides.config.debug ? Slides.debugger(nextSlide) : null

    // update DOM
    Slides.updateHash()
    Slides.config.showCounter ? Counter.set() : null
    
    // animation delay
    setTimeout(Slides.animate, 150)

  },

  onEnter: function (slide) {
    // TODO: handle the events in Slides.config.events[idx].onEnter if exists
    var slidesEvents,
        events = Slides.config.events

    if (events) { slidesEvents = Slides.config.events[slide] };

    if (!slidesEvents) return;
    var fn = slidesEvents.onEnter
    // end the function if event is not present
    if (!fn || typeof fn !== 'function') return
    
    fn()
  },

  onLeave: function (slide) {
    // TODO: handle the events in Slides.config.events[idx].onLeave if exists
    var slidesEvents,
        events = Slides.config.events

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
  animate: function () {
    var slides = Slides.container.children()
    slides.css('-webkit-transform', 'translateX(' + Slides.translateAmount+ 'px)')
  },

  /**
   *  update the address on the browser
   */
  updateHash: function () {
    location.hash = Slides.config.hash + Slides.currentSlide
  }
};


var Counter = {
  init: function () {
    $counter.append('<div class="ui left pointing label"></div>')
    Counter.set()
  },
  /** set the value of the label if present */
  set: function () {
    var text = 'Slide ' + (Slides.currentSlide + 1) + ' of ' + (Slides.totalSlides + 1),
        $label = $counter.find('.label');

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
    $button.first.on('click', function () {
      $(App).trigger('moveTo', ['first'])
    });
    $button.prev.on('click', function () {
      $(App).trigger('moveTo', ['prev'])
    });
    $button.next.on('click', function () {
      $(App).trigger('moveTo', ['next'])
    });
    $button.last.on('click', function () {
      $(App).trigger('moveTo', ['last'])
    });

    // event for the toggler button
    $button.toggle.on('click', function() {
      Interface.toggle()
    });

    // custom events
    $(Interface).on('toggleUI', function () {
      Interface.onToggleUI()
    });
    $(Interface).on('setButtonsClass', function () {
      Interface.onToggleButtons()
    })
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
        lastSlide = Slides.totalSlides;
        allButtons = $button.wrapper.children();

    Slides.config.debug ? console.log('App current state', App.state) : null;

     /**
      * should be true after the next if statement is executed.
      * prevents useless checking if there is just one slide to show
      * and buttons are already disabled.
      * could be deprecated since there is no way this method can be called
      * if there is just one slide to show
      */
     if (lastSlide === 0 && $(allButtons[0]).is('disabled')) {
       return
     };

    /**
     * should be true just the first time it runs or never.
     * disables all the buttons if there is just one slide to show
     * and the first one is not disabled
     */
    if (lastSlide === 0 && $(allButtons[0]).is(':not(disabled)')) {
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
