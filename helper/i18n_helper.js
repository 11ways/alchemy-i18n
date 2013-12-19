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
		    $subElements,
		    domains,
		    domain,
		    text,
		    attr,
		    key,
		    $el,
		    el,
		    i,
		    j;

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
				domain = hawkejs.µ.decode(decodeURIComponent($el.attr('data-domain'))) || 'default';
				key = hawkejs.µ.decode(decodeURIComponent($el.attr('data-key')));

				// Finally apply the translation or original key
				$el.html(helpers.__.call(this, domain, key));
			}
		}

		// Now go over *every* element and see if any attribute needs translating
		// It's a bit crazy and wasteful, but there's no better way for now
		$elements = hawkejs.µ.select($result, '*');

		for (i = 0; i < $elements.length; i++) {

			el = $elements[i];

			if (hawkejs.ClientSide) {

				for (j = 0; j < el.attributes.length; j++) {

					attr = el.attributes[j];
					key = attr.name;

					if (attr.value.indexOf('hawkejs data-i18n') > -1) {

						try {
							text = hawkejs.µ.decode(decodeURIComponent(attr.value));
						} catch (err) {
							text = '';
						}

						$el = $('<div>' + text + '</div>');

						hawkejs.serialDrones.i18n.call(this, function(){}, $el);

						attr.value = $el.children().first().html();
					}
				}
			} else {
				for (key in el.attribs) {

					attr = hawkejs.µ.decode(el.attribs[key]);

					if (attr.indexOf('<hawkejs data-i18n') > -1) {

						$el = hawkejs.µ.objectify(attr);
						
						hawkejs.serialDrones.i18n.call(this, function(){}, $el);

						// Get the complete HTML
						text = $el.html();

						// Extract the content
						text = text.split('>').splice(1).join('>').split('<');
						text.pop();
						text = text.join('<');

						el.attribs[key] = hawkejs.µ.encode(text);
					}
				}
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