/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ArianrhodItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();

    if (this.system.abilities) for (let [key, ability] of Object.entries(this.system.abilities)) {
      ability.label = game.i18n.localize("ARIANRHOD.Ability." + key.capitalize());
    }
    if (this.system.combatant) for (let [key, combat] of Object.entries(this.system.combatant)) {
      combat.label = game.i18n.localize("ARIANRHOD.Combatant." + key.capitalize());
    }
    if (this.system.actions) for (let [key, action] of Object.entries(this.system.actions)) {
      action.label = game.i18n.localize("ARIANRHOD.Actions." + key.capitalize());
    }
    if (this.system.attributes) for (let [key, attr] of Object.entries(this.system.attributes)) {
      attr.label = game.i18n.localize("ARIANRHOD.Attributes." + key.capitalize());
    }
    if (this.system.effects) this.system.effects.label = game.i18n.localize("ARIANRHOD.Effects");
    if (this.system.description) this.system.description.label = game.i18n.localize("ARIANRHOD.Description");
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    // Starts off by populating the roll data with `this.system`
    const rollData = { ...super.getRollData() };

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;

    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({actor: this.actor});
    const rollMode = game.settings.get('core', 'rollMode');

    const level = item.system.attributes?.currentSL;
    const lv = level ? `<span class="arianrhod-item-level">${level}</span>` : "";
    const title = `<h2 class="arianrhod-item-title">${item.name + lv}</h2>`;
    const content = `<div class="arianrhod-item-effect">${item.system.effects.value}</div><div class="arianrhod-item-description">${item.system.description.value}</div>`;

    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        content: title + content,
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.formula, rollData);
      // If you need to store the value first, uncomment the next line.
      // const result = await roll.evaluate();
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }
}
