module.exports = function alchemyI18NHelpers(hawkejs) {
	
	// References
	var helpers = hawkejs.helpers;
	
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