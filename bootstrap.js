const i18n_cache  = alchemy.shared('I18n.cache'),
      countries   = alchemy.shared('I18n.countries'),
      seen        = alchemy.shared('I18n.seen');

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
 * @version  0.6.3
 *
 * @return   {I18n}
 */
Classes.Alchemy.Base.setMethod(function __(domain, key, parameters) {

	if (this.conduit) {
		return this.conduit.renderer.__(domain, key, parameters);
	}

	return new Classes.Alchemy.I18n(domain, key, parameters);
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

/**
 * Get the remote translation cache
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @return   {Cache}
 */
Plugin.getRemoteCache = function getRemoteCache() {
	return alchemy.getCache('remote_i18n_microcopy', {
		max_age : '2 hours'
	});
};