# Alchemy i18n

The i18n plugin for the Alchemy MVC

## Installation

Just installing the npm package can be done like this:

    $ npm install alchemy-i18n

## Activate

You can activate the plugin by adding this to the main `bootstrap.js` file:

```javascript
alchemy.usePlugin('i18n');
```

## Use

This plugin will add a global `__` function you can use to create translatable string objects.

Here's an example on how to use them in your Hawkejs templates:

```ejs
<div class="user-menu">
    <%= __('user.greeting') %>
    <span class="username">
        <%= username %>
    </span>
    <ul class="actions">
        <li><%= __('user.profile') %></li>
        <li><%= __('user.logout') %></li>
    </ul>
</div>
```

This would result in the following HTML, when the user requests the page with an English locale:

```ejs
<div class="user-menu">
    Hello,
    <span class="username">
        skerit
    </span>
    <ul class="actions">
        <li>My profile</li>
        <li>Logout</li>
    </ul>
</div>
```