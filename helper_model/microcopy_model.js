const Microcopy = Classes.Hawkejs.Model.getClass('Microcopy');
let copy_cache;

if (Blast.isNode && alchemy.plugins.i18n.translation_server) {
	copy_cache = alchemy.getCache('remote_i18n_microcopy', {
		max_age : '2 hours'
	});
}

/**
 * Find records for the given parameters
 * (But matching happens later)
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.6.1
 * @version  0.6.1
 *
 * @param    {String}         key
 * @param    {Object|Array}   parameters
 *
 * @return   {Promise<Array>}
 */
Microcopy.setMethod(async function findRecords(key, parameters, locales) {

	if (!Array.isArray(parameters)) {
		if (!parameters) {
			parameters = [];
		} else {
			parameters = Object.keys(parameters);
		}
	}

	// @TODO: offline support
	if (Blast.isBrowser) {

		let records = await alchemy.fetch('Microcopy#findRecords', {
			parameters: {
				key         : key,
				parameters  : parameters,
				locales     : locales,
			}
		});

		return records;
	}

	let count = parameters.length;

	let crit = this.find();
	crit.where('key', key);

	if (locales && locales.length) {
		crit.where('language').in(locales);
	}

	let or = crit.or();

	if (!count) {

		or.where('filters.optional', true);
		or.where('filters').isEmpty();
		let and = or.and();

		and.where('filters.name').isEmpty();
		and.where('filters.optional').isEmpty();
		and.where('filters.value').isEmpty();
	} else {

		let i;

		for (i = 0; i < parameters.length; i++) {
			or.where('filters.name', parameters[i]);
		}
	}

	let records = await this.find('all', crit);
	records = Array.cast(records);

	if (!records.length && alchemy.plugins.i18n.translation_server && alchemy.plugins.i18n.access_key) {

		let cache_id = Object.checksum([key, parameters, locales]);

		let cached = copy_cache.get(cache_id);

		if (cached == null) {

			let url = alchemy.plugins.i18n.translation_server.assign({key: key});
			url = RURL.parse(url);

			if (parameters) {
				url.param('parameters', parameters);
			}

			if (locales) {
				url.param('locales', locales);
			}

			let fetch_options = {
				url     : url,
				headers : {
					'access-key': alchemy.plugins.i18n.access_key,
				}
			};

			let remote_records = await Blast.fetch(fetch_options);

			if (remote_records && remote_records.length) {
				cached = JSON.undry(remote_records);
			}

			copy_cache.set(cache_id, cached || false);
		}

		if (cached && cached.length) {
			records.include(cached);
		}
	}

	return records;
});

/**
 * Find a translation
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.6.1
 * @version  0.6.1
 *
 * @param    {String}   key
 * @param    {Object}   parameters
 *
 * @return   {Promise<Alchemy.Document.Microcopy>}
 */
Microcopy.setMethod(async function findTranslation(key, parameters, locales) {

	if (!key) {
		throw new Error('A valid key is required to look for translations');
	}

	let parameter_count = 0,
	    keys;

	if (parameters) {
		parameter_count = Object.size(parameters);
		keys = Object.keys(parameters);
		keys.sort();
	}

	// @TODO: better fallback?
	if (!locales || !locales.length) {
		locales = Object.keys(Prefix.all());
	}

	let records = await this.findRecords(key, keys, locales);

	if (records.length == 0 && parameter_count) {
		return this.findTranslation(key, null, locales);
	}

	let locale,
	    record,
	    scores = [],
	    score,
	    i,
	    j;

	for (i = 0; i < records.length; i++) {
		record = records[i];

		score = record.scoreParameters(parameters);

		if (score) {

			for (j = 0; j < locales.length; j++) {
				locale = locales[j];

				if (record.language == locale) {
					score += ~~(1000 / (j + 1));
				}
			}
		}

		scores.push(score);
	}

	let max_score = scores.max(),
	    index = scores.indexOf(max_score);

	let result = records[index];

	return result;
});

/**
 * Test the filter on the given parameters
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.6.1
 * @version  0.6.1
 *
 * @param    {Object}   parameters
 *
 * @return   {Number}
 */
Microcopy.setDocumentMethod(function scoreParameters(parameters) {

	if (!this.filters || !this.filters.length) {
		return 1;
	}

	if (!parameters) {
		parameters = {};
	}

	let valid_filters = 0,
	    filter,
	    score = 0,
	    value,
	    i;

	for (i = 0; i < this.filters.length; i++) {
		filter = this.filters[i];

		if (filter.name) {
			valid_filters++;
		} else {
			continue;
		}

		value = parameters[filter.name];

		// Return early if the filter is not optional
		// and it is not in the parameters
		if (!filter.optional && value == null) {
			return 0;
		}

		if (!filter.value) {
			if (filter.optional) {
				score += 2;
			} else {
				score += 1;
			}
		} else if (filter.value == '*') {
			score += 5;
		} else if (filter.value == value) {
			score += 10;
		}
	}

	if (!valid_filters) {
		return 1;
	}

	return score;
});