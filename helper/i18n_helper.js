module.exports = function alchemyI18NHelpers(hawkejs) {
	
	// References
	var helpers = hawkejs.helpers,
	    elRegex = /<hawkejs data-i18n.*?>(.*?)<\/hawkejs>/;

	/**
	 * Apply the i18n drone after a hawkejs history change
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	hawkejs.event.on('historyChange', function(type, data) {
		hawkejs.serialDrones.i18n.call(data.payload.__variables, function(){}, data.element);
	});

	/**
	 * The i18n drone makes sure every data-i18n element gets translated
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	hawkejs.serialDrones.i18n = function(done, $result) {

		var $elements,
		    prefix,
		    $subElements,
		    childNodes,
		    scriptType,
		    context,
		    capture,
		    domains,
		    domain,
		    html,
		    text,
		    node,
		    attr,
		    key,
		    $el,
		    el,
		    i,
		    j,
		    k;

		// If the appropriate variables aren't found in the context, create it
		if (hawkejs.ClientSide && !this.__prefix && hawkejs.storage.i18nsettings) {
			context = {
				__prefix: hawkejs.storage.i18nsettings.prefix,
				__fallback: hawkejs.storage.i18nsettings.fallback,
				__locale: hawkejs.storage.i18nsettings.locale
			};

			return hawkejs.serialDrones.i18n.call(context, done, $result);
		}

		prefix = this.__prefix

		$elements = hawkejs.utils.select($result, '[data-i18n]');

		if (!hawkejs.ClientSide) {
			domains = Model.get('StaticString').domains;
		} else {
			domains = hawkejs.storage.i18ndomains;

			// If the given item is a translatable element itself, add it
			if ($($result).is('[data-i18n]')) {
				$elements.push($result);
			}
		}

		if ($elements && $elements.length) {
			for (i = 0; i < $elements.length; i++) {

				// Turn the result into an object
				$el = hawkejs.utils.objectify($elements[i], $result);

				// Get the domain & key
				domain = hawkejs.utils.decode(decodeURIComponent($el.attr('data-domain'))) || 'default';
				key = hawkejs.utils.decode(decodeURIComponent($el.attr('data-key')));

				// Finally apply the translation or original key
				$el.html(helpers.__.call(this, domain, key));
			}
		}

		// Now go over *every* element and see if any attribute needs translating
		// It's a bit crazy and wasteful, but there's no better way for now
		$elements = hawkejs.utils.select($result, '*');

		for (i = 0; i < $elements.length; i++) {

			scriptType = false;
			el = $elements[i];

			if (hawkejs.ClientSide) {

				// Go over all the attributes
				for (j = 0; j < el.attributes.length; j++) {

					attr = el.attributes[j];
					key = attr.name;

					if (attr.value.indexOf('hawkejs data-i18n') > -1) {

						try {
							text = hawkejs.utils.decode(decodeURIComponent(attr.value));
						} catch (err) {
							text = '';
						}

						$el = $('<div>' + text + '</div>');

						hawkejs.serialDrones.i18n.call(this, function(){}, $el);

						attr.value = $el.children().first().html();
					}
				}

				// Don't to anything to SCRIPT tags, except when they're html types
				if (el.nodeName == 'SCRIPT') {

					scriptType = el.attributes.getNamedItem('type');

					if (!scriptType) {
						continue;
					}

					scriptType = String(scriptType.value);

					if (scriptType.indexOf('html') < 0) {
						continue;
					}
				}

				// Go over all the text nodes
				for (j = 0; j < el.childNodes.length; j++) {
					node = el.childNodes[j];

					// Only process text nodes
					if (node.nodeType == 3 && node.nodeValue.indexOf('hawkejs data-i18n') > -1) {

						html = node.nodeValue;

						$el = $('<div>' + html + '</div>');

						hawkejs.serialDrones.i18n.call(this, function(){}, $el);

						window.$el = $el;

						childNodes = $el[0].childNodes;
						
						// Insert all the new nodes
						while (childNodes.length) {
							node.parentNode.insertBefore(childNodes[0], node);
						}

						// Remove the original node
						node.parentNode.removeChild(node);
					}
				}

			} else {

				// Go over all the attributes
				for (key in el.attribs) {

					attr = hawkejs.utils.decode(el.attribs[key]);

					if (attr.indexOf('<hawkejs data-i18n') > -1) {

						$el = hawkejs.utils.objectify(attr);
						
						hawkejs.serialDrones.i18n.call(this, function(){}, $el);

						// Get the complete HTML
						html = $el.html();

						// Replace the hawkejs stuff
						capture = elRegex.exec(html);

						if (capture && typeof capture[1] !== 'undefined') {
							capture = capture[1];
						} else {
							capture = '';
						}

						html = html.replace(elRegex, capture);

						el.attribs[key] = hawkejs.utils.encode(html);
					}
				}

				// Ignore script elements that are not text/html types
				if (el.type == 'script' && String(el.attribs.type).indexOf('html') < 0) {
					continue;
				}

				// Go over all the text children
				for (j = 0; j < el.children.length; j++) {
					node = el.children[j];

					if (node.type == 'text' && node.data.indexOf('hawkejs data-i18n') > -1) {
						
						html = hawkejs.utils.decode(node.data);
						$el = hawkejs.utils.objectify(html);

						hawkejs.serialDrones.i18n.call(this, function(){}, $el);

						html = $el.html();

						// Replace the hawkejs stuff
						capture = elRegex.exec(html);

						if (capture && typeof capture[1] !== 'undefined') {
							capture = capture[1];
						} else {
							capture = '';
						}

						html = html.replace(elRegex, capture);

						node.data = html;
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

		var fallback = this.__fallback.slice(0),
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

	/**
	 * Resolve an i18n string right now on the ClientSide, not when the drone fires.
	 * This can be useful when content needs to be placed where no 
	 * html is allowed, like inside options.
	 *
	 * On the server side it just passes the content along, as Cheerio does not
	 * remove invalid HTML
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String}   value    The possible i18n string/object
	 */
	helpers.__r = function __r(value) {

		var html,
		    $el;

		// This is only a problem on the client side
		if (hawkejs.ClientSide) {
			if (typeof value == 'string' && value.substr(1,17) === 'hawkejs data-i18n') {

				$el = $('<div>' + value + '</div>');
				hawkejs.serialDrones.i18n.call(this, function(){}, $el);
				value = $el.children().first().html();
			} else {
				value = hawkejs.utils.encode(value);
			}
		}

		return value;
	};
};