<h1>Color Wheel with D3</h1>

> Reconstruction of the color wheel UI found on http://color.adobe.com (formerly known as Kuler) using [D3.js](https://github.com/mbostock/d3).

**Note**: The `master` branch is in a WIP state.  If you wish to use this code, please use the version on the `gh-pages` branch for maximum profit. ;)

## Demo

http://benknight.github.io/kuler-d3/

## Usage

By specifying a number of colors:

```javascript
var colorWheel = new ColorWheel('.colorwheel');
colorWheel.bindData(5);
```
    
or, with preexisting color values:

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

var colorWheel = new ColorWheel('.colorwheel');
colorWheel.bindData(data);
```
