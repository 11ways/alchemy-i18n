/**
 * The Microcopy class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 *
 * @param    {String}  key         The microcopy key
 * @param    {Object}  parameters  The parameters for the translation
 */
const Microcopy = Blast.Bound.Function.inherits('Alchemy.Base', function Microcopy(key, parameters) {

	if (this == null || !(this instanceof Microcopy)) {
		return new Microcopy(key, parameters);
	}

	this.key = key;
	this.parameters = parameters;
	this.record = null;
	this.rendered = null;
});

/**
 * The available hawkejs Renderer
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 *
 * @return   {Object}
 */
Microcopy.enforceProperty(function renderer(value, old_value) {

	if (!value && Blast.isBrowser) {
		value = hawkejs.scene.general_renderer;
	}

	return value;
});

/**
 * The fallback translation
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 *
 * @return   {String}
 */
Microcopy.enforceProperty(function fallback(value, old_value) {

	if (!value) {
		// @TODO: add other parameters
		return this.key;
	}

	return value;
});

/**
 * unDry an object
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 *
 * @return   {Microcopy}
 */
Microcopy.setStatic(function unDry(obj) {

	var result = new Microcopy(obj.key, obj.parameters);

	result.record = obj.record;

	return result;
});

/**
 * Return an object for json-drying this i18n object
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 *
 * @return   {Object}
 */
Microcopy.setMethod(function toDry() {
	return {
		value: {
			key        : this.key,
			parameters : this.parameters,
			record     : this.record,
		}
	};
});

/**
 * Get the localtes
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 *
 * @return   {Array}
 */
Microcopy.setMethod(function getLocales() {

	let result;

	if (this.renderer) {
		result = this.renderer.internal('locales');
	}

	if (!result && Blast.isBrowser && typeof hawkejs != 'undefined') {
		result = hawkejs.scene.exposed.locales;
	}

	if (!result || !result.length) {
		result = ['en'];
	}

	return result;
});

/**
 * Callback with the translated content (for Hawkejs)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 *
 * @param    {Hawkejs.Renderer}   [renderer]
 *
 * @return   {Pledge}
 */
Microcopy.setMethod(async function renderHawkejsContent(renderer) {

	if (this[Hawkejs.RESULT] != null) {
		return this[Hawkejs.RESULT];
	}

	if (renderer && !this.renderer) {
		this.renderer = renderer;
	}

	// Actually load the translation from the database
	await this.findTranslation();

	// Render the translation contents
	if (this.record) {
		await this.renderTranslation();
	}

	return this.prepareResult();
});

/**
 * Load the data
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 */
Microcopy.setMethod(async function findTranslation() {

	if (!this.record) {
		let Microcopy = this.getModel('Microcopy'),
		    locales = this.getLocales();

		let promise = Microcopy.findTranslation(this.key, this.parameters, locales);

		this.record = promise;

		let translation = await promise;

		this.record = translation || false;
	}

	return this.record;
});

/**
 * Render the found record's translation
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 */
Microcopy.setMethod(async function renderTranslation() {

	if (!this.record) {
		return;
	}

	let hawkejs = alchemy.hawkejs;

	if (!hawkejs && Blast.isBrowser) {
		hawkejs = window.hawkejs;
	}

	let that = this,
	    fnc = hawkejs.compile(this.record.translation),
	    pledge = new Classes.Pledge();

	hawkejs.render(fnc, this.parameters, function gotResult(err, result) {

		if (err) {
			return pledge.reject(err);
		}

		that.rendered = result;

		pledge.resolve(result);
	});

	return pledge;
});

/**
 * Prepare the result
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 */
Microcopy.setMethod(function prepareResult() {

	if (this[Hawkejs.RESULT]) {
		return this[Hawkejs.RESULT];
	}

	let rendered;

	if (!this.record) {
		rendered = this.fallback;
	} else {
		rendered = this.rendered;

		if (rendered == null) {
			rendered = this.fallback;
		}
	}

	let element = this.renderer.createElement('micro-copy');
	element.key = this.key;
	element.innerHTML = rendered;

	// @TODO: parameters & propper html handling

	this[Hawkejs.RESULT] = element;

	return element;
});

/**
 * Get an element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 */
Microcopy.setMethod(function toElement() {

	let element = this.renderer.createElement('micro-copy');
	element.key = this.key;
	element.parameters = this.parameters;

	return element;
});

/**
 * Create a microcopy translation from inside a template
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 *
 * @return   {I18n}
 */
Hawkejs.Renderer.setCommand(function t(key, parameters) {

	let microcopy = new Microcopy(key, parameters);

	microcopy.renderer = this;

	return microcopy;
});

/**
 * The "translate" expression, inherited from "Print"
 * For example: {%t "hello" parameter="value" %}
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 */
const Translate = Hawkejs.Expression.getClass('Print', 'Translate');

/**
 * Do the given pieces match this expression?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 *
 * @param    {Object}
 *
 * @return   {Boolean}
 */
Translate.setStatic(function matches(options) {
	return (options.type == 't' || options.type == 'translate');
});

/**
 * Parse the given line if it matches
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 */
Translate.setMethod(function execute() {

	// Get the arguments
	let params,
	    args = this.getTokenValuesArray(this.options, this.vars),
	    key;

	key = args[0];
	params = args[1];

	let value = this.view.t(key, params);

	if (value != null) {
		this.view.print(value);
	}
});