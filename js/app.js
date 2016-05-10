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
    version: '0.9.4'
  },
  config: {
    /** {boolean} console log events */
    verbose: false
  },
  _prevStates: [{ ready: true }] ,
  // current state of the app
  state : {
    /** @property {boolean} UI is toggled */
    buttonShown: false,
    /** @property {boolean} app initialization status */
    initialized: false,
    /** @property {boolean} true if custom events are present and ready */
    events: false,
    /** @property {string} status of the dimmer. uses semantic dimmer options */
    dimmer: 'hide',
    /** @type {Number} total number of slides */
    totalSlides: 0,
    /** @property {number} currently shown slide */
    currentSlide: 0,
    /** @type {number} previously shown slide ~ used and set in transitions */
    prevSlide: undefined,
    /** @type {number} next slide to show ~ used and set in transitions */
    nextSlide: undefined
  },

  setState: function (nextState) {
    // validation for arguments
    if (typeof nextState !== 'object') {
      throw new Error('new state should be an object!')
    };

    var oldState = App.state,
    /** @type {object} merge the old state with the new props passed */
        newState = Object.assign(App.state, nextState);

    /** DEBUG: TODO: remove once satifsied */
    if (App.verbose) {
      console.warn('=========== updating App.state object ===========')
      console.info('old state', oldState)
      console.info('updating with', nextState)
      console.info('new state', newState)
    }

    /** add last state as first of _prevStates */
    App._prevStates.unshift(oldState)
    /** if length of array is > 10, remove oldest one */
    if(App._prevStates.length > 10) { App._prevStates.pop() }

    /** update current state with the new object */
    App.state = newState
  },

  __logState: function () { console.log( App.state )},
  /**
   * Initialize the whole app, starting sub .init() method, activating event
   * listeners and setting default parameters here and there
   * @param  {object} config configuration object for the app
   * @return {[type]}        [description]
   */
  init: function (config) {
    /** merge custom config for the whole app. used primarly to toggle debugging */
    if (config) {
      console.info('custom global config detected! merging', config)
      App.config = Object.assign(App.config, config)
    };

    /** enable semantic-ui debugger if verbose is true */
    if (App.config.verbose) $.site('enable debug');

    /** add custom app event listeners to objects and DOM */
    App.events()
    /** set the about section content */
    App.setAboutInfo()
    /** initialize the buttons and their events */
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
      }
    )
  },

  /**
   * event triggers
   */

  /** load a slideshow with the given total slides and configuration */
  loadSlideshow: function (config) { $(App).trigger('loadSlides', [config]) },
  /** update Slides.config object with custom config */
  updateConfig: function (config) {$(App).trigger('setSlideConfig', [config]) },
  /** get the custom script file from the slideshow folder 
   * @param  {string} fileName will be used in a later release,
   *                           allowing custom names for script.js
   */
  fetchEvents: function (fileName) {
    if (!fileName) fileName = 'script'

    if (!Slides.config.getEvents) {
      return App.slidesReady()
    }
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

  /**
   * event listeners
   */

  events: function () {
    $(App)
    .on('setSlideConfig', App._onSetConfig)
    .on('loadSlides', App._onLoadSlides)
    .on('slideShowReady', App._onSlideShowReady)
    .on('finalizeAppInit', App._onFinalizeInit)
    .on('moveTo', App._onMoveTo)
    .on('enableCustomEvents', App._onEnableEvents)
  },

  /**
   * event handlers
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
    Interface.toggleButtons()
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
    if (Slides.config.showCounter && !App.state.initialized) Counter.init();
    if (Slides.config.showButtons && !App.state.initialized) {
      setTimeout(Interface.toggle, 250);
    };

    // remove the dimmer
    setTimeout(function () { Dimmer.set('hide')}, 150)

    // call the onEnter event for the first slide after loading
    Slides.onEnter(Slides.currentSlide)

    App.setState({ initialized: true })
  },
  _onMoveTo: function (e, nextPosition) {
    // move to a direction
    Slides.evaluateTransition(nextPosition)
    Slides.requestTransition()
  },
  _onEnableEvents: function (e) {
    console.log('activating events')
    Slides.config.events = window._slidesEvents
    var events = Slides.config.events
    // if events exists and is  function execute.
    // timeout is needed for the DOM creation
    events && typeof events === 'function' ? setTimeout(events, 50) : null
    
    // set events as executed
    App.setState({ events: true })
    // run init validation again
    App.slidesReady()
  },

  /**
   * utility methods
   */

  /** get the about info and set them into the page */
  setAboutInfo: function () {
    var info = App.info
    if(!info.email) about.authorEmail.hide()
    if(!info.gitHub) about.authorGitHub.hide()
    
    about.appVersion.text(info.version)
    about.authorEmail.attr('href', ('mailto:'+ info.email))
    about.authorGitHub.attr('href', info.gitHub)
  },
};

