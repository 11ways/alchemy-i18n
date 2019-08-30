// Don't load this model if a custom model is used
if (alchemy.plugins.i18n.custom_model) {
	return;
}

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
 * The default field to use as display
 *
 * @type {String}
 */
I18n.setProperty('displayField', 'key');

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
 * Get a translation record
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.5.0
 *
 * @param    {String}     domain     The domain/scope/category of the wanted key
 * @param    {String}     key        The key of the translation to get
 * @param    {Array}      locales    The locales to get
 * @param    {Function}   callback   Function to callback with the result
 *
 * @return   {Pledge}
 */
I18n.setMethod(function getTranslation(domain, key, locales, callback) {

	var options,
	    pledge = new Classes.Pledge();

	if (typeof key === 'function') {
		callback = key;
		key = domain;
		domain = 'default';
	}

	if (typeof locales == 'function') {
		callback = locales;
		locales = null;
	}

	pledge.done(callback);

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
			return pledge.reject(err);
		}

		if (!item) {
			return pledge.resolve();
		}

		return pledge.resolve(item);
	});

	return pledge;
});

/**
 * Get translated string
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.2.0
 * @version  0.5.0
 *
 * @param    {String}     domain     The domain/scope/category of the wanted key
 * @param    {String}     key        The key of the translation to get
 * @param    {Array}      locales    The locales to get
 * @param    {Object}     params     Optional parameters for the translation
 *
 * @return   {Pledge}
 */
I18n.setMethod(async function getTranslatedString(domain, key, locales, params) {

	let item = await this.getTranslation(domain, key, locales);

	if (!item) {
		return;
	}

	let source;

	if (params) {
		if (typeof params[0] == 'number' && (params[0] > 1 || params[0] == 0) && item.plural_translation) {
			source = item.plural_translation;
		} else {
			source = item.singular_translation;
		}
	} else {
		source = item.singular_translation;
	}

	if (source && params) {
		return source.assign(params);
	}

	return source;
});