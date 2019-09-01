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
 * The LRU cache
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @return   {Object}
 */
I18n.setStatic('cache', new Classes.Develry.Cache({
	length : 100,
}));

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
 * Backward compatible thing
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.5.1
 *
 * @return   {Pledge}
 */
I18n.setMethod(function getContent(next) {
	return this.renderHawkejsContent().done(next);
});

/**
 * Callback with the translated content (for Hawkejs)
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.6.0
 *
 * @param    {Hawkejs.Renderer}   [renderer]
 *
 * @return   {Pledge}
 */
I18n.setMethod(async function renderHawkejsContent(renderer) {

	var that = this,
	    params,
	    source,
	    cache_key;

	if (this.domain) {
		cache_key = this.domain;
	} else {
		cache_key = 'default';
	}

	cache_key += '.' + this.key;

	params = this.parameters;

	if (Blast.isNode) {

		let locales = this.options.locales,
		    result,
		    model = Model.get(alchemy.plugins.i18n.model),
		    error;

		if ((!locales || locales.length == 0) && renderer) {
			locales = renderer.internal('locales');
		}

		try {
			result = await model.getTranslatedString(this.domain, this.key, locales, params);
		} catch (err) {
			error = err;
		}

		// If no items are found in the database, use the given key
		if (error || !result) {
			result = that.options.fallback || that.key;
		}

		if (params) {
			result = result.assign(params);
		}

		that.result = result;

		that.prepareResult(false);

	} else {
		let has_exposed = this.view.expose('i18n_expose_all');

		if (has_exposed !== false) {
			let translations = this.view.expose('i18n_translations') || {},
			    translation = translations[this.domain];

			if (!translation || !translation[this.key]) {

				if (params) {
					this.result = (this.options.fallback || this.key).assign(params);
				}
			} else {

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
			}
		} else {
			// Need to get the translation from the server
			let source = I18n.cache.get(cache_key);

			if (!source) {
				source = alchemy.fetch('I18n#string', {
					parameters: {
						domain : this.domain || 'default',
						key    : this.key
					}
				});

				// Set the promise already
				I18n.cache.set(cache_key, source);

				source = await source;

				// Set the result now too
				I18n.cache.set(cache_key, source);
			}

			if (source && typeof source.then == 'function') {
				source = await source;
			}

			if (!source) {
				source = this.options.fallback || this.key;
			}

			if (params) {
				source = source.assign(params);
			}

			this.result = source;
		}

		this.prepareResult(false);
	}

	return this[Hawkejs.RESULT];
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
 * Prepare the result
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 */
I18n.setMethod(function prepareResult(fetch_content) {

	var has_params,
	    element,
	    result,
	    suffix,
	    i;

	if (this[Classes.Hawkejs.RESULT] != null) {
		return this[Classes.Hawkejs.RESULT];
	}

	has_params = !Object.isEmpty(this.parameters);

	// If no result has been found yet,
	// try it now, maybe it can be found synchronously
	if (fetch_content !== false && !this.result) {
		this.renderHawkejsContent();
	}

	if (this.result) {
		result = this.result;
	} else {
		result = this.options.fallback || this.key;

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
		result = result + suffix;
	} else {
		element = Hawkejs.Hawkejs.createElement('x-i18n');
		element.dataset.domain = this.domain;
		element.dataset.key = this.key;
		element.innerHTML = result;

		if (suffix) {
			element.innerHTML += suffix;
		}

		result = element;
	}

	this[Classes.Hawkejs.RESULT] = result;

	return result;
});

/**
 * Return the string result
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.6.0
 *
 * @return   {String}
 */
I18n.setMethod(function toString() {

	var result = this.prepareResult();

	if (typeof result == 'string') {
		return result;
	}

	return result.outerHTML;
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
Hawkejs.Renderer.setCommand(function __(domain, key, parameters) {

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
Hawkejs.Renderer.setCommand(function __d(domain, key, parameters) {

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