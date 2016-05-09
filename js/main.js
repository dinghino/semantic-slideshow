    $(document).ready(function () {
      // initialization for loading screen
      var $btn = $('#testInit')
      $('.ui.checkbox').checkbox()
      // App initialization
      App.init()

      // load slideshow button click function. will load the slideshows
      // using the input values
      $btn.on('click', function (e) {
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

        // console.info('loading', totalSlides, 'slides from "' + config.folder + '/"')
        App.loadSlideshow(config);
      });
    });
