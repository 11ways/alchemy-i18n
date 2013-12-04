module.exports = function alchemyFormHelpers (hawkejs) {
	
	// References
	var helpers = hawkejs.helpers;
	
	helpers.__ = function __(domain, key, params) {

		var domains, entry;

		if (!hawkejs.ClientSide) {
			domains = Model.get('StaticString').domains;
		} else {
			domains = hawkejs.storage.i18ndomains;
		}

		domains = domains[domain];
		entry = key;

		if (domains && domains[key] && typeof domains[key]['nl'] !== 'undefined') {
			entry = domains[key]['nl'];
		}

		this.scope.buf.push(entry);
		return;
	};

};