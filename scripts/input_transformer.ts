// Transforms input.js file to add new (key, value) pairs to static map objects.
// See svgprocessor.js for how this is used.
// TODO annoying that ES6 export doesn't work here! Also only works with .ts
module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const { mapName, valuePairs } = options;

  return j(file.source)
    .find(j.VariableDeclarator)
    .filter(path => path.value.id.name === mapName)
    .find(j.ObjectExpression)
    .forEach(obj => {
      // really only ever transforms 1 object in input.js
      for (const [k, v] of valuePairs) {
        obj.value.properties.push(j.property('init', j.identifier(k), j.literal(v)));
      }
    })
    .toSource();
};