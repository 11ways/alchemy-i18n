const I18N_PLUGIN_GROUP = Plugin.getSettingsGroup();

I18N_PLUGIN_GROUP.addSetting('model', {
	type        : 'string',
	default     : 'I18n',
	description : 'The model to use for the i18n translations',
	action      : (value, value_instance) => {
		alchemy.exposeStatic('i18n_model', value);
	},
});

I18N_PLUGIN_GROUP.addSetting('wanted_key', {
	type        : 'string',
	default     : null,
	description : 'The wanted key requests should provide when used as translation service',
});

const REMOTE = I18N_PLUGIN_GROUP.createGroup('remote');

REMOTE.addSetting('translation_server', {
	type        : 'string',
	default     : null,
	description : 'The address of the translation server',
	action      : () => {
		Plugin.getRemoteCache().clear();
	},
});

REMOTE.addSetting('access_key', {
	type        : 'string',
	default     : null,
	description : 'The key to use when accessing the translation server',
	action      : () => {
		Plugin.getRemoteCache().clear();
	},
});