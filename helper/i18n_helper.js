module.exports = function alchemyI18NHelpers(hawkejs) {
	
	// References
	var helpers = hawkejs.helpers;

	/**
	 * The i18n drone makes sure every data-i18n element gets translated
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	hawkejs.serialDrones.i18n = function(done, $result) {

		var $elements = hawkejs.µ.select($result, '[data-i18n]'),
		    prefix    = this.__prefix,
		    domains,
		    domain,
		    key,
		    $el,
		    i;

		if (!hawkejs.ClientSide) {
			domains = Model.get('StaticString').domains;
		} else {
			domains = hawkejs.storage.i18ndomains;
		}

		if ($elements && $elements.length) {
			for (i = 0; i < $elements.length; i++) {

				// Turn the result into an object
				$el = hawkejs.µ.objectify($elements[i], $result);

				// Get the domain & key
				domain = decodeURIComponent($el.attr('data-domain')) || 'default';
				key = decodeURIComponent($el.attr('data-key'));

				// Finally apply the translation or original key
				$el.html(helpers.__.call(this, domain, key));
			}
		}

		done();
	};
	
	/**
	 * Retrieve the translation of a static string and return it
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String}   domain    The optional domain. Defaults to "default"
	 * @param    {String}   key       The key
	 * @param    {Object}   params    Optional sprintf parameters
	 */
	helpers.__ = function __(domain, key, params) {

		var fallback = this.__fallback.splice(0),
		    prefix   = this.__prefix,
		    domains,
		    entry,
		    i;

		// Push the main prefix to the top of the fallback array
		fallback.unshift(prefix);

		if (typeof params === 'undefined' && typeof key === 'object') {
			params = key;
			key = undefined;
		}

		if (typeof key === 'undefined') {
			key = domain;
			domain = 'default';
		}

		if (!hawkejs.ClientSide) {
			domains = Model.get('StaticString').domains;
		} else {
			domains = hawkejs.storage.i18ndomains;
		}

		domains = domains[domain];
		entry = key;

		if (domains && domains[key]) {

			for (i = 0; i < fallback.length; i++) {
				if (domains[key][fallback[i]]) {
					entry = domains[key][fallback[i]];
					break;
				}
			}
		}

		return entry;
	};

};