// Add mode toggle UI
ColorWheel && ColorWheel.extend('modeToggle', function (colorWheel) {
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