/**
 * Microcopy model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 */
const Microcopy = Function.inherits('Alchemy.Model.App', 'Microcopy');

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.0
 * @version  0.7.0
 */
Microcopy.constitute(function addFields() {

	// The key identifier
	this.addField('key', 'String');

	// The language this translation is for
	this.addField('language', 'String');

	// The actual translation
	this.addField('translation', 'String');

	let filters = new Classes.Alchemy.Schema(this);

	// Name of the parameter to filter
	filters.addField('name', 'String', {title: 'Parameter name'});

	// Is this an optional filter? (More like a tag)
	filters.addField('optional', 'Boolean');

	// Value to select
	filters.addField('value', 'String', {
		title       : 'Parameter value',
		description : 'An empty value will match anything (score +1), "*" will match anything (score +5), and an exact match will score +10',
	});

	this.addField('filters', filters, {array: true});

	// Lock the caps used in the translation?
	// (This is used in German, for example)
	this.addField('lock_case', 'Boolean');

	// The optional weight of this translation
	// (In case there are multiple matches)
	this.addField('weight', 'Number');

	// Does this translation contain code?
	this.addField('contains_code', 'Boolean');

	// Does this translation contain something that needs to be encoded for HTML?
	this.addField('contains_html', 'Boolean');
});

/**
 * Configure chimera for this model
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.1
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
	edit.addField('lock_case');
	edit.addField('weight');
	edit.addField('filters');
});

/**
 * Re-save all records in the database
 * without updating the 'updated' field
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.4
 * @version  0.6.4
 */
Microcopy.setMethod(function touchAll(callback) {
	return this.eachRecord(function touch(record, index, next) {
		record.save(null, {set_updated: false}, function done(err) {
			next(err);
		});
	}, callback);
});

/**
 * Do something before saving
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.4
 * @version  0.6.4
 */
Microcopy.setMethod(function beforeSave(document, options) {

	let contains_code = false,
	    contains_html = false,
	    translation   = document.translation;

	if (translation) {

		if (translation.includes('<%') || translation.includes('{{') || translation.includes('{%')) {
			contains_code = true;
			contains_html = true;
		} else {
			let encoded = translation.encodeHTML();

			if (encoded !== translation) {
				contains_html = true;
			}
		}
	}

	document.contains_code = contains_code;
	document.contains_html = contains_html;
});