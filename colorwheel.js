// ColorWheel
// @version 0.1.0
// @author Benjamin Knight
// @requires IE9+, TinyColor, D3.js
// MIT License

(function (root, factory) {
  // AMD/requirejs: Define the module
  if (typeof define === 'function' && define.amd) {
      define(['tinycolor', 'd3'], factory);
  } else {
    // Expose to browser window
    root.ColorWheel = factory(root.tinycolor, root.d3);
  }
}(this, function (tinycolor, d3) {

  // Simple range mapping function
  // For example, mapRange(5, 0, 10, 0, 100) = 50
  function mapRange(value, fromLower, fromUpper, toLower, toUpper) {
    return (toLower + (value - fromLower) * ((toUpper - toLower) / (fromUpper - fromLower)));
  }

  // These two functions are ripped straight from Kuler source.
  // They convert between scientific hue to the color wheel's "artistic" hue.
  function artisticToScientificSmooth(hue) {
    return (
      hue < 60  ? hue * (35 / 60):
      hue < 122 ? mapRange(hue, 60,  122, 35,  60):
      hue < 165 ? mapRange(hue, 122, 165, 60,  120):
      hue < 218 ? mapRange(hue, 165, 218, 120, 180):
      hue < 275 ? mapRange(hue, 218, 275, 180, 240):
      hue < 330 ? mapRange(hue, 275, 330, 240, 300):
                  mapRange(hue, 330, 360, 300, 360));
  }

  function scientificToArtisticSmooth(hue) {
    return (
        hue < 35  ? hue * (60 / 35):
        hue < 60  ? mapRange(hue, 35,  60,  60,  122):
        hue < 120 ? mapRange(hue, 60,  120, 122, 165):
        hue < 180 ? mapRange(hue, 120, 180, 165, 218):
        hue < 240 ? mapRange(hue, 180, 240, 218, 275):
        hue < 300 ? mapRange(hue, 240, 300, 275, 330):
                    mapRange(hue, 300, 360, 330, 360));
  }

  // Get a hex string from hue and sat components, with 100% brightness.
  function hexFromHS(h, s) {
    return tinycolor({h: h, s: s, v: 1}).toHexString();
  }

  // Used to determine the distance from the root marker.
  // (The first DOM node with marker class)
  // Domain: [0, 1,  2, 3,  4, ... ]
  // Range:  [0, 1, -1, 2, -2, ... ]
  function markerDistance(i) {
    return Math.ceil(i / 2) * (2 * (i % 2) - 1);
  }

  // Returns a step function with the given base.
  // e.g. with base = 3, returns a function with this domain/range:
  // Domain: [0, 1, 2, 3, 4, 5, ...]
  // Range:  [0, 0, 0, 1, 1, 1, ...]
  function stepFn(base) {
    return function(x) { return Math.floor(x / base); }
  }


  /**
   * ColorWheel Modes
   * These modes define a relationship between the colors on a color wheel,
   * based on "science".
   */

  var modes = {
      CUSTOM: 'Custom',
      ANALOGOUS: 'Analogous',
      COMPLEMENTARY: 'Complementary',
      MONOCHROMATIC: 'Monochromatic',
      SHADES: 'Shades',
      TRIAD: 'Triad',
  };

  // Throw an error if someone gives us a bad mode.
  function checkIfModeExists(mode) {
    var modeExists = false;
    for (var possibleMode in modes) {
      if (modes[possibleMode] == mode) {
        modeExists = true;
        break;
      }
    }
    if (! modeExists) {
      throw Error('Invalid mode specified: ' + mode);
    }
    return true;
  }


  /** Constructor */

  var ColorWheel = function ColorWheel (data, container, options) {
    // Initialize the mode and create a container for all of the UI
    var self = this;

    // Set configs
    self.options = {
      width: 350,
      markerWidth: 30,
      margin: 20,
      defaultSlice: 20,
      initRoot: 'red',
      initMode: modes.ANALOGOUS,
      colorString: function (color) {
        return color.toHexString();
      }
    };

    if (typeof options === 'object') {
      for (option in options) {
        if (option == 'initMode') {
          checkIfModeExists(options[option]);
        }
        self.options[option] = options[option];
      }
    }

    if (typeof container === 'undefined') {
      container = document.body;
    }

    if (typeof data === 'object') {
      // Parse data as tinycolor and convert to HSV
      var newData = [];
      for (var datum in data) {
        newData.push(tinycolor(data[datum]).toHsv());
      }
      data = newData;
      self.currentMode = modes.CUSTOM;
    } else {
      var newData = [];
      var numColors = (typeof data === 'number') ? data : 5;
      for (var i = 0; i < data; i++) {
        newData.push(tinycolor(self.options.initRoot).toHsv());
      }
      data = newData;
      self.currentMode = self.options.initMode;
    }

    self.container = d3.select(container);

    var r = self.options.width / 2;

    var svgToCartesian = function (x, y) {
      return {'x': x - r, 'y': r - y};
    };

    var cartesianToSVG = function (x, y) {
      return {'x': x + r, 'y': r - y};
    };

    // Given an SVG point (x, y), returns the closest point to (x, y) still in the circle.
    var pointOnCircle = function (x, y) {
      var p = svgToCartesian(x, y);
      if (Math.sqrt(p.x * p.x + p.y * p.y) <= r) {
        return {'x': x, 'y': y};
      } else {
        var theta = Math.atan2(p.y, p.x);
        var x_ = r * Math.cos(theta);
        var y_ = r * Math.sin(theta);
        return cartesianToSVG(x_, y_);
      }
    };

    // Get a coordinate pair from hue and saturation components.
    var getSVGPositionFromHS = function (h, s) {
      var hue = scientificToArtisticSmooth(h);
      var theta = hue * (Math.PI / 180);
      var y = Math.sin(theta) * r * s;
      var x = Math.cos(theta) * r * s;
      return cartesianToSVG(x, y);
    };

    // Inverse of getSVGPositionFromHS
    var getHSFromSVGPosition = function (x, y) {
      var p = svgToCartesian(x, y);
      var theta = Math.atan2(p.y, p.x);
      var artisticHue = (theta * (180 / Math.PI) + 360) % 360;
      var scientificHue = artisticToScientificSmooth(artisticHue);
      var s = Math.min(Math.sqrt(p.x*p.x + p.y*p.y) / r, 1);
      return {h: scientificHue, s: s};
    };

    var init = self._init = function () {
      var root = self.container.select('.marker');
      var rootHue = scientificToArtisticSmooth(root.datum().h);

      switch (self.currentMode) {
        case modes.ANALOGOUS:
          self.container.selectAll('.marker').each(function (d, i) {
            var newHue = (rootHue + (markerDistance(i) * self.options.defaultSlice) + 720) % 360;
            d.h = artisticToScientificSmooth(newHue);
            d.s = 1;
            d.v = 1;
          });
          break;
        case modes.MONOCHROMATIC:
        case modes.SHADES:
          self.container.selectAll('.marker').each(function (d, i) {
            d.h = artisticToScientificSmooth(rootHue);
            if (self.currentMode == modes.SHADES) {
              d.s = 1;
              d.v = 0.25 + 0.75 * Math.random();
            } else {
              d.s = 1 - (0.15 * i + Math.random() * 0.1);
              d.v = 0.75 + 0.25 * Math.random();
            }
          });
          break;
        case modes.COMPLEMENTARY:
          self.container.selectAll('.marker').each(function (d, i) {
            var newHue = (rootHue + ((i % 2) * 180) + 720) % 360;
            d.h = artisticToScientificSmooth(newHue);
            d.s = 1 - 0.2 * stepFn(2)(i);
            d.v = 1;
          });
          break;
        case modes.TRIAD:
          self.container.selectAll('.marker').each(function (d, i) {
            var newHue = (rootHue + ((i % 3) * 120) + 720) % 360;
            d.h = artisticToScientificSmooth(newHue);
            d.s = 1 - 0.5 * stepFn(3)(i);
            d.v = 1;
          });
          break;
      }
      updateMarkersAndTheme();
    };

    var updateHarmony = function (target, theta) {
      var root = self.container.select('.marker');
      var rootHue = scientificToArtisticSmooth(root.datum().h);

      // Find out how far the dragging marker is from the root marker.
      var cursor = target;
      var counter = 0;
      while (cursor = cursor.previousSibling) {
        counter++;
      }
      var targetDistance = markerDistance(counter);

      switch (self.currentMode) {
        case modes.ANALOGOUS:
          self.container.selectAll('.marker').each(function (d, i) {
            var startingHue = parseFloat(d3.select(this).attr('data-startingHue'));
            var slices = 1;
            if (targetDistance !== 0) {
              slices = markerDistance(i) / targetDistance;
            }
            if (this !== target) {
              d.h = artisticToScientificSmooth(
                (startingHue + (slices * theta) + 720) % 360
              );
            }
          });
          break;
        case modes.MONOCHROMATIC:
        case modes.COMPLEMENTARY:
        case modes.SHADES:
        case modes.TRIAD:
          self.container.selectAll('.marker').each(function (d) {
            var startingHue = parseFloat(d3.select(this).attr('data-startingHue'));
            d.h = artisticToScientificSmooth((startingHue + theta + 720) % 360);
            if (self.currentMode == modes.SHADES) {
              d.s = 1;
            }
          });
          break;
      }
      updateMarkersAndTheme();
    };

    var dragstart = function () {
      self.container.selectAll('.marker')
        .attr('data-startingHue', function (d) {
          return scientificToArtisticSmooth(d.h);
        });
    };

    var drag = function (d) {
      var pos = pointOnCircle(d3.event.x, d3.event.y);
      var hs = getHSFromSVGPosition(pos.x, pos.y);
      d.h = hs.h;
      d.s = hs.s;
      var p = svgToCartesian(d3.event.x, d3.event.y);
      var dragHue = ((Math.atan2(p.y, p.x) * 180 / Math.PI) + 720) % 360;
      var startingHue = parseFloat(d3.select(this).attr('data-startingHue'));
      updateHarmony(this, dragHue - startingHue);
    };

    var dragend = function () {
      self.container.selectAll('.marker').attr('data-startingHue', null);
    };

    var updateTheme = function () {
      self.container.selectAll('.swatch').each(function (d, i) {
        switch (self.currentMode) {
          case modes.TRIAD:
            this.style.order = this.style.webkitOrder = i % 3;
            break;
          default:
            this.style.order = this.style.webkitOrder = markerDistance(i);
            break;
        }
      });

      self.container.selectAll('.color').each(function (d) {
        var c = tinycolor({h: d.h, s: d.s, v: d.v});
        this.style.backgroundColor = c.toHexString();
      });

      self.container.selectAll('.slider').each(function (d) {
        var val = parseInt(d.v * 100);
        this.value = val;
        d3.select(this).attr('value', val);
      });

      self.container.selectAll('.value').each(function (d) {
        var c = tinycolor({h: d.h, s: d.s, v: d.v});
        this.value = self.options.colorString(c);
      });
    };

    var updateMarkers = function () {
      self.container.selectAll('.marker').attr({
        cx: function (d) {
          var p = getSVGPositionFromHS(d.h, d.s);
          return p.x;
        },
        cy: function (d) {
          var p = getSVGPositionFromHS(d.h, d.s);
          return p.y;
        },
        fill: function (d) {
          return hexFromHS(d.h, d.s);
        }
      });
    };

    var updateMarkersAndTheme = function () {
      updateMarkers();
      updateTheme();
    };

    // Draw wheel + markers UI
    var wheel = self.container.append('svg')
      .attr('class', 'wheel')
      .attr('width', self.options.width + 2 * self.options.margin)
      .attr('height', self.options.width + 2 * self.options.margin);

    var markersContainer = wheel.append('g')
      .attr('class', 'markers')
      .attr('width', self.options.width)
      .attr('height', self.options.width)
      .attr('transform', 'translate(' + self.options.margin + ', ' + self.options.margin + ')');

    var markers = markersContainer.selectAll('.marker').data(data)
    markers.enter().append('circle')
      .attr('class', 'marker')
      .attr('r', self.options.markerWidth / 2)
    markers.exit().remove();

    markers.call(
      d3.behavior.drag()
        .on('drag', drag)
        .on('dragstart', dragstart)
        .on('dragend', dragend)
    );

    // Add theme UI
    var theme = self.container.append('div').attr('class', 'theme');

    var swatches = theme.selectAll('div').data(data);
    swatches.enter().append('div')
      .attr('class', 'swatch')
      .append('div')
        .attr('class', 'color');
    swatches.exit().remove();

    // Add sliders
    var sliders = theme.selectAll('.swatch')
      .append('input')
      .attr('type', 'range')
      .attr('class', 'slider')
      .on('input', function (d) {
        d.v = parseInt(this.value) / 100;
        updateTheme();
      });

    // Add color codes
    var colorValues = theme.selectAll('.swatch')
      .append('input')
        .attr('type', 'text')
        .attr('class', 'value')
        .on('focus', function () {
          // Like jQuery's .one(), attach a listener that only executes once.
          // This way the user can use the cursor normally after the initial selection.
          d3.select(this).on('mouseup', function () {
            d3.event.preventDefault();
            // Detach the listener
            d3.select(this).on('mouseup', null);
          })
          this.select();
        });

    // Add mode toggle UI
    var modeToggle = self.container.append('select')
      .attr('class', 'mode-toggle')
      .on('change', function () {
        self.currentMode = this.value;
        init();
      });

    for (var mode in modes) {
      modeToggle.append('option').text(modes[mode])
        .attr('selected', function () {
          return modes[mode] == self.currentMode ? 'selected' : null;
        });
    }

    // phew
    init();
  };

  ColorWheel.prototype = {
    _getColorsAs: function (toFunk) {
      return this.container.selectAll('.marker').data().map(function (d) {
        return tinycolor({h: d.h, s: d.s, v: d.v})[toFunk]();
      });
    },

    getColorsAsHEX: function () {
      return this._getColorsAs('toHexString');
    },

    getColorsAsRGB: function () {
      return this._getColorsAs('toRgbString');
    },

    getColorsAsHSL: function () {
      return this._getColorsAs('toHslString');
    },

    getColorsAsHSV: function () {
      return this._getColorsAs('toHsvString');
    },

    setMode: function (mode) {
      checkIfModeExists(mode);
      this.currentMode = mode;
      this.container.select('select').property('value', mode);
      this._init();
    },
  };

  ColorWheel.modes = modes;

  return ColorWheel;
}));
