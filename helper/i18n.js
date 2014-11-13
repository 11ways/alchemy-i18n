module.exports = function I18nHelper(Hawkejs, Blast) {

	/**
	 * The I18n class
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  1.0.0
	 *
	 * @param    {String}  domain      The domain the key is in
	 * @param    {String}  key         The string key
	 * @param    {Object}  options
	 */
	var I18n = Blast.Bound.Function.inherits(function I18n(domain, key, options) {

		if (options == null) {
			options = {};
		}

		// The domain/scope/category of this translation
		this.domain = domain;
		this.key = key;
		this.options = options;
	});

	/**
	 * unDry an object
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 *
	 * @return   {Object}
	 */
	I18n.setStatic(function unDry(obj) {

		var result;

		// Create a new I18n instance (without calling the constructor)
		result = Object.create(I18n.prototype);

		// Overwrite certain properties
		Blast.Bound.Object.assign(result, obj);

		return result;
	});

	/**
	 * Return an object for json-drying this i18n object
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 *
	 * @return   {Object}
	 */
	I18n.setMethod(function toDry() {
		return {
			value: {
				domain: this.domain,
				key: this.key,
				options: this.options
			},
			path: '__Protoblast.Classes.I18n'
		};
	});

	/**
	 * Callback with the translated content (for Hawkejs)
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 *
	 * @param    {Function}   callback
	 */
	I18n.setMethod(function getContent(callback) {

		var that = this,
		    translations,
		    translation,
		    params,
		    source;

		params = that.options.parameters

		if (Blast.isNode) {
			Model.get('I18n').getTranslation(this.domain, this.key, function gotTranslation(err, item) {

				if (params) {
					if (typeof params[0] == 'number' && (params[0] > 1 || params[0] == 0) && item.plural_translation) {
						source = item.plural_translation;
					} else {
						source = item.singular_translation;
					}

					that.result = source.assign(that.options.parameters);
				} else {
					that.result = item.singular_translation;
				}

				callback(null, that.result);
			});
		} else {
			translations = this.view.expose('i18n_translations');
			translation = translations[this.domain];

			if (!translation || !translation[this.key]) {
				return callback(null, this.result);
			}

			translation = translation[this.key];

			if (params) {
				if (typeof params[0] == 'number' && (params[0] > 1 || params[0] == 0) && translation.plural) {
					source = translation.plural;
				} else {
					source = translation.singular;
				}

				that.result = source.assign(that.options.parameters);
			} else {
				that.result = translation.singular;
			}

			callback(null, this.result);
		}
	});

	/**
	 * Return the result (for Hawkejs)
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 *
	 * @return   {String}
	 */
	I18n.setMethod(function toString() {

		var element = Hawkejs.ElementBuilder.create('x-i18n');

		element.data('domain', this.domain);
		element.data('key', this.key);
		element.setContent(this.result || this.key);

		return element.toString();
	});

	/**
	 * Create an i18n string from inside the view.
	 * Still needs to be printed to the view.
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    1.0.0
	 * @version  1.0.0
	 *
	 * @return   {I18n}
	 */
	Hawkejs.ViewRender.setMethod(function __(domain, key, parameters) {

		var translation;

		if (Object.isObject(key)) {
			parameters = key;
			key = domain;
			domain = 'default';
		} else if (key == null) {
			key = domain;
			domain = 'default';
		}

		translation = new I18n(domain, key, {parameters: parameters});
		translation.view = this;

		return translation;
	});
};