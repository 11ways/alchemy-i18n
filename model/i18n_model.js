/**
 * I18n model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  1.0.0
 */
var I18n = Model.extend(function I18nModel(options) {

	var chimera,
	    list,
	    edit;

	I18nModel.super.call(this, options);

	this.addBehaviour('revision');

	// Create the chimera behaviour
	chimera = this.addBehaviour('chimera');

	// Get the list group
	list = chimera.getActionFields('list');

	list.addField('domain');
	list.addField('key');
	list.addField('singular_translation');
	list.addField('plural_translation');

	// Get the edit group
	edit = chimera.getActionFields('edit');

	edit.addField('domain');
	edit.addField('key');
	edit.addField('singular_translation');
	edit.addField('plural_translation');
});

I18n.addField('domain', 'String');
I18n.addField('key', 'String');
I18n.addField('singular_translation', 'Text');
I18n.addField('plural_translation', 'Text');

I18n.setMethod(function getTranslation(domain, key, callback) {

	var options;

	if (typeof key === 'function') {
		callback = key;
		key = domain;
		domain = 'default';
	}

	options = {
		conditions: {
			domain: domain,
			key: key
		},
		fields: ['domain', 'key', 'singular_translation', 'plural_translation']
	};

	this.find('first', options, function gotResult(err, item) {

		if (err != null) {
			return callback(err);
		}

		if (item.length == 0) {
			return callback(null, item);
		}

		callback(null, item[0]['I18n']);
	});
});