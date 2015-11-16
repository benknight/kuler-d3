// Background gradient
ColorWheel.extend('bgGradient', function (colorWheel) {
  var gradient = d3.select(colorWheel.selector('gradient'));
  if (! gradient.size()) {
    gradient = colorWheel.container.append('div').attr({
      'id': 'gradient',
      'class': colorWheel.cx('gradient')
    });
  }
  colorWheel.dispatch.on('updateEnd.gradient', function () {
    var gradientStops = colorWheel.getColorsAsHEX();
    gradientStops[0] += ' 10%';
    gradientStops[gradientStops.length - 1] += ' 90%';
    gradient.style('background-image', 'linear-gradient(to right, ' + gradientStops.join() + ')');
  });
});
