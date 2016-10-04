/**
 * The I18n Controller class
 *
 * @constructor
 * @extends       {Alchemy.Controller}
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.2.0
 * @version       0.2.0
 */
var I18n = Function.inherits('Alchemy.Controller', function I18nController(conduit, options) {
	I18nController.super.call(this, conduit, options);
});

/**
 * Get the wanted translation
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Conduit}   conduit
 * @param    {String}    domain
 * @param    {String}    key
 */
I18n.setMethod(function translation(conduit, domain, key) {

	var I18n = this.getModel('I18n');

	I18n.getTranslation(domain, key, function gotTranslation(err, item) {
		conduit.end(item);
	});
});