module.exports = function I18nHelper(Hawkejs, Blast) {

	/**
	 * The I18n class
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.3.0
	 *
	 * @param    {String}  domain      The domain the key is in
	 * @param    {String}  key         The string key
	 * @param    {Object}  options
	 */
	var I18n = Blast.Bound.Function.inherits('Alchemy.Base', function I18n(domain, key, options) {

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.2.0
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
	 * Clone this I18n for JSON-dry
	 *
	 * @author   Jelle De Loecker <jelle@develry.be>
	 * @since    0.3.0
	 * @version  0.3.0
	 *
	 * @param    {WeakMap}   wm
	 *
	 * @return   {I18n}
	 */
	I18n.setMethod(function dryClone(wm) {

		var result;

		// Create a new i18n instance
		result = new this.constructor(this.domain, this.key, JSON.clone(this.options, wm));

		return result;
	});

	/**
	 * Clone this I18n for Hawkejs
	 *
	 * @author   Jelle De Loecker <jelle@develry.be>
	 * @since    0.3.0
	 * @version  0.3.0
	 *
	 * @param    {WeakMap}    wm
	 * @param    {ViewRender} viewrender
	 *
	 * @return   {I18n}
	 */
	I18n.setMethod(function toHawkejs(wm, viewrender) {
		var result = this.dryClone(wm);
		result.view = viewrender;
		return result;
	});

	/**
	 * Return an object for json-drying this i18n object
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.2.0
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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.3.0
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
			Model.get('I18n').getTranslation(this.domain, this.key, this.options.locales, function gotTranslation(err, item) {

				// If no items are found in the database, use the given key
				if (err || !item || item.length === 0) {
					source = that.key;
				} else {
					if (params) {
						if (typeof params[0] == 'number' && (params[0] > 1 || params[0] == 0) && item.plural_translation) {
							source = item.plural_translation;
						} else {
							source = item.singular_translation;
						}
					} else {
						source = item.singular_translation;
					}
				}

				if (params) {
					that.result = source.assign(params);
				} else {
					that.result = source;
				}

				callback(null, that.result);
			});
		} else {
			translations = this.view.expose('i18n_translations');
			translation = translations[this.domain];

			if (!translation || !translation[this.key]) {

				if (params) {
					this.result = this.key.assign(params);
				}

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
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.2.0
	 *
	 * @return   {String}
	 */
	I18n.setMethod(function toHawkejsString(view) {
		this.view = view;
		return this.toString();
	});

	/**
	 * Return the string result
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.2.0
	 *
	 * @return   {String}
	 */
	I18n.setMethod(function toString() {

		var element,
		    result;

		result = this.result || this.key;

		if (this.options.html === false) {
			this.options.wrap = false;
			result = result.stripTags();
		}

		if (this.options.wrap === false) {
			return result;
		}

		element = this.view.createElement('x-i18n');
		element.dataset.domain = this.domain;
		element.dataset.key = this.key;
		element.innerHTML = result;

		return element.outerHTML;
	});

	/**
	 * Create an i18n string from inside the view.
	 * Still needs to be printed to the view.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.2.0
	 * @version  0.2.0
	 *
	 * @return   {I18n}
	 */
	Hawkejs.ViewRender.setMethod(function __(domain, key, parameters) {

		var translation,
		    options,
		    html,
		    wrap;

		if (Object.isObject(key)) {
			parameters = key;
			key = domain;
			domain = 'default';
		} else if (key == null) {
			key = domain;
			domain = 'default';
		}

		if (parameters) {
			html = parameters.html;
			wrap = parameters.wrap;
			delete parameters.wrap;
			delete parameters.html;
		}

		options = {
			wrap: wrap,
			html: html,
			parameters: parameters,
			locales: this.internal('locales')
		};

		translation = new I18n(domain, key, options);
		translation.view = this;

		return translation;
	});
};