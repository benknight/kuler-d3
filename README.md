<h1><img src="https://raw.githubusercontent.com/benknight/kuler-colorwheel-with-d3/master/colorwheel.png" align="left" width="55" hspace="10">Kuler Color Wheel with D3</h1>

> Reproduction of the color wheel UI found on http://kuler.adobe.com, built with D3.

## Usage

By specifying a number of colors:

```javascript
var colorWheel = new ColorWheel(5, '.colorwheel');
```
    
With preexisting color values:

```javascript
// Use any valid tinycolor input
// More: github.com/bgrins/TinyColor
var data = [
  'red', 
  '#0ff', 
  {r: 0, g: 255, b: 0},
  {h: 220, s: 1, v: 1},
  {h: 300, s: 1, l: 0.5},
  'hsl(0, 100%, 50%)'
];

var colorWheel = new ColorWheel(data, '.colorwheel');
```

## Demo

http://codepen.io/benknight/full/nADpy/
