// Standard Layout Templates - 4 Different Configurations
// These are pre-designed templates that users can select

export const STANDARD_LAYOUTS = {
  'layout_1_vertical_left': {
    name: 'Vertical with Laterals (Left Side)',
    description: 'Main pipe vertical in center, laterals going left',
    shapes: [
      { x: 153.25847071511792, y: 63.15837592997349, id: 'shape_1765524618013', type: 'well', width: 85, height: 68, radius: 23.47167964389269, rotation: 0 },
      { id: 'shape_1765524653521', dash: [], type: 'main_pipe', points: [150.45, 311.620256793798, 152.15, 86.27062760099514], stroke: 'orange', strokeWidth: 3 },
      { id: 'shape_1765524678083', dash: [], type: 'sub_pipe', points: [634.95, 162.020254294049, 151.3, 160.120254294049], stroke: '#166534', strokeWidth: 3 },
      { id: 'shape_1765524685554', dash: [10, 5], type: 'lateral_pipe', points: [636.65, 193.470255343299, 147.05, 193.470255343299], stroke: 'blue', strokeWidth: 2 },
      { id: 'shape_1765524691305', dash: [10, 5], type: 'lateral_pipe', points: [637.5, 235.970255343299, 150.45, 234.070255343299], stroke: 'blue', strokeWidth: 2 },
      { id: 'shape_1765524695431', dash: [10, 5], type: 'lateral_pipe', points: [632.24, 276.770255343299, 152.15, 274.870255343299], stroke: 'blue', strokeWidth: 2 },
      { x: 120.6499999999999, y: 91.79999999999992, id: 'shape_1765524700596', type: 'filter_image', width: 33.8910814451048, height: 27.113172915883, radius: 40, rotation: 0 },
      { x: 124.0999999999999, y: 123.24999999999992, id: 'shape_1765524713741', type: 'valve_image', width: 39.63419075110817, height: 31.70775110489101, radius: 40, rotation: 0 },
      { x: 90.24810828116679, y: 21.08316184570555, id: 'shape_1765524725234', type: 'border', width: 586.7744679908081, height: 320.8574931421694, radius: 40, rotation: 0 },
      { x: 123.25, y: 288.15, id: 'shape_1765524754193', type: 'flush_image', width: 55.57992187202992, height: 44.46339597910010, radius: 40, rotation: 0 }
    ]
  },
  
  'layout_2_horizontal_bottom': {
    name: 'Horizontal with Sub-pipes (Bottom)',
    description: 'Main pipe horizontal, sub-pipes going downward',
    shapes: [
      { x: 635.2584707151179, y: 60.15837592997349, id: 'shape_1765524618013', type: 'well', width: 85, height: 68, radius: 23.47167964389269, rotation: 0 },
      { id: 'shape_1765524653521', dash: [], type: 'main_pipe', points: [633.45, 310.620256793798, 635.1500000000001, 85.27062760099514], stroke: 'orange', rotation: 0, strokeWidth: 3 },
      { id: 'shape_1765524678083', dash: [], type: 'sub_pipe', points: [634.95, 162.020254294049, 151.3, 160.120254294049], stroke: '#166534', rotation: 0, strokeWidth: 3 },
      { id: 'shape_1765524685554', dash: [10, 5], type: 'lateral_pipe', points: [636.65, 193.470255343299, 147.05, 193.470255343299], stroke: 'blue', rotation: 0, strokeWidth: 2 },
      { id: 'shape_1765524691305', dash: [10, 5], type: 'lateral_pipe', points: [637.5, 235.970255343299, 150.45, 234.070255343299], stroke: 'blue', rotation: 0, strokeWidth: 2 },
      { id: 'shape_1765524695431', dash: [10, 5], type: 'lateral_pipe', points: [634.24, 273.770255343299, 154.15, 271.870255343299], stroke: 'blue', rotation: 0, strokeWidth: 2 },
      { x: 603.6499999999999, y: 96.79999999999993, id: 'shape_1765524700596', type: 'filter_image', width: 33.8910814451048, height: 27.113172915883, radius: 40, rotation: 0 },
      { x: 605.0999999999999, y: 122.24999999999991, id: 'shape_1765524713741', type: 'valve_image', width: 39.63419075110817, height: 31.70775110489101, radius: 40, rotation: 0 },
      { x: 90.2481082811668, y: 21.08316184570555, id: 'shape_1765524725234', type: 'border', width: 586.7744679908081, height: 320.8574931421694, radius: 40, rotation: 0 },
      { x: 607.25, y: 290.15, id: 'shape_1765524754193', type: 'flush_image', width: 55.57992187202992, height: 44.4633959791001, radius: 40, rotation: 0 }
    ]
  },
  
  'layout_3_u_shaped': {
    name: 'U-Shaped Layout',
    description: 'Main pipe with laterals on both sides',
    shapes: [
      { x: 179.25847071511794, y: 64.15837592997349, id: 'shape_1765524618013', type: 'well', width: 85, height: 68, radius: 23.47167964389269, rotation: 0 },
      { id: 'shape_1765543242081', dash: [], type: 'main_pipe', points: [204.49999999999997, 63, 602.5, 63], stroke: 'orange', strokeWidth: 3 },
      { x: 583.0000000000005, y: 47.00000000000002, id: 'shape_1765543274914', type: 'flush_image', width: 42.99999999999975, height: 42.999999999999766, radius: 40, rotation: 0 },
      { x: 243.81928593363915, y: 35.009983114448445, id: 'shape_1765543279107', type: 'filter_image', width: 30.268965121752306, height: 30.26896512175241, radius: 40, rotation: 91.05118074954346 },
      { x: 279.59601202601283, y: 38.99999999999986, id: 'shape_1765543297020', type: 'valve_image', width: 32.596012026013106, height: 32.59601202601332, radius: 40, rotation: 89.99999999999986 },
      { id: 'shape_1765543371954', dash: [], type: 'sub_pipe', points: [299.5, 62, 301.5, 370], stroke: '#166534', strokeWidth: 3 },
      { id: 'shape_1765543422178', dash: [10, 5], type: 'lateral_pipe', points: [349.5, 367, 351.5, 64], stroke: 'blue', strokeWidth: 2 },
      { id: 'shape_1765543429348', dash: [10, 5], type: 'lateral_pipe', points: [401.5, 368, 397.5, 64], stroke: 'blue', strokeWidth: 2 },
      { id: 'shape_1765543438137', dash: [10, 5], type: 'lateral_pipe', points: [450.5, 365, 447.5, 61], stroke: 'blue', strokeWidth: 2 },
      { id: 'shape_1765543444971', dash: [10, 5], type: 'lateral_pipe', points: [503.5, 364, 500.5, 65], stroke: 'blue', strokeWidth: 2 },
      { id: 'shape_1765543450191', dash: [10, 5], type: 'lateral_pipe', points: [550.5, 366, 548.5, 65], stroke: 'blue', strokeWidth: 2 },
      { x: 121.02480387966716, y: 25.81819157219266, id: 'shape_1765543465265', type: 'border', width: 552.3851347426051, height: 366.2386874860439, radius: 40, rotation: 0 }
    ]
  },
  
  'layout_4_grid_pattern': {
    name: 'Grid Pattern Layout',
    description: 'Main horizontal with multiple vertical lines creating grid',
    shapes: [
      { x: 642.2584707151179, y: 64.15837592997349, id: 'shape_1765524618013', type: 'well', width: 85, height: 68, radius: 23.47167964389269, rotation: 0 },
      { id: 'shape_1765543242081', dash: [], type: 'main_pipe', points: [219.5, 63, 617.5, 63], stroke: 'orange', rotation: 0, strokeWidth: 3 },
      { x: 191.00000000000045, y: 38.00000000000003, id: 'shape_1765543274914', type: 'flush_image', width: 42.99999999999975, height: 42.999999999999766, radius: 40, rotation: 0 },
      { x: 611.9560029371279, y: 34.87888063904706, id: 'shape_1765543279107', type: 'filter_image', width: 30.26896512175223, height: 30.268965121752494, radius: 40, rotation: 89.50150036988177 },
      { x: 579.7232733142635, y: 41.54435932247275, id: 'shape_1765543297020', type: 'valve_image', width: 28.711056955408807, height: 32.59601202601362, radius: 40, rotation: 88.37492916450488 },
      { id: 'shape_1765543371954', dash: [], type: 'sub_pipe', points: [543.5, 62, 545.5, 370], stroke: '#166534', rotation: 0, strokeWidth: 3 },
      { id: 'shape_1765543422178', dash: [10, 5], type: 'lateral_pipe', points: [349.5, 367, 351.5, 64], stroke: 'blue', rotation: 0, strokeWidth: 2 },
      { id: 'shape_1765543429348', dash: [10, 5], type: 'lateral_pipe', points: [401.5, 368, 397.5, 64], stroke: 'blue', rotation: 0, strokeWidth: 2 },
      { id: 'shape_1765543438137', dash: [10, 5], type: 'lateral_pipe', points: [450.5, 365, 447.5, 61], stroke: 'blue', rotation: 0, strokeWidth: 2 },
      { id: 'shape_1765543444971', dash: [10, 5], type: 'lateral_pipe', points: [503.5, 364, 500.5, 65], stroke: 'blue', rotation: 0, strokeWidth: 2 },
      { id: 'shape_1765543450191', dash: [10, 5], type: 'lateral_pipe', points: [298.5, 363, 296.5, 62], stroke: 'blue', rotation: 0, strokeWidth: 2 },
      { x: 140.02480387966716, y: 17.81819157219266, id: 'shape_1765543465265', type: 'border', width: 552.3851347426051, height: 366.2386874860439, radius: 40, rotation: 0 }
    ]
  },

  'layout_5_both_sides': {
    name: 'Both Sides Layout',
    description: 'Main pipe with laterals on both sides',
    shapes: [
      {"x":64.100141406445,"y":76.10014140644512,"id":"shape_1765539154585","type":"well","width":100,"height":80,"radius":39.28402413987002,"rotation":0},
      {"id":"shape_1765539273066","dash":[],"type":"main_pipe","points":[896.5,26,896.5,26],"stroke":"orange","strokeWidth":3},
      {"id":"shape_1765539288450","dash":[],"type":"sub_pipe","points":[448.5,420,451.5,420],"stroke":"#166534","strokeWidth":3},
      {"id":"shape_1765539302106","dash":[],"type":"sub_pipe","points":[449.5,414,449.5,414],"stroke":"#166534","strokeWidth":3},
      {"id":"shape_1765539335754","dash":[10,5],"type":"lateral_pipe","points":[897.5,208,897.5,208],"stroke":"blue","strokeWidth":2},
      {"x":197.96679936261216,"y":45.004859612894904,"id":"shape_1765539348456","type":"valve_image","width":45.96194077712553,"height":45.9619407771258,"radius":40,"rotation":90.01211462672067},
      {"x":148.04009501048796,"y":44.3549901944587,"id":"shape_1765539359184","type":"filter_image","width":37.0841291150874,"height":37.084129115087734,"radius":40,"rotation":90.4564545232267},
      {"id":"shape_1765539423066","dash":[],"type":"sub_pipe","points":[453.5,415,453.5,415],"stroke":"#166534","strokeWidth":3},
      {"x":433.9999999999998,"y":355.9999999999999,"id":"shape_1765539433785","type":"flush_image","width":30.70016286601765,"height":30.700162866017664,"radius":40,"rotation":0},
      {"x":828.9999999999994,"y":59,"id":"shape_1765539449024","type":"flush_image","width":38.529209698617194,"height":38.52920969861725,"radius":40,"rotation":0},
      {"x":17.737524230194136,"y":23.91640829997907,"id":"shape_1765546133648","type":"border","width":861.977238777997,"height":371.9229437289388,"radius":40,"rotation":0},
      {"id":"shape_1765546205251","dash":[],"type":"main_pipe","points":[109.5,104,109.5,104],"stroke":"orange","strokeWidth":3},
      {"id":"shape_1765546214187","dash":[],"type":"main_pipe","points":[102.5,78,843.5,81],"stroke":"orange","strokeWidth":3},
      {"id":"shape_1765546235501","dash":[],"type":"sub_pipe","points":[449.5,78,449.5,363],"stroke":"#166534","strokeWidth":3},
      {"id":"shape_1765546244712","dash":[10,5],"type":"lateral_pipe","points":[107.5,146,791.5,148],"stroke":"blue","strokeWidth":2},
      {"id":"shape_1765546249363","dash":[10,5],"type":"lateral_pipe","points":[113.5,210,792.5,207],"stroke":"blue","strokeWidth":2},
      {"id":"shape_1765546253309","dash":[10,5],"type":"lateral_pipe","points":[119.5,273,790.5,268],"stroke":"blue","strokeWidth":2},
      {"id":"shape_1765546260209","dash":[10,5],"type":"lateral_pipe","points":[122.5,335,789.5,333],"stroke":"blue","strokeWidth":2}
    ]
  }
};

// Get a layout by key
export const getLayoutByKey = (layoutKey) => {
  return STANDARD_LAYOUTS[layoutKey];
};
