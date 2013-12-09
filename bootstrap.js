
/**
 * The StaticString class
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {String}  domain   The domain the key is in
 * @param    {String}  key      The string key
 * @param    {Array}   params   Parameters for sprintf()
 */
var StaticString = function StaticString(domain, key, params) {

	if (typeof params === 'undefined' && typeof key === 'object') {
		params = key;
		key = undefined;
	}

	if (typeof key === 'undefined') {
		key = domain;
		domain = 'default';
	}

	this.domain = domain;
	this.params = params;
	this.key    = key;
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
	html += 'data-params="' + encodeURI(JSON.stringify(this.params)) + '"></hawkejs>';
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

// Get all the translations as soon as the database connection is made,
// do not start the server before these translations are ready
alchemy.sputnik.beforeSerial('startServer', function(callback) {

	var Static  = Model.get('StaticString'),
	    domains = Static.domains;

	Static.update(function() {
		// Allow the server to start and accept connections
		callback();
	});

	// Make sure the i18n drone runs
	alchemy.hawkejs.afterPayload(function(next, payload) {
		payload.request.serialDrones['i18n'] = true;
		next();
	});
});

// Add the middleware to intercept the routes
alchemy.addMiddleware(98, 'i18n', function(req, res, next){
	if (!req.ajax) {
		req.variables.__expose.i18ndomains = Model.get('StaticString').domains;
	}
	next();
});