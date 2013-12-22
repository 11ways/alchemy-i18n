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
					{field: 'domain', type: 'String'},
					{field: 'key', type: 'String'},
				]
			}
		};
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

			var i, record, domain;

			for (i = 0; i < items.length; i++) {

				record = items[i]['StaticString'];

				// Make sure the domain entry exists
				if (!that.domains[record.domain]) {
					that.domains[record.domain] = {};
				}

				// Make a reference to the domain
				domain = that.domains[record.domain];

				domain[record.key] = record.translation;
			}

			if (callback) callback();
		});
	};
	
});
