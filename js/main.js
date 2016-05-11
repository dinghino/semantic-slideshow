var $slides_loader;

var APP_CONFIG_DEF = {
  verbose: false,
  semanticLog: false
}

// callback for the success of load 'config.html'
// will activate the submit button, allowing the loading of slideshows
function _enableSlideLoader () {
  $slides_loader.on('click', function (e) {
    e.preventDefault();

    var folder      = $('input[name="folderName"]').val(),
        hash        = $('input[name="pageHash"]').val(),
        counter     = $('input[name="counterToggle"]').is(':checked'),
        controls    = $('input[name="controlsToggle"]').is(':checked'),
        loadScript  = $('input[name="loadCustomScript"]').is(':checked');

    // set the config object to load the slides
    var config = {
      getEvents: loadScript,
      folder: folder,
      hash: hash,
      showButtons: controls,
      showCounter: counter
    };

    /** calback functions for App.validateSlideshowFolder */
    function validateSuccess () { App.loadSlideshow(config) };
    function validateFailure () {
      var message = $('[data-role="loadingErrorBox"]'),
          icon = $(message).children('.icon');

      /** show error message! if already on screen then 'tada!' it */
      if ($(message).hasClass('hidden')) {
        $(message).transition({
          animation: 'fade up',
          onComplete: function () {
            $(icon).transition('tada')
          }
        })
      } else {
        $(message).transition('tada')
      }
    };

    /** validation for @var folder. if success start loading slideshow */
    App.validateSlideshowFolder(folder, validateSuccess, validateFailure);
  });
}

function _loadApp () {
  // fetch the UI and load it into the page
  $('[data-role="slidesInterface"]').load("app/ui.html", function () {
    // fetch the config file
    $.getScript('app/config.js', function () {
      // fetch app.js
      $.getScript('js/app.js', function () {
      
      // initialize the app
      setTimeout(App.init, 5, APP_CONFIG_DEF);
      })
    });
  });
};


$(document).ready(function () {
  /** load the configuration interface into the page */
  $( '[data-role="slides"]').load("app/config.html", function () {

    /** get the element for the load button */
    $slides_loader = $('#load_slideshow_btn');

    /** initialization for loading screen */
    $('.ui.checkbox').checkbox()
    $('[data-role="configSettingsAccordion"]').accordion()
    _enableSlideLoader()

    /** load the rest of the UI and start initializing the application */
    _loadApp()
  });
});
