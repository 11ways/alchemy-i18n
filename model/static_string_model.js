var initialUpdate = false,
    existing      = alchemy.shared('I18n.seen');

/**
 * Internationalization model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Model.extend(function StaticStringModel() {

	/**
	 * Update all the keys
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.preInit = function preInit() {
		this.parent();
		
		this.domains = {};

		this.blueprint = {
			domain: {
				type: 'String',
				index: {
					unique: true,
					name: 'string_id',
				}
			},
			key: {
				type: 'String',
				index: {
					unique: true,
					name: 'string_id',
				}
			},
			translation: {
				type: 'String',
				translatable: true
			}
		};

		this.modelEdit = {
			general: {
				title: __('chimera', 'General'),
				fields: [
					{
						field: 'domain',
						type: 'String',
						title: __('i18n', 'Domain'),
						default: 'default'
					},
					{
						field: 'key',
						type: 'String',
						title: __('i18n', 'Key')
					},
				]
			},
			translations: {
				fields: [
					{
						field: 'translation',
						type: 'String',
						title: __('i18n', 'Translation')
					}
				]
			}
		};
	};

	this.afterSave = function afterSave() {
		this.parent();

		this.update();
	};

	/**
	 * Register a key: make sure an entry exists in the database
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {String}  domain   The domain the key is in
	 * @param    {String}  key      The string key
	 */
	this.register = function register(domain, key) {

		var that = this;

		// Get all of the domains and their keys
		this.getAll(function(domains) {

			// If the domain or the key isn't found, add it to the database
			if (!domains[domain] || !(key in domains[domain])) {
				that.save({
					StaticString: {
						domain: domain,
						key: key
					}
				});
			}
		});
	};

	/**
	 * Get all the domains and their keys
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Function}   callback   The callback which received the domains
	 */
	this.getAll = function getAll(callback) {
		if (!initialUpdate || !this.domains) {
			this.update(function(domains) {
				callback(domains);
			});
		} else {
			callback(this.domains);
		}
	};

	/**
	 * Update all the keys
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.update = function update(callback) {

		var that = this,
		    staticString = Model.get('StaticString');

		// Find all the translations with a regular, non-augmented model
		staticString.find('all', function(err, items) {

			var i, record, domain, entry, translations, defs;

			for (i = 0; i < items.length; i++) {

				record = items[i]['StaticString'];

				// Make sure the domain entry exists
				if (!that.domains[record.domain]) {
					that.domains[record.domain] = {};
				}

				// Make a reference to the domain
				domain = that.domains[record.domain];

				if (defs = Object.path(existing, record.domain + '.' + record.key + '.defaults')) {
					translations = {};
					alchemy.inject(translations, defs, record.translation);
				} else {
					translations = record.translation;
				}

				domain[record.key] = translations;
			}

			// Indicate we've updated at least once
			initialUpdate = true;

			if (callback) callback(that.domains);
		});
	};
	
});
