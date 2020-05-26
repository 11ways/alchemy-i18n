/**
 * Microcopy model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 */
var Microcopy = Function.inherits('Alchemy.Model.App', function Microcopy(options) {
	Microcopy.super.call(this, options);
});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 */
Microcopy.constitute(function addFields() {

	// The key identifier
	this.addField('key', 'String');

	// The language this translation is for
	this.addField('language', 'String');

	// The actual translation
	this.addField('translation', 'Text');

	let filters = new Classes.Alchemy.Schema(this);

	// Name of the parameter to filter
	filters.addField('name', 'String', {title: 'Parameter name'});

	// Value to select
	filters.addField('value', 'String', {title: 'Parameter value'});

	this.addField('filters', filters, {array: true});
});

/**
 * Configure chimera for this model
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 */
Microcopy.constitute(function chimeraConfig() {

	var list,
	    edit;

	if (!this.chimera) {
		return;
	}

	// Get the list group
	list = this.chimera.getActionFields('list');

	list.addField('key');
	list.addField('language');
	list.addField('translation');

	// Get the edit group
	edit = this.chimera.getActionFields('edit');

	edit.addField('key');
	edit.addField('language');
	edit.addField('translation');
	edit.addField('filters');
});