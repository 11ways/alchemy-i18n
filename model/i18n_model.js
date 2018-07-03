/**
 * I18n model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.2.0
 */
var I18n = Function.inherits('Alchemy.Model.App', function I18n(options) {

	I18n.super.call(this, options);
	this.addBehaviour('revision');
});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
I18n.constitute(function addFields() {
	this.addField('domain', 'String');
	this.addField('key', 'String');
	this.addField('singular_translation', 'String', {translatable: true});
	this.addField('plural_translation', 'String', {translatable: true});
});

/**
 * Configure chimera for this model
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 */
I18n.constitute(function chimeraConfig() {

	var list,
	    edit;

	if (!this.chimera) {
		return;
	}

	// Get the list group
	list = this.chimera.getActionFields('list');

	list.addField('created');
	list.addField('domain');
	list.addField('key');
	list.addField('singular_translation');
	//list.addField('plural_translation');

	// Get the edit group
	edit = this.chimera.getActionFields('edit');

	edit.addField('domain');
	edit.addField('key');
	edit.addField('singular_translation');
	edit.addField('plural_translation');

	// Get the peek group
	let peek = this.chimera.getActionFields('peek');

	peek.addField('created');
	peek.addField('updated');
	peek.addField('domain');
	peek.addField('key');
	peek.addField('singular_translation');
});

/**
 * The default sort options
 *
 * @type {Object}
 */
I18n.setProperty(function sort() {
	return {_id: -1};
});

/**
 * Get a translation
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  1.0.0
 *
 * @param    {String}     domain     The domain/scope/category of the wanted key
 * @param    {String}     key        The key of the translation to get
 * @param    {Array}      locales    The locales to get
 * @param    {Function}   callback   Function to callback with the result
 */
I18n.setMethod(function getTranslation(domain, key, locales, callback) {

	var options;

	if (typeof key === 'function') {
		callback = key;
		key = domain;
		domain = 'default';
	}

	if (typeof locales == 'function') {
		callback = locales;
		locales = null;
	}

	if (typeof callback != 'function') {
		throw new Error('I18n#getTranslation requires a callback');
	}

	options = {
		conditions: {
			domain: domain,
			key: key
		},
		locale: locales,
		fields: ['domain', 'key', 'singular_translation', 'plural_translation']
	};

	this.find('first', options, function gotResult(err, item) {

		if (err != null) {
			return callback(err);
		}

		if (!item) {
			return callback(null, item);
		}

		callback(null, item);
	});
});