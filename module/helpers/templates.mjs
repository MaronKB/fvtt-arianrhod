/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Actor partials.
    'systems/arianrhod/templates/actor/parts/actor-features.hbs',
    'systems/arianrhod/templates/actor/parts/actor-equipments.hbs',
    'systems/arianrhod/templates/actor/parts/actor-skills.hbs',
    'systems/arianrhod/templates/actor/parts/actor-effects.hbs'
  ]);
};
