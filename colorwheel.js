// Kuler Color Wheel with D3 v1.0
// http://github.com/benknight/kuler-colorwheel-with-d3
// Benjamin Knight / MIT License

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
      ANALOGOUS: 'Analogous',
      TRIAD: 'Triad',
      COMPLEMENTARY: 'Complementary',
      MONOCHROMATIC: 'Monochromatic',
      SHADES: 'Shades',
      CUSTOM: 'Custom'
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
    var self = this;

    // Event Dispatch
    this.dispatch = d3.dispatch('update');

    // Set configs
    this.options = {
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
        this.options[option] = options[option];
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
      this.currentMode = modes.CUSTOM;
    } else {
      var newData = [];
      var numColors = (typeof data === 'number') ? data : 5;
      for (var i = 0; i < data; i++) {
        newData.push(tinycolor(this.options.initRoot).toHsv());
      }
      data = newData;
      this.currentMode = this.options.initMode;
    }

    this.container = d3.select(container);
    this.r = this.options.width / 2;


    // --- Draw the UI ---

    var wheel = this.container.append('svg')
      .attr('class', 'wheel')
      .attr('width', this.options.width + 2 * this.options.margin)
      .attr('height', this.options.width + 2 * this.options.margin);

    var markerTrailsContainer = wheel.append('g')
      .attr('class', 'marker-trails')
      .attr('width', this.options.width)
      .attr('height', this.options.width)
      .attr('transform', 'translate(' + this.options.margin + ', ' + this.options.margin + ')');

    var markerTrails = markerTrailsContainer.selectAll('.marker-trail').data(data);

    markerTrails.enter().append('line')
      .attr('class', 'marker-trail')
      .attr('x1', this.options.width / 2)
      .attr('y1', this.options.width / 2);

    var markersContainer = wheel.append('g')
      .attr('class', 'markers')
      .attr('width', this.options.width)
      .attr('height', this.options.width)
      .attr('transform', 'translate(' + this.options.margin + ', ' + this.options.margin + ')');

    var markers = markersContainer.selectAll('.marker').data(data);

    markers.enter().append('circle')
      .attr('class', 'marker')
      .attr('r', this.options.markerWidth / 2);

    markers.exit().remove();

    var dragstart = function () {
      self.container.selectAll('.marker')
        .attr('data-startingHue', function (d) {
          return scientificToArtisticSmooth(d.h);
        });
    };

    var drag = function (d) {
      var pos = self.pointOnCircle(d3.event.x, d3.event.y);
      var hs = self.getHSFromSVGPosition(pos.x, pos.y);
      d.h = hs.h;
      d.s = hs.s;
      var p = self.svgToCartesian(d3.event.x, d3.event.y);
      var dragHue = ((Math.atan2(p.y, p.x) * 180 / Math.PI) + 720) % 360;
      var startingHue = parseFloat(d3.select(this).attr('data-startingHue'));
      var theta1 = (360 + startingHue - dragHue) % 360;
      var theta2 = (360 + dragHue - startingHue) % 360;
      self.setHarmony(this, theta1 < theta2 ? -1 * theta1 : theta2);
    };

    var dragend = function () {
      self.container.selectAll('.marker').attr('data-startingHue', null);
    };

    markers.call(
      d3.behavior.drag()
        .on('drag', drag)
        .on('dragstart', dragstart)
        .on('dragend', dragend)
    );

    this.dispatch.on('update.markers', function () {
      self.container.selectAll('.marker').attr({
        cx: function (d) {
          var p = self.getSVGPositionFromHS(d.h, d.s);
          return p.x;
        },
        cy: function (d) {
          var p = self.getSVGPositionFromHS(d.h, d.s);
          return p.y;
        },
        fill: function (d) {
          return hexFromHS(d.h, d.s);
        }
      });

      self.container.selectAll('.marker-trail').attr({
        'x2': function (d) {
          var p = self.getSVGPositionFromHS(d.h, d.s);
          return p.x;
        },
        'y2': function (d) {
          var p = self.getSVGPositionFromHS(d.h, d.s);
          return p.y;
        }
      });
    });

    // phew
    this.init();

    // init plugins
    ColorWheel.plugins.forEach(function (plugin) {
      plugin(self, data);
    });
  };

  // Tack on the modes
  ColorWheel.modes = modes;

  // Provide a plugin interface
  ColorWheel.plugins = [];

  ColorWheel.extend = function (pluginFn) {
    this.plugins.push(pluginFn);
  }

  ColorWheel.prototype.svgToCartesian = function (x, y) {
    return {'x': x - this.r, 'y': this.r - y};
  };

  ColorWheel.prototype.cartesianToSVG = function (x, y) {
    return {'x': x + this.r, 'y': this.r - y};
  };

  // Given an SVG point (x, y), returns the closest point to (x, y) still in the circle.
  ColorWheel.prototype.pointOnCircle = function (x, y) {
    var p = this.svgToCartesian(x, y);
    if (Math.sqrt(p.x * p.x + p.y * p.y) <= this.r) {
      return {'x': x, 'y': y};
    } else {
      var theta = Math.atan2(p.y, p.x);
      var x_ = this.r * Math.cos(theta);
      var y_ = this.r * Math.sin(theta);
      return this.cartesianToSVG(x_, y_);
    }
  };

  // Get a coordinate pair from hue and saturation components.
  ColorWheel.prototype.getSVGPositionFromHS = function (h, s) {
    var hue = scientificToArtisticSmooth(h);
    var theta = hue * (Math.PI / 180);
    var y = Math.sin(theta) * this.r * s;
    var x = Math.cos(theta) * this.r * s;
    return this.cartesianToSVG(x, y);
  };

  // Inverse of getSVGPositionFromHS
  ColorWheel.prototype.getHSFromSVGPosition = function (x, y) {
    var p = this.svgToCartesian(x, y);
    var theta = Math.atan2(p.y, p.x);
    var artisticHue = (theta * (180 / Math.PI) + 360) % 360;
    var scientificHue = artisticToScientificSmooth(artisticHue);
    var s = Math.min(Math.sqrt(p.x*p.x + p.y*p.y) / this.r, 1);
    return {h: scientificHue, s: s};
  };

  ColorWheel.prototype.init = function () {
    var self = this;
    var root = this.container.select('.marker');
    var rootHue = scientificToArtisticSmooth(root.datum().h);

    switch (this.currentMode) {
      case modes.ANALOGOUS:
        this.container.selectAll('.marker').each(function (d, i) {
          var newHue = (rootHue + (markerDistance(i) * self.options.defaultSlice) + 720) % 360;
          d.h = artisticToScientificSmooth(newHue);
          d.s = 1;
          d.v = 1;
        });
        break;
      case modes.MONOCHROMATIC:
      case modes.SHADES:
        this.container.selectAll('.marker').each(function (d, i) {
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
        this.container.selectAll('.marker').each(function (d, i) {
          var newHue = (rootHue + ((i % 2) * 180) + 720) % 360;
          d.h = artisticToScientificSmooth(newHue);
          d.s = 1 - 0.2 * stepFn(2)(i);
          d.v = 1;
        });
        break;
      case modes.TRIAD:
        this.container.selectAll('.marker').each(function (d, i) {
          var newHue = (rootHue + ((i % 3) * 120) + 720) % 360;
          d.h = artisticToScientificSmooth(newHue);
          d.s = 1 - 0.5 * stepFn(3)(i);
          d.v = 1;
        });
        break;
    }
    this.dispatch.update();
  };

  ColorWheel.prototype.setHarmony = function (target, theta) {
    var self = this;
    var root = this.container.select('.marker');
    var rootHue = scientificToArtisticSmooth(root.datum().h);

    // Find out how far the dragging marker is from the root marker.
    var cursor = target;
    var counter = 0;
    while (cursor = cursor.previousSibling) {
      counter++;
    }
    var targetDistance = markerDistance(counter);

    switch (this.currentMode) {
      case modes.ANALOGOUS:
        this.container.selectAll('.marker').each(function (d, i) {
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
        this.container.selectAll('.marker').each(function (d) {
          var startingHue = parseFloat(d3.select(this).attr('data-startingHue'));
          d.h = artisticToScientificSmooth((startingHue + theta + 720) % 360);
          if (self.currentMode == modes.SHADES) {
            d.s = 1;
          }
        });
        break;
    }
    this.dispatch.update();
  };

  // Public ColorWheel interface
  ColorWheel.prototype._getColorsAs = function (toFunk) {
    return this.container.selectAll('.marker').data().map(function (d) {
      return tinycolor({h: d.h, s: d.s, v: d.v})[toFunk]();
    });
  };

  ColorWheel.prototype.getColorsAsHEX = function () {
    return this._getColorsAs('toHexString');
  };

  ColorWheel.prototype.getColorsAsRGB = function () {
    return this._getColorsAs('toRgbString');
  };

  ColorWheel.prototype.getColorsAsHSL = function () {
    return this._getColorsAs('toHslString');
  };

  ColorWheel.prototype.getColorsAsHSV = function () {
    return this._getColorsAs('toHsvString');
  };

  ColorWheel.prototype.setMode = function (mode) {
    checkIfModeExists(mode);
    this.currentMode = mode;
    this.container.select('select').property('value', mode);
    this.init();
  };

  /** Plugins */

  // Add theme UI
  ColorWheel.extend(function (colorWheel, data) {
    var theme = colorWheel.container.append('div').attr('class', 'theme');
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
        colorWheel.dispatch.update();
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

    colorWheel.dispatch.on('update.theme', function () {
      colorWheel.container.selectAll('.swatch').each(function (d, i) {
        switch (colorWheel.currentMode) {
          case ColorWheel.modes.TRIAD:
            this.style.order = this.style.webkitOrder = i % 3;
            break;
          default:
            this.style.order = this.style.webkitOrder = markerDistance(i);
            break;
        }
      });

      colorWheel.container.selectAll('.color').each(function (d) {
        var c = tinycolor({h: d.h, s: d.s, v: d.v});
        this.style.backgroundColor = c.toHexString();
      });

      colorWheel.container.selectAll('.slider').each(function (d) {
        var val = parseInt(d.v * 100);
        this.value = val;
        d3.select(this).attr('value', val);
      });

      colorWheel.container.selectAll('.value').each(function (d) {
        var c = tinycolor({h: d.h, s: d.s, v: d.v});
        this.value = colorWheel.options.colorString(c);
      });
    });

    colorWheel.dispatch.update();
  });

  // Add mode toggle UI
  ColorWheel.extend(function (colorWheel) {
    var modeToggle = colorWheel.container.append('select')
      .attr('class', 'mode-toggle')
      .on('change', function () {
        colorWheel.currentMode = this.value;
        colorWheel.init();
      });

    for (var mode in ColorWheel.modes) {
      modeToggle.append('option').text(ColorWheel.modes[mode])
        .attr('selected', function () {
          return ColorWheel.modes[mode] == colorWheel.currentMode ? 'selected' : null;
        });
    }
  });

  return ColorWheel;
}));
