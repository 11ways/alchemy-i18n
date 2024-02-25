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
 * Enforce the parameters property
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @return   {Object}
 */
Microcopy.enforceProperty(function parameters(value, old_value) {

	if (value) {

		let {fallback, ...rest} = value,
		    key,
		    val;

		if (fallback) {
			this.fallback = fallback;
		}

		value = {};

		for (key in rest) {
			val = rest[key];

			if (val == null) {
				continue;
			}

			value[key] = val;
		}
	}

	return value;
});

/**
 * unDry an object
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.7.0
 *
 * @return   {Microcopy}
 */
Microcopy.setStatic(function unDry(obj) {

	var result = new Microcopy(obj.key, obj.parameters);

	result.record = obj.record;

	if (obj.fallback) {
		result.fallback = obj.fallback;
	}

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
			fallback   : this.fallback,
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
		    locales = this.getLocales(),
		    pledge = new Pledge();

		let promise = Microcopy.findTranslation(this.key, this.parameters, locales);

		this.record = pledge;

		let translation = await promise;

		// Make sure these are Client documents
		translation = JSON.clone(translation, 'toHawkejs');

		pledge.resolve(translation);

		this.record = translation || false;
	}

	return this.record;
});

/**
 * Render the found record's translation
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.7.0
 */
Microcopy.setMethod(function renderTranslation() {

	if (!this.record) {
		return;
	}

	// If the weight is negative, prefer any fallbacks
	if (this.record.weight < 0 && this.fallback) {
		return;
	}

	// No need to do any expensive rendering if there is no code or HTML
	if (this.record.contains_code === false && this.record.contains_html === false) {
		this.rendered = this.record.translation;
		return this.rendered;
	}

	let hawkejs = alchemy.hawkejs;

	if (!hawkejs && Blast.isBrowser) {
		hawkejs = window.hawkejs;
	}

	let parent_renderer = this.renderer,
	    renderer;
	
	if (parent_renderer) {
		renderer = parent_renderer.createSubRenderer();
	}

	if (!renderer) {
		renderer = new Hawkejs.Renderer(hawkejs);
	}

	let fnc = hawkejs.compile(this.record.translation);
	let pledge = new Pledge();

	renderer.renderHTML(fnc, this.parameters).done((err, result) => {

		if (err) {
			pledge.reject(err);
		} else {
			this.rendered = result;
			pledge.resolve(result);
		}
	});

	return pledge;
});

/**
 * Prepare the result
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.7.0
 */
Microcopy.setMethod(function prepareResult() {

	if (this[Hawkejs.RESULT]) {
		return this[Hawkejs.RESULT]();
	}

	let rendered;

	if (!this.record) {
		rendered = this.fallback || this.key;
	} else {
		rendered = this.rendered;

		if (rendered == null) {
			rendered = this.fallback || this.key;
		}
	}

	if (rendered && this.parameters?.style) {

		let apply_style = true;

		if (typeof this.record?.hasFilter == 'function') {
			apply_style = !this.record.hasFilter('style');
		}

		if (apply_style) {
			let style = this.parameters.style;

			if (style == 'title') {
				rendered = rendered.titleize();
			}
		}
	}

	const toElement = () => {
		let element = this.toElement();
		element.innerHTML = rendered;
		return element;
	};

	this[Hawkejs.RESULT] = toElement;

	return toElement();
});

/**
 * Create an element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.7
 * @version  0.6.7
 */
Microcopy.setMethod(function createElement(tag_name) {

	if (this.renderer) {
		return this.renderer.createElement(tag_name);
	}

	return Blast.Classes.Hawkejs.Hawkejs.createElement(tag_name);
});

/**
 * Get an element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.8
 */
Microcopy.setMethod(function toElement() {

	let element = this.createElement('micro-copy');
	element.key = this.key;
	element.parameters = this.parameters;

	if (this.fallback) {
		element.fallback = this.fallback;
	}

	return element;
});

/**
 * Get the attribute value
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 */
Microcopy.setMethod(function toAttributeValue() {
	return this.rendered;
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
 * @version  0.7.0
 */
Translate.setMethod(function execute() {

	// Get the arguments
	let params,
	    args,
	    key;
	
	try {
		args = this.getTokenValuesArray(this.options, this.vars)
	} catch (err) {
		let message = this.view.handleError(err);
		alchemy.distinctProblem('microcopy-args-error', message, {error: err});
		return;
	}

	key = args[0];
	params = args[1];

	if (!key) {
		return;
	}

	let value = this.view.t(key, params);

	if (this.view.state == 'PE') {
		return value;
	}

	if (value != null) {
		this.view.print(value);
	}
});