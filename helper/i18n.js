/**
 * The I18n class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.5.0
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
	this.suffixes = [];
});

/**
 * The parameters
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.0
 * @version  0.5.0
 *
 * @return   {Object}
 */
I18n.setProperty(function parameters() {
	if (this.options.parameters) {
		return this.options.parameters;
	}

	return this.options;
});

/**
 * The available hawkejs ViewRender
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.0
 * @version  0.5.0
 *
 * @return   {Object}
 */
I18n.setProperty(function view() {

	if (this._view) {
		return this._view;
	}

	if (Blast.isBrowser) {
		return hawkejs.scene.generalView;
	}

}, function setView(view) {
	this._view = view;
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
 * Add a suffix
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.4.0
 * @version  0.4.0
 *
 * @param    {String}   suffix
 */
I18n.setMethod(function concat(suffix) {
	this.suffixes.push(suffix);
});

/**
 * Clone this I18n for JSON-dry
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.3.0
 * @version  0.4.0
 *
 * @param    {WeakMap}   wm
 *
 * @return   {I18n}
 */
I18n.setMethod(function dryClone(wm) {

	var result;

	// Create a new i18n instance
	result = new this.constructor(this.domain, this.key, JSON.clone(this.options, wm));

	// Clone the suffixes too
	result.suffixes = JSON.clone(this.suffixes);

	// The view should stay the same, though
	result.view = this.view;

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
 * @version  0.4.1
 *
 * @return   {Object}
 */
I18n.setMethod(function toDry() {
	return {
		value: {
			domain   : this.domain,
			key      : this.key,
			options  : this.options,
			suffixes : this.suffixes
		},
		path: '__Protoblast.Classes.Alchemy.I18n'
	};
});

/**
 * Get a direct version
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.0
 * @version  0.4.0
 */
I18n.setMethod(function getDirect() {
	var result = this.dryClone();
	result.options.wrap = false;
	return result;
});

/**
 * Callback with the translated content (for Hawkejs)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.4.0
 *
 * @param    {Function}   callback
 */
I18n.setMethod(function getContent(callback) {

	var that = this,
	    translations,
	    translation,
	    params,
	    source;

	if (typeof callback != 'function') {
		callback = Function.dummy;
	}

	params = this.parameters;

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
		translations = this.view.expose('i18n_translations') || {};
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

			that.result = source.assign(params);
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
 * @version  0.4.0
 *
 * @return   {String}
 */
I18n.setMethod(function toString() {

	var has_params,
	    element,
	    result,
	    suffix,
	    i;

	has_params = !Object.isEmpty(this.parameters);

	// If no result has been found yet,
	// try it now, maybe it can be found synchronously
	if (!this.result) {
		this.getContent();
	}

	if (this.result) {
		result = this.result;
	} else {
		result = this.key;

		if (has_params) {
			result = result.assign(this.parameters);
		}
	}

	if (this.options.html === false) {
		this.options.wrap = false;
		result = result.stripTags();
	}

	suffix = '';
	for (i = 0; i < this.suffixes.length; i++) {
		suffix += this.suffixes[i];
	}

	if (this.options.wrap === false) {
		return result + suffix;
	}

	element = Hawkejs.Hawkejs.createElement('x-i18n');
	element.dataset.domain = this.domain;
	element.dataset.key = this.key;
	element.innerHTML = result;

	if (has_params) {
		//element.dataset.parameters = String.compressToBase64(JSON.dry(this.parameters));
	}

	return element.outerHTML + suffix;
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

/**
 * Create an i18n string from inside the view.
 * Still needs to be printed to the view.
 * This will force wrap to be false
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.4.0
 * @version  0.4.0
 *
 * @return   {I18n}
 */
Hawkejs.ViewRender.setMethod(function __d(domain, key, parameters) {

	var translation,
	    options,
	    html;

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
		delete parameters.html;
	}

	options = {
		wrap: false,
		html: html,
		parameters: parameters,
		locales: this.internal('locales')
	};

	translation = new I18n(domain, key, options);
	translation.view = this;

	return translation;
});