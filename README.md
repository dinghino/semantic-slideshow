# Simple slide presentational app

I needed to create a little presentation and I told myself: _why should I use powerpoint and do it easily, when I can create an app to do the job?_

I think this is my first real project I've developed on my own, so due this and the fact that surely is an alpha version, code can look... well, could look better :D
If you have any suggestions, find bugs etc feel free to contact me or fork your own to expand it.

## Intro

The app is fairly simple, relies on `jQuery` and `semantic-ui` and `flexbox properties`, and uses `jQuery.load()` method to get progressively indexed `.html` files from `slides/` (_default_) folder inside the project, So you may want to have any kind of webserver where to run this application.

## Installation

Just put the folder in a working web server (I'm using `wamp` for windows for this project) and decompress `semantic.zip` into the `semantic/` folder. I added semantic locally because I needed the app to be able to run without internet connection too, so this is safe and faster.

## How it works

Pretty straightforward:  
Create one `html` file for each slide you want to show and give them a number as a name, starting from `0`.  
For example, if you want to show 3 slides, you will have `0.html`, `1.html` and `2.html` inside the `slides/` folder or the one that you want to use (see `config` below).  
Open `index.html` in a browser, follow the instructions and enjoy.  
  
See below for advanced usage.


## Creating the slides

Every file will be loaded inside index.html, so there is no need to add all the `html`, `body` etc tags.
What you'll need to set the content correctly is one container where to nest everything to allow flexbox to do its job correctly. You can always experiment freely how to design the content and change css properties as you may like.

Since the app relies on semantic-ui to render the interface, you can also use it for your slide content, giving you a fairly complete set of components and modules to use for your slides.

## Config

Basic configuration is handled from the UI, such as deciding the folder for the slideshow and the number of slides, so it wouldn't be necessary to know this, but still...

Slideshow can be manually loaded calling `App.loadSlideshow([totalSlides], {config})` telling it how many slides it has to load so, if you have your 4 slides, you will tell it `App.loadSlideshow(4)`

You can also pass an optional `config object` to customize your presentation: 
```javascript
var config = {
   folder: 'myPresentation',
   hash: 'awesomePresentation'
};

 App.init(4, config)
 ```

|     property  |   type  |  default | description |
|--------|------|---------|----------|-------------|
| `folder`      |`string` | `slides` |folder path that contains the slides (without final `/`)|
| `hash`        |`string` | `slide`  |the hash that will be in the address bar.|
| `showButtons` |`bool`   | `true`   |shows or hides the buttons at start.|
| `showCounter` |`bool`   | `true`   |renders the counter of the slides.|
| `debug`       |`bool`   | `false`  |enable verbose mode in console|


## Advanced config and usage

The app can handle custom events and call. Since the slides are just html files that are loaded inside index.html, you can add a `script` tag inside one of the pages (the first one, maybe?) and use all the javascript you want to handle special functionalities.
You can also access `event hooks` from the app, such as `onEnter` and `onLeave` in and from a slide. To do so you have to manually create a events object with all the methods inside one of the slides.  
This object **MUST BE GLOBALLY DECLARED** so **NO** var in front of it and must be called `_slidesEvents`. inside that you can put nested object, one for each slide you need to access, with that slide index as name, setting the callbacks as properties. if a slide index is missing or a property is not a function it gets ignored by the hook.

### Example

```javascript

_slidesEvents = {
  0: {
    onEnter: function () { console.log('We are about to enter slide one!')},
    onLeave: 'I am an engine... string, not a function, captain! ignore me!' 
  },
  // we don't have anything for slide 1
  2: {
    // we don't need onEnter here
    onLeave: function () { alert('don\'t leave me alone please!') }
  }
}

```
Keep in mind that events are triggered just before the animation starts.

### hooks and event handlers


#### Hooks
* `onEnter` callback called when entering a slide
* `onLeave` callback called when leaving a slide

#### Handlers
With these you can actually handle the slideshow programmatically, for example by having a button to go to the next or previous slide from a element (I will try to add a _go to slide number_ later on).

* App
  * `.go({dir})` accepts one of `first`, `last`, `next`, `prev` and handles the movement of the slides
  * `.loadSlideshow([slides#], {config})` **requires** at least the first argument (min = 1). there is a default config stored already
  * `updateConfig({config})` manually update the config stored in Slides.config
  * `render()` re-render and assign styling to the slides. used when window changes sizes and at initialization
* Interface
  * `toggle()` toggles on or off the interface
  * `toggleButtons()` refresh directional buttons classes. handles `disabled` class


To see an example usage with all (?) the functionalities, check the `slideshows/` folder files.

## Controls

You can control the app using the UI buttons to go to the first, previous, next or last slide of the presentation, or hide the controls.

You can also control the slide using your keyboard or a remote presenter.

* **first slide** `home` key
* **prev slide** `left` key or presenter
* **next slide** `right` key or presenter or `space` key
* **last slide** `end` key 
* **toggle UI** `T` key

You can always see the controls shortcuts using the `?` button on the bottom left of the UI.


#What's next

I've been thinking about adding an interface for the init configuration, so that you can do everything from the UI instead of accessing the code.  
Also I'm thinking about adding a way to automatically set and call custom callbacks or event listeners for content that's inside the slides.  
One thing I will most probably do in a not so late future is convert everything in `ES6` and create a `react` component for something very similar to this, as I may need it for a bigger project I'm working on.

I don't know if and when I'll do these steps, as I want to tune this as much as possible, but still...