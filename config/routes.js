
Plugin.addRoute({
	name             : 'I18n#string',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/i18n/{domain}/{key}/string',
});

Plugin.addRoute({
	name             : 'I18n#translation',
	methods          : ['get'],
	can_be_postponed : false,
	paths            : '/i18n/{domain}/{key}',
});

/**
 * Find microcopy records for the client side
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 */
Router.get('Microcopy#findRecords', '/api/microcopy/{key}', async function findRecords(conduit, key) {

	const wanted_key = alchemy.settings.plugins.i18n.wanted_key;

	if (wanted_key && !conduit.headers.referer && conduit.headers['access-key'] != wanted_key) {
		return conduit.end();
	}

	let Microcopy = conduit.getModel('Microcopy');

	let parameters = conduit.param('parameters');
	let locales = conduit.param('locales');

	let records = await Microcopy.findRecords(key, parameters, locales);

	conduit.end(records);
});