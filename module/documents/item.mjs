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

    const title = document.createElement("div");
    title.className = "arianrhod-item-title";

    const name = document.createElement("h2");
    name.className = "arianrhod-item-name";
    name.innerHTML = item.name;
    title.append(name);

    const level = item.system.attributes?.currentSL?.value;
    if (item.type === "skill" && level) {
      const lv = document.createElement("span");
      lv.className = "arianrhod-item-level";
      lv.innerHTML = `Lv.${level}`;

      title.append(lv);
    }

    const tagText = [];

    const attrs = item.system.attributes;
    for (const key in attrs) {
      if (!attrs[key].value || attrs[key].isSL) continue;

      const tag = document.createElement("span");
      tag.className = "arianrhod-item-tag";
      tag.innerHTML = `${game.i18n.localize("ARIANRHOD.Attributes." + key.capitalize())} : ${attrs[key].value}`;

      tagText.push(tag);
    }

    const tags = document.createElement("div");
    tags.className = "arianrhod-item-tags";
    tags.append(...tagText);

    const e = item.system.effects?.value;
    const d = item.system.description?.value;

    const effect = document.createElement("div");
    effect.className = "arianrhod-item-effect";
    effect.innerHTML = (e && e?.length > 0) ? e : "<p>효과 없음</p>";

    const description = document.createElement("div");
    description.className = "arianrhod-item-description";
    description.innerHTML = (d && d?.length > 0) ? d : "<p>설명 없음</p>";

    const text = document.createElement("div");
    text.className = "arianrhod-item-text";
    text.append(effect, description);

    const content = document.createElement("div");
    content.className = `arianrhod-item-card arianrhod-${item.type}-card`;
    content.append(title, tags, text);

    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        content: content.outerHTML
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
