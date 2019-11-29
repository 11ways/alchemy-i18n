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

	// Extra flags
	this.addField('flags', 'String', {array: true});

	// The actual translation
	this.addField('translation', 'Text');

	// Optional domain for this translation
	this.addField('domain', 'String');

	// Preferred fallback domain to use
	this.addField('fallback_domain', 'String');

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
	list.addField('flags');
	list.addField('translation');
	list.addField('domain');

	// Get the edit group
	edit = this.chimera.getActionFields('edit');

	edit.addField('key');
	edit.addField('language');
	edit.addField('flags');
	edit.addField('translation');
	edit.addField('domain');
	edit.addField('fallback_domain');
	edit.addField('filters');
});