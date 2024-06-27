import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ArianrhodActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['arianrhod', 'sheet', 'actor'],
      width: 630,
      height: 650,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'features',
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/arianrhod/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type === 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type === 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.system.abilities)) {
      v.label = game.i18n.localize(CONFIG.ARIANRHOD.abilities[k]) ?? k;
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const equipmentsTemp = [];
    const skillsTemp = [];

    let mainClass = {};
    let subClass = {};
    let race = {};

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      if (i.type === "mainClass") {
        mainClass = i;
      }
      if (i.type === "subClass") {
        subClass = i;
      }
      if (i.type === "race") {
        race = i;
      }

      if (i.type === 'equipment') {
        equipmentsTemp.push(i);
      }
      else if (i.type === 'skill') {
        skillsTemp.push(i);
      }
    }

    const etc = game.i18n.localize("ARIANRHOD.Uncategorized");

    const skills = {};
    skills[etc] = [];
    skillsTemp.forEach(e => {
      const skillClass = e.system.attributes.class.value ? e.system.attributes.class.value : etc;
      if (!skills[skillClass]) {
        skills[skillClass] = [];
        skills[skillClass].push(e);
      } else {
        skills[skillClass].push(e);
      }
    });

    const equipments = {};
    equipments[etc] = [];
    equipmentsTemp.forEach(e => {
      const equipmentPosition = e.system.attributes.position.value ? e.system.attributes.position.value : etc;
      if (!equipments[equipmentPosition]) {
        equipments[equipmentPosition] = [];
        equipments[equipmentPosition].push(e);
      } else {
        equipments[equipmentPosition].push(e);
      }
    });

    // Assign and return
    context.mainClass = mainClass;
    context.subClass = subClass;
    context.race = race;
    context.equipments = equipments;
    context.skills = skills;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.on('click', '.item-create', this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.on('click', '.effect-control', (ev) => {
      const row = ev.currentTarget.closest('li');
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    // Rollable abilities.
    html.on('click', '.rollable', this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }

    html.on('click', '.item-title', (ev) => {
      const row = ev.currentTarget.closest('li');
      const item = this.actor.items.get(row.dataset.itemId);
      const content = row.querySelector(".item-text");
      if (content) content.remove();
      else {
        const text = document.createElement("div");
        text.className = "item-text";
        
        if (item.system.effects?.value) {
          const effects = document.createElement("div");
          effects.className = "item-effect";
          effects.innerHTML = item.system.effects.value;

          text.append(effects);
        }
        
        if (item.system.description?.value) {
          const description = document.createElement("div");
          description.className = "item-desc";
          description.innerHTML = item.system.description.value;

          text.append(description);
        }

        row.append(text);
      }
    });
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    data.attributes = (type === "skill") ? {class: {value: header.dataset.class}} : (type === "equipment") ? {position: {value: header.dataset.position}} : {};
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system['type'];

    if (type === "mainClass" || type === "subClass" || type === "race") {
      this.actor.items.contents.filter(e => e.type === type).forEach(e => e.delete());
    }

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }
}
