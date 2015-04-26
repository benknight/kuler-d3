// Add theme UI
ColorWheel && ColorWheel.extend('theme', function (colorWheel, data) {
  var theme = colorWheel.container.append('div').attr('class', 'theme');
  var swatches = theme.selectAll('div').data(data);

  swatches.enter().append('div')
    .attr('class', 'theme__swatch')
    .append('div').attr('class', 'theme__color');

  swatches.exit().remove();

  // Add sliders
  var sliders = theme.selectAll('.theme__swatch')
    .append('input')
    .attr('type', 'range')
    .attr('class', 'theme__slider')
    .on('input', function (d) {
      d.v = parseInt(this.value) / 100;
      colorWheel.dispatch.update();
    })
    .on('change', function () {
      colorWheel.dispatch.updateEnd();
    });

  // Add color codes
  var colorValues = theme.selectAll('.theme__swatch')
    .append('input')
      .attr('type', 'text')
      .attr('class', 'theme__value')
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
    colorWheel.container.selectAll('.theme__swatch').each(function (d, i) {
      switch (colorWheel.currentMode) {
        case ColorWheel.modes.TRIAD:
          this.style.order = this.style.webkitOrder = i % 3;
          break;
        default:
          this.style.order = this.style.webkitOrder = ColorWheel.markerDistance(i);
          break;
      }
    });

    colorWheel.container.selectAll('.theme__color').each(function (d) {
      var c = tinycolor({h: d.h, s: d.s, v: d.v});
      this.style.backgroundColor = c.toHexString();
    });

    colorWheel.container.selectAll('.theme__slider').each(function (d) {
      var val = parseInt(d.v * 100);
      this.value = val;
      d3.select(this).attr('value', val);
    });

    colorWheel.container.selectAll('.theme__value').each(function (d) {
      var c = tinycolor({h: d.h, s: d.s, v: d.v});
      this.value = colorWheel.options.colorString(c);
    });
  });
});