// Background gradient
ColorWheel && ColorWheel.extend('bgGradient', function (colorWheel) {
  var gradient = d3.select('#gradient');
  if (! gradient.size()) {
    gradient = colorWheel.container.append('div').attr({
      'id': 'gradient',
      'class': 'gradient'
    });
  }
  colorWheel.dispatch.on('updateEnd.bg', function () {
    var gradientStops = colorWheel.getColorsAsHEX();
    gradientStops[0] += ' 10%';
    gradientStops[gradientStops.length - 1] += ' 90%';
    gradient.style('background-image', 'linear-gradient(to right, ' + gradientStops.join() + ')');
  });
});