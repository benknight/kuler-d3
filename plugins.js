ColorWheel.extend(function (wheel, data) {
  // Add theme UI
  var theme = wheel.container.append('div').attr('class', 'theme');

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
});

ColorWheel.extend(function (wheel) {
  // Add mode toggle UI
  var modeToggle = wheel.container.append('select')
    .attr('class', 'mode-toggle')
    .on('change', function () {
      wheel.currentMode = this.value;
      wheel._init();
    });

  for (var mode in ColorWheel.modes) {
    modeToggle.append('option').text(ColorWheel.modes[mode])
      .attr('selected', function () {
        return ColorWheel.modes[mode] == wheel.currentMode ? 'selected' : null;
      });
  }
});
