var i18n_cache  = alchemy.shared('I18n.cache'),
    countries   = alchemy.shared('I18n.countries'),
    seen        = alchemy.shared('I18n.seen'),
    code;

Router.get('I18n', '/i18n/{domain}/{key}', 'I18n#translation');

/**
 * Create an i18n string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
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

	translation = new Classes.Alchemy.I18n(domain, key, {parameters: parameters});

	return translation;
};

/**
 * Create an i18n object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.0
 * @version  0.5.0
 *
 * @return   {I18n}
 */
Classes.Alchemy.Base.setMethod(function __(domain, key, parameters) {

	if (this.conduit) {
		return this.conduit.viewRender.__(domain, key, parameters);
	}

	return new Classes.Alchemy.I18n(domain, key, options);
});

/**
 * Create an i18n object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.0
 * @version  0.5.0
 *
 * @return   {I18n}
 */
Classes.Alchemy.Base.setMethod(function __d(domain, key, parameters) {

	if (this.conduit) {
		return this.conduit.viewRender.__d(domain, key, parameters);
	}

	return new Classes.Alchemy.I18n(domain, key, options);
});

// Expose the translations to the client
alchemy.hawkejs.on({type: 'viewrender', status: 'begin', client: false}, function onBegin(viewRender) {

	var options,
	    next;

	options = {
		fields: ['domain', 'key', 'singular_translation', 'plural_translation']
	};

	next = this.wait('parallel');

	viewRender.getModel('I18n').find('all', options, function getAllTranslations(err, items) {

		if (err) {
			console.log('I18N Error:', err);
			return next(err);
		}

		let domains = {},
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