/**
 * The micro-copy element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 */
const MCEl = Function.inherits('Alchemy.Element', function MicroCopy() {
	MicroCopy.super.call(this);
});

/**
 * The key of the microcopy
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 */
MCEl.setAttribute('key');

/**
 * Optional parameters
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 */
MCEl.setAssignedProperty('parameters');

/**
 * The element is being retained
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 */
MCEl.setMethod(function retained() {
	this.ensureContent();
});

/**
 * Added to the dom for the first time
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.1
 */
MCEl.setMethod(function introduced() {
	this.ensureContent();
});

/**
 * Make sure the content is loaded
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.6.1
 * @version  0.6.7
 */
MCEl.setMethod(function ensureContent() {

	if (this.childNodes.length || !this.key) {
		return;
	}

	this.delayAssemble(async () => {
		let instance = new Classes.Alchemy.Microcopy(this.key, this.parameters);
		instance.renderer = this.hawkejs_renderer;

		let el = await instance.renderHawkejsContent();

		this.innerHTML = el.innerHTML;
	});

});