var countryData = alchemy.use('country-data'),
    countries   = alchemy.shared('I18n.countries'),
    seen        = alchemy.shared('I18n.seen'),
    code;

Router.get('I18n', '/i18n/:domain/:key', 'I18n#translation');

/**
 * Create an i18n string
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    1.0.0
 * @version  1.0.0
 *
 * @return   {I18n}
 */
global.__ = function __(domain, key, parameters) {

	var translation;

	if (Object.isObject(key)) {
		parameters = key;
		key = domain;
		domain = 'default';
	} else if (key == null) {
		key = domain;
		domain = 'default';
	}

	translation = new alchemy.classes.I18n(domain, key, {parameters: parameters});

	return translation;
};

// Expose the translations to the client
alchemy.hawkejs.on({type: 'viewrender', status: 'begin', client: false}, function onBegin(viewRender) {

	var options,
	    next;

	options = {
		fields: ['domain', 'key', 'singular_translation', 'plural_translation']
	};

	next = this.wait('parallel');

	Model.get('I18n').find('all', options, function getAllTranslations(err, items) {

		var domains = {},
		    item,
		    i;

		for (i = 0; i < items.length; i++) {
			item = items[i].I18n;

			if (domains[item.domain] == null) {
				domains[item.domain] = {};
			}

			domains[item.domain][item.key] = {
				singular: item.singular_translation,
				plural: item.plural_translation
			}
		}

		viewRender.expose('i18n_translations', domains);
		next();
	});
});

return;
/**
 * The StaticString class
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @param    {String}  domain         The domain the key is in
 * @param    {String}  key            The string key
 * @param    {Object}  placeholders   Parameters for sprintf()
 * @param    {Object}  defaults       Default translations
 */
var StaticString = function StaticString(domain, key, placeholders, defaults) {

	// Normalize the input parameters
	if (typeof key !== 'string') {
		defaults = placeholders;
		placeholders = key;
		key = domain;
		domain = 'default';
	}

	this.domain = domain;
	this.key = key;
	this.placeholders = placeholders;
	this.defaults = defaults;

	// Register the keys
	if (!seen[domain]) {
		seen[domain] = {};
	}

	if (!seen[domain][key]) {

		// This won't happen right now, so already set it to true
		seen[domain][key] = this;

		alchemy.ready(function() {
			alchemy.lowPriority(function(ms) {
				Model.get('StaticString').register(domain, key);
			}, 500);
		});
	}

	if (defaults && !seen[domain][key].defaults) {
		seen[domain][key].defaults = defaults;
	}
};

/**
 * Give this item a replace method
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 */
StaticString.prototype.replace = function replace(needle, replacement) {
	return this.key.replace(needle, replacement);
};

/**
 * Return an HTML presentation of this StaticString,
 * which hawkejs helpers can interpret later on.
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @return   {String}
 */
StaticString.prototype.toHTML = function toHTML() {
	var html = '<hawkejs data-i18n data-domain="';
	html += encodeURI(this.domain) + '" data-key="' + encodeURI(this.key) + '" ';
	html += 'data-params="' + (this.placeholders ? encodeURI(JSON.stringify(this.placeholders)) : '') + '"></hawkejs>';
	return html;
};

/**
 * Create the JSON representation of this object instance.
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @return   {String}
 */
StaticString.prototype.toJSON = function toJSON() {
	return this.toHTML();
};

/**
 * Determine what should happen when this object is printed out as a string.
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @return   {String}
 */
StaticString.prototype.toString = function toString() {
	return this.toHTML();
};

/**
 * The translation function.
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {String}  domain   The domain the key is in
 * @param    {String}  key      The string key
 * @param    {Array}   params   Parameters for sprintf()
 *
 * @return   {StaticString}
 */
global.__ = function __(domain, key, params) {
	return new StaticString(domain, key, params);
};

/**
 * The translation function that accepts default translations
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {String}  domain   The domain the key is in
 * @param    {String}  key      The string key
 * @param    {Object}  defaults Default translations
 *
 * @return   {StaticString}
 */
global.__def = function __(domain, key, defaults) {
	return new StaticString(domain, key, null, defaults);
};

// Get all the translations as soon as the database connection is made,
// do not start the server before these translations are ready
alchemy.sputnik.beforeSerial('startServer', function(callback) {

	var Static  = Model.get('StaticString'),
	    domains = Static.domains;

	Static.update(function(domains) {
		// Allow the server to start and accept connections
		callback();
	});
});

// Expose the i18n settings to the client when the scene is being constructed
alchemy.hawkejs.on({type: 'viewrender', status: 'begin', client: false}, function onBegin(viewRender) {

	log.todo('Get conduit in viewRender + set locale stuff')
	var conduit = viewRender.conduit || {};

	// Expose all the translations
	viewRender.expose('i18ndomains', Model.get('StaticString').domains);

	// Expose this user's settings
	viewRender.expose('i18nsettings', {
		locale: conduit.locale,
		prefix: conduit.prefix,
		fallback: conduit.fallback
	});
});

// Create the country list
for (code in countryData.countries) {

	// Only use the alpha3 codes
	if (code.length < 3) {
		continue;
	}

	countries[code] = __('countries', countryData.countries[code].name);
}

/**
 * Attempt to find a country using a fuzzy algorithm
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   name   The full name of the country in English
 *
 * @return   {String}          The 3-letter country code
 */
alchemy.plugins.i18n.findCountry = function findCountry(name) {

	var currentScore = 0,
	    currentCode,
	    country,
	    score,
	    code;

	if (!name) {
		return;
	}

	// Look for "Great Britain"
	if ('Great Britain'.score(name, 0.9) > 0.7) {
		return 'GBR';
	}

	// Remove "The " prefixes
	name = name.replace('The ', '');

	for (code in countryData.countries) {

		// Create an alias to the country
		country = countryData.countries[code];

		if (!country.name || !country.alpha3) {
			continue;
		}

		// Calculate the score
		score = country.name.score(name, 0.5);

		// If the score is 1, it's an exact match
		if (score == 1) {
			return country.alpha3;
		}

		// If the score is higher than the previous score, overwrite the code
		if (score > currentScore) {
			currentScore = score;
			currentCode = country.alpha3;
		}
	}

	return currentCode;
};
