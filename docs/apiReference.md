# What's here!?

This is a temporary document meant to be a quick API reference for the app.
for the moment (and for the time being) is a stub, meant for me to quickly remember what does what of the high, mid and low level functions, what triggers what, what can be used instead. it's REALLY a work in progress so don't rely on it completely.
You can always test the methods with the console, though, setting `App.config.verbose = true` to receive feedbacks.

# High level APIs

### App

* `loadSlideshow` @param `{object}` `config` | used to load a slideshow, set config file and finalize initialization. config file is generated from the UI. see `main.js` to se what goes where or `Slides.config` to see the default config properties.

### Dimmer

* `set`  @param `{bool}` or `empty` `direction` | used to show or hide the dimmer. `true` set to `'show'`, `false` set to `'hide'`, passing no value inverts the current state
* `toggle` @param `null` | calls `App.setState({( dimmer: !App.state.dimmer })`, toggling the state

### Slides

* `go` @param `{string}` or `{number}` direction | used to request a transition from one slide to another. accepted values are one of `first`, `prev`, `next`, `last` or a **valid** slide `number`, meaning that if you ask for a non existent slide it will try to do its best
* ...

### Interface

* `toggle` @param `null` | toggles the interface `on` or `off`