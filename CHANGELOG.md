## 0.7.0-alpha.2 (2024-02-25)

* Allow a `Microcopy` instance to be added to `Hawkejs` templates multiple times

## 0.7.0-alpha.1 (2024-02-15)

* Upgrade to Alchemy v1.4.0
* Add support for `titleize` style parameter
* The `fallback` property will not default to the `key` property anymore
* Translation records with a negative weight will not be used when a fallback is given
* When the parameters contain a `fallback` property, it will be used as the fallback value and not as a filter
* If there are no translation records with a positive filter score, they will not be used
* Ignore parameters that have a `null` or `undefined` value

## 0.6.8 (2024-01-22)

* Improve the microcopy fallback support

## 0.6.7 (2023-06-17)

* Fix microcopy instance not having a renderer context

## 0.6.6 (2023-01-30)

* Don't throw an error when a microcopy fails to parse its arguments

## 0.6.5 (2023-01-23)

* Fix incompatibility with protoblast v0.8.0
* Make translation api routes un-postponable

## 0.6.4 (2022-12-23)

* Check if a translation contains code & html before save
* Use subrenderers for nested translations so the locales don't get lost
* Do not render translations when we're sure they don't contain code or html
* Throw an error when a requested translation resource is not in the json format

## 0.6.3 (2022-06-29)

* Make sure weights are applied after fetching microcopy records
* Do not create a microcopy with an empty key

## 0.6.2 (2021-09-12)

* Fix infinite-loop issue with some microcopy translations

## 0.6.1 (2020-12-10)

* Add microcopy helpers & logic
* Add hawkejs translate expression
* Add support for remote translation servers
* Add micro-copy element

## 0.6.0 (2020-07-21)

* Make compatible with Alchemy v1.1.0
* Fixes for converting I18n class to hawkejs v2 html elements
* Fix I18n instance being rendered to hawkejs with no locale
* Add support for custom Translation models
* Always assign params, even when using default key
* Make the x-i18n element a real custom element
* Use key if fallback method still can't find translation
* Add prefixes to translation objects
* Don't assign parameters to a non-string
* Don't throw an error when failing to get a translation
* Fix not always getting the translations on the browser side
* Fix the i18n helper throwing an error when the key is not a string
* Make sure the source is a string
* Add new Microcopy model (needs implementation)

## 0.5.1 (2018-08-27)

* Add `fallback` support
* Make `key` the default displayField

## 0.5.0 (2018-07-04)

* Add `__` and `__d` method to the `Alchemy.Base` class
* Make compatible with chimera v0.5.0 & alchemy v1.0.0

## 0.4.0 (2017-08-27)

* Add `__d`: it's `toString` method returns a regular translated string, not HTML
* Add `I18n#concat(str)` method
* Add `I18n#getDirect()`, which returns a `__d`-ified object

## 0.3.0 (2016-10-04)

* Adapt plugin to alchemymvc 0.3.0
* Some plural changes