/**
 * The I18n Controller class
 *
 * @constructor
 * @extends       {Alchemy.Controller.App}
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.2.0
 * @version       0.5.0
 */
var I18n = Function.inherits('Alchemy.Controller.App', function I18n(conduit, options) {
	I18n.super.call(this, conduit, options);
});

/**
 * Get the wanted translation
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.2.0
 * @version  0.6.0
 *
 * @param    {Conduit}   conduit
 * @param    {String}    domain
 * @param    {String}    key
 */
I18n.setAction(async function translation(conduit, domain, key) {

	// Get the translation model (probably I18n unless overriden)
	var model = this.getModel(alchemy.plugins.i18n.model);

	let translation = await model.getTranslation(domain, key);

	conduit.end(translation);
});

/**
 * Get the wanted translatable string
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.6.0
 * @version  0.6.0
 *
 * @param    {Conduit}   conduit
 * @param    {String}    domain
 * @param    {String}    key
 */
I18n.setAction(async function string(conduit, domain, key) {

	// Get the translation model (probably I18n unless overriden)
	var model = this.getModel(alchemy.plugins.i18n.model);

	let translation = await model.getTranslatedString(domain, key, conduit.locales);

	conduit.end(translation);
});