const i18n_cache  = alchemy.shared('I18n.cache'),
      countries   = alchemy.shared('I18n.countries'),
      seen        = alchemy.shared('I18n.seen'),
      config      = alchemy.plugins.i18n;

var code;

Router.get('I18n#string', '/i18n/{domain}/{key}/string', 'I18n#string');
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
 * @version  0.6.0
 *
 * @return   {I18n}
 */
Classes.Alchemy.Base.setMethod(function __(domain, key, parameters) {

	if (this.conduit) {
		return this.conduit.renderer.__(domain, key, parameters);
	}

	return new Classes.Alchemy.I18n(domain, key, options);
});

/**
 * Create an i18n object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.5.0
 * @version  0.6.0
 *
 * @return   {I18n}
 */
Classes.Alchemy.Base.setMethod(function __d(domain, key, parameters) {

	if (this.conduit) {
		return this.conduit.renderer.__d(domain, key, parameters);
	}

	return new Classes.Alchemy.I18n(domain, key, options);
});

if (config.custom_model) {
	config.model = config.custom_model;
} else {
	config.model = 'I18n';
}

// Expose the model to use as a static to the client
alchemy.exposeStatic('i18n_model', config.model);

// Return early when we don't want to expose all translations
if (config.expose_all_translations === false) {
	alchemy.exposeStatic('i18n_expose_all', false);
	return;
}

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