const Microcopy = Classes.Hawkejs.Model.getClass('Microcopy');

/**
 * Find records for the given parameters
 * (But matching happens later)
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.6.1
 * @version  0.7.0
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

		if (records) {
			records.sortByPath(-1, 'weight');
		}

		return records;
	}

	let parameter_count = parameters.length;

	let crit = this.find();
	crit.where('key', key);

	if (locales && locales.length) {
		crit.where('language').in(locales);
	}

	let or = crit.or();

	if (!parameter_count) {

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

	if (!records.length && alchemy.settings.plugins.i18n.remote.translation_server && alchemy.settings.plugins.i18n.remote.access_key) {

		const copy_cache = alchemy.plugins.i18n.getRemoteCache();

		let cache_id = Object.checksum([key, parameters, locales]);

		let cached = copy_cache.get(cache_id);

		if (cached == null) {

			let url = alchemy.settings.plugins.i18n.remote.translation_server.assign({key: key});
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
					'access-key': alchemy.settings.plugins.i18n.remote.access_key,
				}
			};

			let response = new Pledge();

			Blast.fetch(fetch_options, (err, res) => {
				if (err) {
					response.reject(err);
				} else {
					response.resolve(res);
				}
			});

			response = await response;

			if (!response || (response.headers['content-type'] && response.headers['content-type'].indexOf('json') == -1)) {
				throw new Error('The Microcopy response was not a JSON string');
			}

			let remote_records = response.body;

			if (remote_records && remote_records.length) {
				cached = JSON.undry(remote_records);
			}

			copy_cache.set(cache_id, cached || false);
		}

		if (cached && cached.length) {
			records.include(cached);
		}
	}

	if (records) {
		records.sortByPath(-1, 'weight');
	}

	return records;
});

/**
 * Find a translation
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.6.1
 * @version  0.7.0
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

	// If nothing could be found *with* parameters, find all of them
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

	let max_score = scores.max();

	// If none of the records had a positive score, try again without parameters
	if (max_score == 0) {
		return this.findTranslation(key, null, locales);
	}

	let index = scores.indexOf(max_score);

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

/**
 * Does this record contain the given filter?
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.7.0
 * @version  0.7.0
 *
 * @param    {string}   filter_name
 *
 * @return   {boolean}
 */
Microcopy.setDocumentMethod(function hasFilter(filter_name) {

	if (!this.filters || !this.filters.length) {
		return false;
	}

	let filter,
	    i;

	for (i = 0; i < this.filters.length; i++) {
		filter = this.filters[i];

		if (filter.name == filter_name) {
			return true;
		}
	}

	return false;
});