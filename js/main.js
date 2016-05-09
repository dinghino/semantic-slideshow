    $(document).ready(function () {
      var $slides_loader

      // callback for the success of load 'config.html'
      // will activate the submit button, allowing the loading of slideshows
      function _enableSlideLoader () {
        $slides_loader.on('click', function (e) {
          e.preventDefault();

          var folder      = $('input[name="folderName"]').val(),
              hash        = $('input[name="pageHash"]').val(),
              counter     = $('input[name="counterToggle"]').is(':checked'),
              controls    = $('input[name="controlsToggle"]').is(':checked');

          // set the config object to load the slides
          var config = {
            folder: folder,
            hash: hash,
            showButtons: controls,
            showCounter: counter
          }

          function validateSuccess () { App.loadSlideshow(config) };
          function validateFailure () {
            var message = $('[data-role="loadingErrorBox"]'),
                icon = $(message).children('.icon');

            $(message).transition({
              animation: 'fade up',
              onComplete: function () {
                $(icon).transition('tada')
              }
            })
          };

          App.validateSlideshowFolder(folder, validateSuccess, validateFailure);
        });
      }

      function _loadApp () {
        // fetch the UI and load it into the page
        $('[data-role="ui"]').load("app/ui.html", function () {
          // fetch the config file
          $.getScript('app/config.js', function () {
            // fetch app.js
            $.getScript('js/app.js', function () {
            // initialize the app
            App.init();
            })
          });
        });
      }
      // load the configuration interface into the page
      $( '[data-role="slides"]').load("app/config.html", function () {
        // get the element for the load button
        $slides_loader = $('#load_slideshow_btn');
        // initialization for loading screen
        $('.ui.checkbox').checkbox()
        
        _enableSlideLoader()
        // load the rest of the UI and 
        _loadApp()
      });
    });
