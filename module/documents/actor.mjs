import {ARIANRHOD} from "../helpers/config.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ArianrhodActor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the actor source data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.arianrhod || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    const systemData = actorData.system;

    const mainClass = actorData.items.find(e => e.type === "mainClass");
    const subClass = actorData.items.find(e => e.type === "subClass");
    const race = actorData.items.find(e => e.type === "race");

    /* 아이템 루프 */
    actorData.items.forEach((item) => {
      if (item.system.abilities) for (let [key, ability] of Object.entries(item.system.abilities)) {
        systemData.abilities[key].base += Number(ability.base) ?? 0;
        systemData.abilities[key].mod += Number(ability.value) ?? 0;
      }
      if (item.system.combatant) for (let [key, attr] of Object.entries(item.system.combatant)) {
        systemData.combatant[key].dice += Number(attr.dice) ?? 0;
        systemData.combatant[key].mod += Number(attr.mod) ?? 0;
      }
      if (item.system.actions) for (let [key, action] of Object.entries(item.system.actions)) {
        systemData.actions[key].dice += Number(action.dice) ?? 0;
        systemData.actions[key].mod += Number(action.mod) ?? 0;
      }
    });

    for (let [key, ability] of Object.entries(systemData.abilities)) {
      ability.value = Number(ability.base) + Number(ability.point);
      ability.bonus = Math.floor(ability.value / 3);
      ability.total = ability.bonus + ability.mod + ability.etc;
    }

    systemData.attributes.HP.max = Number(systemData.abilities.str.value) + (mainClass?.system.attributes?.baseHP?.value ?? 0) + (subClass?.system.attributes?.baseHP?.value ?? 0) + (mainClass?.system.attributes?.riseHP?.value ?? 0) * (systemData.attributes.level.value - 1);

    systemData.attributes.MP.max = Number(systemData.abilities.mnd.value) + (mainClass?.system.attributes?.baseMP?.value ?? 0) + (subClass?.system.attributes?.baseMP?.value ?? 0) + (mainClass?.system.attributes?.riseMP?.value ?? 0) * (systemData.attributes.level.value - 1);

    const features = systemData.combatant;

    for (let [key, combatAttr] of Object.entries(features)) {
      combatAttr.label = game.i18n.localize("ARIANRHOD.Combatant." + key.capitalize());
      combatAttr.value = combatAttr.mod;
      if (combatAttr.key) combatAttr.value += systemData.abilities[combatAttr.key].total;
      if (key === "actionPoints") combatAttr.value += systemData.abilities.per.total;
      if (key === "movement") combatAttr.value += 5;
      combatAttr.formula = `${combatAttr.dice + 2}D6+${combatAttr.value}`;
    }

    const actions = systemData.actions;

    for (let [key, action] of Object.entries(actions)) {
      action.label = game.i18n.localize("ARIANRHOD.Actions." + key.capitalize());
      action.value = systemData.abilities[action.key].total + action.mod;
      action.formula = `${action.dice + 2}D6+${action.value}`;
    }

  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    const systemData = actorData.system;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Starts off by populating the roll data with `this.system`
    const data = { ...super.getRollData() };

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    // Add level for easier access, or fall back to 0.
    if (data.attributes.level) {
      data.lvl = data.attributes.level.value ?? 0;
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }
}