/**
 * TODO: rewrite description of this and ALL objects
 * Load, activate and manage the state and behaviour of the slides.
 * Starts calling init() and passing the number of slides as required argument.
 * init will load the slides from specified folder.
 * Contains config {object} for the slideshow
 */
var Slides = {
  /** {number} the total ammount of slides of the project */
  lastSlide: 0,

  /** {number} current slide shown */
  currentSlide: 0,

  /** {element} DOM Element that will contain our slides */
  container: $slideContainer,

  /** {object} configuration for the application. contains default properties */
  config: {
    /** folder that contains the slides */
    folder: 'slides',

    /** hash string for the browser address. will get the current slide # after */
    hash: 'slide',

    /** default animations for slide transition */
    transition: {
      left: 'fade left',
      right: 'fade right',
    },

    /** @type {String} used when creating the slides to override semantic-ui */
    defaultSlideStyle: 'display: -webkit-flex!important; display: flex!important',

    /** @type {bool} if true try to get the custom .js file for the slideshow */
    getEvents: false,

    /** start with button toggled on or off */
    showButtons: true,

    /** create and use the counter for the slides */
    showCounter: true,
  },

  /**
   * initialize the slideshow
   */
  init: function () {
    /** INITIALIZATION */

    /** toggle the dimmer to 'show', hiding content loading */
    Dimmer.set('show')

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

  _createSlide: function (idx)  {
    var hash = Slides.config.hash;

    return $('<div>', {
      id: hash + idx,
      // TODO: use semantic-ui transitions setting initial status
      class: idx > 0 ? 'transition hidden' : 'transition visible',
      style: idx === 0 ? 'display: -webkit-flex!important; display: flex!important' : ''
    })[0]
  },

  getContent: function () {
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
        /** error handling */
        var error = handleError(e)
        if (error) { throw new Error(error) }

        /**
         * Since fail means that there are no more slides to load, 
         * append everything into the dom and continue configuring the slideshow
         */
        
        /** save slide quantity in Slides.lastSlide */
        App.setState({ totalSlides: slidesQty })
        Slides.lastSlide = --slidesQty

        // append the fragments to the DOM into this.config.container
        Slides.container.append(frag)

        // execute callback function. Should be Slides.config.events
        setTimeout(App.fetchEvents, 50);
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

  /** render and animate the slides, updating values if necessary */
  render: function (prevSlide, nextSlide) {

    /** execute the animation for the slides */
    setTimeout(function () { Slides.animate(prevSlide, nextSlide) }, 0)
  },

  /////////////////////
  // EVENT HANDLERS ///
  /////////////////////

  /**
   * evaluate transition if moving to {direction} and store into App.state
   * @param {string} direction the direction to move. 
   *                 one of 'next', 'prev', 'first', 'last'
   */
  evaluateTransition: function (direction) {
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
        App.setState({
          prevSlide: previousSlide,
          nextSlide: nextSlide
        })
        break

      case 'prev':
        Slides.onLeave(currentSlide)
        previousSlide = currentSlide
        nextSlide = --Slides.currentSlide
        Slides.onEnter(nextSlide)
        Slides.translateAmount += Slides.slideWidth
        App.setState({
          prevSlide: previousSlide,
          nextSlide: nextSlide
        })
        break

      case 'first':
        Slides.onLeave(currentSlide)
        previousSlide = currentSlide
        nextSlide = 0;
        Slides.currentSlide = 0;
        Slides.translateAmount = 0;
        Slides.onEnter(Slides.currentSlide)
        App.setState({
          prevSlide: previousSlide,
          nextSlide: nextSlide
        })
        break

      case 'last':
        Slides.onLeave(currentSlide)
        previousSlide = currentSlide
        nextSlide = Slides.lastSlide
        Slides.currentSlide = Slides.lastSlide
        Slides.onEnter(Slides.currentSlide)
        Slides.translateAmount = -(Slides.slideWidth * Slides.currentSlide)
        App.setState({
          prevSlide: previousSlide,
          nextSlide: nextSlide
        })
        break

      default:
        throw new Error('Error while moving... what did you do? You nasty...')
    }
  },

  requestTransition: function () {
    // execute the transition
    Slides.render(App.state.prevSlide, App.state.nextSlide)
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
    Interface.toggleButtons()
    App.setState({currentSlide: nextSlide, prevSlide: prevSlide })

    Slides.config.showCounter ? Counter.set() : null

    setTimeout(Slides.updateHash, 100)
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
    /** @type {node} create label into the DOM and return the element */
    label = Counter.create()

    /** add the label to the $button object to be easily used */
    $button.jump = $(label)
    
    /** activate the onClick event */
    $(label).on('click', function (e) {
      e.preventDefault()
      // temporary assignment until jump functionality is implemented
      console.info('clicked the counter! Jump functionality coming soon!')
    })
    
    /** set counter initial state */
    Counter.set()
  },

  create: function () {
    /** create counter elements */
    var label = $('<a>', {
      class:'ui left pointing grey basic label',
      'data-role': 'jumpToSlide' 
    })
    var labelIcon = $('<i>', { class: 'slack icon' })
    var labelText = $('<span>', { class: 'labelText'})

    /** append elements to the DOM inside the counter container */
    $counter.append(label)
    $(label).append(labelIcon).append(labelText)

    /** return the label element */
    return label
  },

  /** set the value of the label if present */
  set: function () {
    var current = parseInt(App.state.currentSlide, 10) + 1,
        total   = parseInt(App.state.totalSlides, 10),
        /** @type {string}  label text */
        text    = current + ' of ' + total,
        /** @type {node} DOM element for the label text */
        $label  = $counter.find('.labelText');

    /** update the label value */
    $($label[0]).text(text)
  },
  toggle: function () {
    $counter.transition('fly up')
  }
}

var Dimmer = {
  states: ['show', 'hide', 'toggle'],
  
  /** triggers */
  toggle: function () { $(Dimmer).trigger('dimmer_toggle') },
  set: function (status) { $(Dimmer).trigger('dimmer_set', [status]) },

  /** add event listeners */
  init: function () {
    $(Dimmer)
    .on('dimmer_toggle', Dimmer._toggleState)
    .on('dimmer_set', { status: status }, Dimmer._changeState);
  },

  /** event handlers */
  _toggleState: function (e) {
    $dimmer.dimmer('toggle')
    var newState = App.state.dimmer === 'show' ? 'hide' : 'show'
    App.setState({ dimmer: newState })
  },

  _changeState: function (e, data) {
      var currentState  = App.state.dimmer,
          // status = e.data.status
          isValid = Dimmer.validate(data.status);

      if (typeof isValid === 'object') { console.error(isValid) }
      if (isValid !== true) { console.warn('error in validation?', isValid); return }

      if (!data.status) {
        Dimmer.toggle()
        App.setState({
          dimmer: currentState === 'show' ? 'hide' : 'show'
        })
        return
      };

      $dimmer.dimmer(data.status)
      App.setState({ dimmer: data.status });
  },

  /** utility methods */

  /**
   * Validate the dimmer transitions. true or an error if validation is falsy
   * @param  {string} status     desired new status to validate. optional
   * @return {bool/error}        true if valid, error if not
   */
  validate: function (status) {
    //  if nothing is passed assume we want to toggle
    if (!status) return true;

    // validation rules
    var currentState  = App.state.dimmer,
        states        = Dimmer.states,
        isString      = typeof status === 'string',
        isValid       = (function () {
          var valid = false
          for (var i = 0; i < states.length; i++) {
            if (status === states[i]) valid = true; 
          }
          return valid
        })();


    if (status && !isString) {
      throw new Error('dimmer received an invalid status property somewhere!')
    };

    if (status && isString && !isValid) {
      throw new Error('passed status value to Dimmer is not valid. check')
    };

    if (status && isString && isValid) { return true }

   throw new Error('Something went wrong while validating')
  }
};

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
    console.log('initializing interface')
    if(hide) Slides.config.showButtons = false
    /** add basic event listeners */
    Interface.addEventListeners()
    /** initialize interface with semantic-ui modules */
    Interface.enableSemanticModules()

    /** initialize the dimmer */
    Dimmer.init()
  },

  /** Activate slideshow UI semantic-ui modules */
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

    /** about & contacts accordion */
    $authorAccordion.accordion()
    /** dimmer settings */
    $dimmer
      .dimmer({
        duration: {
          show: 500,
          hide: 500
        }
      })
  },

  /** basic event listeners for the UI */
  addEventListeners: function () {
    /** click events for slides buttons */
    Interface.addNavigationListeners();

    /** event for the toggler button */
    $button.toggle.on('click', Interface.toggle);
    /** event for the black screen button */
    $button.black.on('click', Dimmer.toggle);
    /** event handler for the dimmer click */
    $dimmer.on('click', Dimmer.toggle)

    /** custom events */
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

    /** if one of those is true decide what to do */
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
        Dimmer.toggle()

      default:
        break
    }
  },

  /** instantiate event listeners on key press */
  addKeyPressEvents: function () {
    $(document).keydown(Interface.handleKeyPress);
  },

  /** disables the transition event listeners */
  disableTransitions: function () {
    $(document).unbind('keydown', Interface.handleKeyPress)
    
    $button.first.off('click');
    $button.prev.off('click');
    $button.next.off('click');
    $button.last.off('click');
  },

  /** add or restore the transition event listeners */
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
    App.setState({ buttonShown: !state })
  }
};
