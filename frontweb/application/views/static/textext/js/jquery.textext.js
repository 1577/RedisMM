/**
 * jQuery TextExt Plugin
 * http://alexgorbatchev.com/textext
 *
 * @version 1.2.0
 * @copyright Copyright (C) 2011 Alex Gorbatchev. All rights reserved.
 * @license MIT License
 */
(function($, undefined)
{
	/**
	 * TextExt is the main core class which by itself doesn't provide any functionality
	 * that is user facing, however it has the underlying mechanics to bring all the
	 * plugins together under one roof and make them work with each other or on their
	 * own.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt
	 */
	function TextExt() {};

	/**
	 * ItemManager is used to seamlessly convert between string that come from the user input to whatever 
	 * the format the item data is being passed around in. It's used by all plugins that in one way or 
	 * another operate with items, such as Tags, Filter, Autocomplete and Suggestions. Default implementation 
	 * works with `String` type. 
	 *
	 * Each instance of `TextExt` creates a new instance of default implementation of `ItemManager`
	 * unless `itemManager` option was set to another implementation.
	 *
	 * To satisfy requirements of managing items of type other than a `String`, different implementation
	 * if `ItemManager` should be supplied.
	 *
	 * If you wish to bring your own implementation, you need to create a new class and implement all the 
	 * methods that `ItemManager` has. After, you need to supply your pass via the `itemManager` option during
	 * initialization like so:
	 *
	 *     $('#input').textext({
	 *         itemManager : CustomItemManager
	 *     })
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id ItemManager
	 */
	function ItemManager() {};

	/**
	 * TextExtPlugin is a base class for all plugins. It provides common methods which are reused
	 * by majority of plugins.
	 *
	 * All plugins must register themselves by calling the `$.fn.textext.addPlugin(name, constructor)`
	 * function while providing plugin name and constructor. The plugin name is the same name that user
	 * will identify the plugin in the `plugins` option when initializing TextExt component and constructor
	 * function will create a new instance of the plugin. *Without registering, the core won't
	 * be able to see the plugin.*
	 *
	 * <span class="new label version">new in 1.2.0</span> You can get instance of each plugin from the core 
	 * via associated function with the same name as the plugin. For example:
	 *
	 *     $('#input').textext()[0].tags()
	 *     $('#input').textext()[0].autocomplete()
	 *     ...
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin
	 */
	function TextExtPlugin() {};

	var stringify = (JSON || {}).stringify,
		slice     = Array.prototype.slice,

		UNDEFINED = 'undefined',

		/**
		 * TextExt provides a way to pass in the options to configure the core as well as
		 * each plugin that is being currently used. The jQuery exposed plugin `$().textext()` 
		 * function takes a hash object with key/value set of options. For example:
		 *
		 *     $('textarea').textext({
		 *         enabled: true
		 *     })
		 *
		 * There are multiple ways of passing in the options:
		 *
		 * 1. Options could be nested multiple levels deep and accessed using all lowercased, dot
		 * separated style, eg `foo.bar.world`. The manual is using this style for clarity and
		 * consistency. For example:
		 *
		 *        {
		 *            item: {
		 *                manager: ...
		 *            },
		 *
		 *            html: {
		 *                wrap: ...
		 *            },
		 *
		 *            autocomplete: {
		 *                enabled: ...,
		 *                dropdown: {
		 *                   position: ...
		 *                }
		 *            }
		 *        }
		 *
		 * 2. Options could be specified using camel cased names in a flat key/value fashion like so:
		 *
		 *        {
		 *            itemManager: ...,
		 *            htmlWrap: ...,
		 *            autocompleteEnabled: ...,
		 *            autocompleteDropdownPosition: ...
		 *        }
		 *
		 * 3. Finally, options could be specified in mixed style. It's important to understand that
		 * for each dot separated name, its alternative in camel case is also checked for, eg for 
		 * `foo.bar.world` it's alternatives could be `fooBarWorld`, `foo.barWorld` or `fooBar.world`, 
		 * which translates to `{ foo: { bar: { world: ... } } }`, `{ fooBarWorld: ... }`, 
		 * `{ foo : { barWorld : ... } }` or `{ fooBar: { world: ... } }` respectively. For example:
		 *
		 *        {
		 *            itemManager : ...,
		 *            htmlWrap: ...,
		 *            autocomplete: {
		 *                enabled: ...,
		 *                dropdownPosition: ...
		 *            }
		 *        }
		 *
		 * Mixed case is used through out the code, wherever it seems appropriate. However in the code, all option
		 * names are specified in the dot notation because it works both ways where as camel case is not
		 * being converted to its alternative dot notation.
		 *
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExt.options
		 */

		/**
		 * Default instance of `ItemManager` which takes `String` type as default for tags.
		 *
		 * @name item.manager
		 * @default ItemManager
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.options.item.manager
		 */
		OPT_ITEM_MANAGER = 'item.manager',
		
		/**
		 * List of plugins that should be used with the current instance of TextExt. The list could be
		 * specified as array of strings or as comma or space separated string.
		 *
		 * @name plugins
		 * @default []
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.options.plugins
		 */
		OPT_PLUGINS = 'plugins',
		
		/**
		 * TextExt allows for overriding of virtually any method that the core or any of its plugins
		 * use. This could be accomplished through the use of the `ext` option.
		 *
		 * It's possible to specifically target the core or any plugin, as well as overwrite all the
		 * desired methods everywhere.
		 *
		 * 1. Targeting the core:
		 *
		 *        ext: {
		 *            core: {
		 *                trigger: function()
		 *                {
		 *                    console.log('TextExt.trigger', arguments);
		 *                    $.fn.textext.TextExt.prototype.trigger.apply(this, arguments);
		 *                }
		 *            }
		 *        }
		 *
		 * 2. Targeting individual plugins:
		 *
		 *        ext: {
		 *            tags: {
		 *                addTags: function(tags)
		 *                {
		 *                    console.log('TextExtTags.addTags', tags);
		 *                    $.fn.textext.TextExtTags.prototype.addTags.apply(this, arguments);
		 *                }
		 *            }
		 *        }
		 *
		 * 3. Targeting `ItemManager` instance:
		 *
		 *        ext: {
		 *            itemManager: {
		 *                stringToItem: function(str)
		 *                {
		 *                    console.log('ItemManager.stringToItem', str);
		 *                    return $.fn.textext.ItemManager.prototype.stringToItem.apply(this, arguments);
		 *                }
		 *            }
		 *        }
		 *
		 * 4. And finally, in edge cases you can extend everything at once:
		 *
		 *        ext: {
		 *            '*': {
		 *                fooBar: function() {}
		 *            }
		 *        }
		 *
		 * @name ext
		 * @default {}
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.options.ext
		 */
		OPT_EXT = 'ext',
		
		/**
		 * HTML source that is used to generate elements necessary for the core and all other
		 * plugins to function.
		 *
		 * @name html.wrap
		 * @default '<div class="text-core"><div class="text-wrap"/></div>'
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.options.html.wrap
		 */
		OPT_HTML_WRAP = 'html.wrap',

		/**
		 * HTML source that is used to generate hidden input value of which will be submitted 
		 * with the HTML form.
		 *
		 * @name html.hidden
		 * @default '<input type="hidden" />'
		 * @author agorbatchev
		 * @date 2011/08/20
		 * @id TextExt.options.html.hidden
		 */
		OPT_HTML_HIDDEN = 'html.hidden',
		
		/**
		 * Hash table of key codes and key names for which special events will be created
		 * by the core. For each entry a `[name]KeyDown`, `[name]KeyUp` and `[name]KeyPress` events 
		 * will be triggered along side with `anyKeyUp` and `anyKeyDown` events for every 
		 * key stroke.
		 *
		 * Here's a list of default keys:
		 *
		 *     {
		 *         8   : 'backspace',
		 *         9   : 'tab',
		 *         13  : 'enter!',
		 *         27  : 'escape!',
		 *         37  : 'left',
		 *         38  : 'up!',
		 *         39  : 'right',
		 *         40  : 'down!',
		 *         46  : 'delete',
		 *         108 : 'numpadEnter'
		 *     }
		 *
		 * Please note the `!` at the end of some keys. This tells the core that by default
		 * this keypress will be trapped and not passed on to the text input.
		 *
		 * @name keys
		 * @default { ... }
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.options.keys
		 */
		OPT_KEYS = 'keys',

		/**
		 * The core triggers or reacts to the following events.
		 *
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExt.events
		 */

		/**
		 * Core triggers `preInvalidate` event before the dimensions of padding on the text input
		 * are set.
		 *
		 * @name preInvalidate
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.preInvalidate
		 */
		EVENT_PRE_INVALIDATE = 'preInvalidate',

		/**
		 * Core triggers `postInvalidate` event after the dimensions of padding on the text input
		 * are set.
		 *
		 * @name postInvalidate
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.postInvalidate
		 */
		EVENT_POST_INVALIDATE = 'postInvalidate',
		
		/**
		 * Core triggers `getFormData` on every key press to collect data that will be populated
		 * into the hidden input that will be submitted with the HTML form and data that will
		 * be displayed in the input field that user is currently interacting with.
		 *
		 * All plugins that wish to affect how the data is presented or sent must react to 
		 * `getFormData` and populate the data in the following format:
		 *
		 *     {
		 *         input : {String},
		 *         form  : {Object}
		 *     }
		 *
		 * The data key must be a numeric weight which will be used to determine which data
		 * ends up being used. Data with the highest numerical weight gets the priority. This
		 * allows plugins to set the final data regardless of their initialization order, which
		 * otherwise would be impossible.
		 *
		 * For example, the Tags and Autocomplete plugins have to work side by side and Tags
		 * plugin must get priority on setting the data. Therefore the Tags plugin sets data
		 * with the weight 200 where as the Autocomplete plugin sets data with the weight 100.
		 *
		 * Here's an example of a typical `getFormData` handler:
		 * 
		 *     TextExtPlugin.prototype.onGetFormData = function(e, data, keyCode)
		 *     {
		 *         data[100] = self.formDataObject('input value', 'form value');
		 *     };
		 *
		 * Core also reacts to the `getFormData` and updates hidden input with data which will be
		 * submitted with the HTML form.
		 *
		 * @name getFormData
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.getFormData
		 */
		EVENT_GET_FORM_DATA = 'getFormData',

		/**
		 * Core triggers and reacts to the `setFormData` event to update the actual value in the
		 * hidden input that will be submitted with the HTML form. Second argument can be value
		 * of any type and by default it will be JSON serialized with `TextExt.serializeData()`
		 * function.
		 *
		 * @name setFormData
		 * @author agorbatchev
		 * @date 2011/08/22
		 * @id TextExt.events.setFormData
		 */
		EVENT_SET_FORM_DATA = 'setFormData',

		/**
		 * Core triggers and reacts to the `setInputData` event to update the actual value in the
		 * text input that user is interacting with. Second argument must be of a `String` type
		 * the value of which will be set into the text input.
		 *
		 * @name setInputData
		 * @author agorbatchev
		 * @date 2011/08/22
		 * @id TextExt.events.setInputData
		 */
		EVENT_SET_INPUT_DATA = 'setInputData',
		
		/**
		 * Core triggers `postInit` event to let plugins run code after all plugins have been 
		 * created and initialized. This is a good place to set some kind of global values before 
		 * somebody gets to use them. This is not the right place to expect all plugins to finish
		 * their initialization.
		 *
		 * @name postInit
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.postInit
		 */
		EVENT_POST_INIT = 'postInit',

		/**
		 * Core triggers `ready` event after all global configuration and prepearation has been
		 * done and the TextExt component is ready for use. Event handlers should expect all 
		 * values to be set and the plugins to be in the final state.
		 *
		 * @name ready
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.ready
		 */
		EVENT_READY = 'ready',

		/**
		 * Core triggers `anyKeyUp` event for every key up event triggered within the component.
		 *
		 * @name anyKeyUp
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.anyKeyUp
		 */

		/**
		 * Core triggers `anyKeyDown` event for every key down event triggered within the component.
		 *
		 * @name anyKeyDown
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.anyKeyDown
		 */

		/**
		 * Core triggers `[name]KeyUp` event for every key specifid in the `keys` option that is 
		 * triggered within the component.
		 *
		 * @name [name]KeyUp
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.[name]KeyUp
		 */

		/**
		 * Core triggers `[name]KeyDown` event for every key specified in the `keys` option that is 
		 * triggered within the component.
		 *
		 * @name [name]KeyDown
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.[name]KeyDown
		 */

		/**
		 * Core triggers `[name]KeyPress` event for every key specified in the `keys` option that is 
		 * triggered within the component.
		 *
		 * @name [name]KeyPress
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.[name]KeyPress
		 */

		DEFAULT_OPTS = {
			itemManager : ItemManager,

			plugins : [],
			ext : {},

			html : {
				wrap   : '<div class="text-core"><div class="text-wrap"/></div>',
				hidden : '<input type="hidden" />'
			},

			keys : {
				8   : 'backspace',
				9   : 'tab',
				13  : 'enter!',
				27  : 'escape!',
				37  : 'left',
				38  : 'up!',
				39  : 'right',
				40  : 'down!',
				46  : 'delete',
				108 : 'numpadEnter'
			}
		}
		;

	// Freak out if there's no JSON.stringify function found
	if(!stringify)
		throw new Error('JSON.stringify() not found');

	/**
	 * Returns object property by name where name is dot-separated and object is multiple levels deep.
	 * @param target Object Source object.
	 * @param name String Dot separated property name, ie `foo.bar.world`
	 * @id core.getProperty
	 */
	function getProperty(source, name)
	{
		if(typeof(name) === 'string')
			name = name.split('.');

		var fullCamelCaseName = name.join('.').replace(/\.(\w)/g, function(match, letter) { return letter.toUpperCase() }),
			nestedName        = name.shift(),
			result
			;

		if(typeof(result = source[fullCamelCaseName]) != UNDEFINED)
			result = result;

		else if(typeof(result = source[nestedName]) != UNDEFINED && name.length > 0)
			result = getProperty(result, name);

		// name.length here should be zero
		return result;
	};

	/**
	 * Hooks up specified events in the scope of the current object.
	 * @author agorbatchev
	 * @date 2011/08/09
	 */
	function hookupEvents()
	{
		var args   = slice.apply(arguments),
			self   = this,
			target = args.length === 1 ? self : args.shift(),
			event
			;

		args = args[0] || {};

		function bind(event, handler)
		{
			target.bind(event, function()
			{
				// apply handler to our PLUGIN object, not the target
				return handler.apply(self, arguments);
			});
		}

		for(event in args)
			bind(event, args[event]);
	};

	function formDataObject(input, form)
	{
		return { 'input' : input, 'form' : form };
	};

	//--------------------------------------------------------------------------------
	// ItemManager core component
	
	p = ItemManager.prototype;

	/**
	 * Initialization method called by the core during instantiation.
	 *
	 * @signature ItemManager.init(core)
	 *
	 * @param core {TextExt} Instance of the TextExt core class.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id ItemManager.init
	 */
	p.init = function(core)
	{
	};

	/**
	 * Filters out items from the list that don't match the query and returns remaining items. Default 
	 * implementation checks if the item starts with the query.
	 *
	 * @signature ItemManager.filter(list, query)
	 *
	 * @param list {Array} List of items. Default implementation works with strings.
	 * @param query {String} Query string.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id ItemManager.filter
	 */
	p.filter = function(list, query)
	{
		var result = [],
			i, item
			;

		for(i = 0; i < list.length; i++)
		{
			item = list[i];
			if(this.itemContains(item, query))
				result.push(item);
		}

		return result;
	};

	/**
	 * Returns `true` if specified item contains another string, `false` otherwise. In the default implementation 
	 * `String.indexOf()` is used to check if item string begins with the needle string.
	 *
	 * @signature ItemManager.itemContains(item, needle)
	 *
	 * @param item {Object} Item to check. Default implementation works with strings.
	 * @param needle {String} Search string to be found within the item.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id ItemManager.itemContains
	 */
	p.itemContains = function(item, needle)
	{
		return this.itemToString(item).toLowerCase().indexOf(needle.toLowerCase()) == 0;
	};

	/**
	 * Converts specified string to item. Because default implemenation works with string, input string
	 * is simply returned back. To use custom objects, different implementation of this method could
	 * return something like `{ name : {String} }`.
	 *
	 * @signature ItemManager.stringToItem(str)
	 *
	 * @param str {String} Input string.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id ItemManager.stringToItem
	 */
	p.stringToItem = function(str)
	{
		return str;
	};

	/**
	 * Converts specified item to string. Because default implemenation works with string, input string
	 * is simply returned back. To use custom objects, different implementation of this method could
	 * for example return `name` field of `{ name : {String} }`.
	 *
	 * @signature ItemManager.itemToString(item)
	 *
	 * @param item {Object} Input item to be converted to string.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id ItemManager.itemToString
	 */
	p.itemToString = function(item)
	{
		return item;
	};

	/**
	 * Returns `true` if both items are equal, `false` otherwise. Because default implemenation works with 
	 * string, input items are compared as strings. To use custom objects, different implementation of this 
	 * method could for example compare `name` fields of `{ name : {String} }` type object.
	 *
	 * @signature ItemManager.compareItems(item1, item2)
	 *
	 * @param item1 {Object} First item.
	 * @param item2 {Object} Second item.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id ItemManager.compareItems
	 */
	p.compareItems = function(item1, item2)
	{
		return item1 == item2;
	};

	//--------------------------------------------------------------------------------
	// TextExt core component

	p = TextExt.prototype;
		
	/**
	 * Initializes current component instance with work with the supplied text input and options.
	 *
	 * @signature TextExt.init(input, opts)
	 *
	 * @param input {HTMLElement} Text input.
	 * @param opts {Object} Options.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.init
	 */
	p.init = function(input, opts)
	{
		var self = this,
			hiddenInput,
			itemManager,
			container
			;

		self._defaults    = $.extend({}, DEFAULT_OPTS);
		self._opts        = opts || {};
		self._plugins     = {};
		self._itemManager = itemManager = new (self.opts(OPT_ITEM_MANAGER))();
		input             = $(input);
		container         = $(self.opts(OPT_HTML_WRAP));
		hiddenInput       = $(self.opts(OPT_HTML_HIDDEN));

		input
			.wrap(container)
			.keydown(function(e) { return self.onKeyDown(e) })
			.keyup(function(e) { return self.onKeyUp(e) })
			.data('textext', self)
			;

		// keep references to html elements using jQuery.data() to avoid circular references
		$(self).data({
			'hiddenInput'   : hiddenInput,
			'wrapElement' : input.parents('.text-wrap').first(),
			'input'         : input
		});

		// set the name of the hidden input to the text input's name
		hiddenInput.attr('name', input.attr('name'));
		// remove name attribute from the text input
		input.attr('name', null);
		// add hidden input to the DOM
		hiddenInput.insertAfter(input);

		$.extend(true, itemManager, self.opts(OPT_EXT + '.item.manager'));
		$.extend(true, self, self.opts(OPT_EXT + '.*'), self.opts(OPT_EXT + '.core'));
		
		self.originalWidth = input.outerWidth();

		self.invalidateBounds();

		itemManager.init(self);

		self.initPatches();
		self.initPlugins(self.opts(OPT_PLUGINS), $.fn.textext.plugins);

		self.on({
			setFormData  : self.onSetFormData,
			getFormData  : self.onGetFormData,
			setInputData : self.onSetInputData,
			anyKeyUp     : self.onAnyKeyUp
		});

		self.trigger(EVENT_POST_INIT);
		self.trigger(EVENT_READY);

		self.getFormData(0);
	};

	/**
	 * Initialized all installed patches against current instance. The patches are initialized based on their
	 * initialization priority which is returned by each patch's `initPriority()` method. Priority
	 * is a `Number` where patches with higher value gets their `init()` method called before patches
	 * with lower priority value.
	 *
	 * This facilitates initializing of patches in certain order to insure proper dependencies
	 * regardless of which order they are loaded.
	 *
	 * By default all patches have the same priority - zero, which means they will be initialized
	 * in rorder they are loaded, that is unless `initPriority()` is overriden.
	 *
	 * @signature TextExt.initPatches()
	 *
	 * @author agorbatchev
	 * @date 2011/10/11
	 * @id TextExt.initPatches
	 */
	p.initPatches = function()
	{
		var list   = [],
			source = $.fn.textext.patches,
			name
			;

		for(name in source)
			list.push(name);

		this.initPlugins(list, source);
	};

	/**
	 * Creates and initializes all specified plugins. The plugins are initialized based on their
	 * initialization priority which is returned by each plugin's `initPriority()` method. Priority
	 * is a `Number` where plugins with higher value gets their `init()` method called before plugins
	 * with lower priority value.
	 *
	 * This facilitates initializing of plugins in certain order to insure proper dependencies
	 * regardless of which order user enters them in the `plugins` option field.
	 *
	 * By default all plugins have the same priority - zero, which means they will be initialized
	 * in the same order as entered by the user.
	 *
	 * @signature TextExt.initPlugins(plugins)
	 *
	 * @param plugins {Array} List of plugin names to initialize.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.initPlugins
	 */
	p.initPlugins = function(plugins, source)
	{
		var self = this,
			ext, name, plugin, initList = [], i
			;

		if(typeof(plugins) == 'string')
			plugins = plugins.split(/\s*,\s*|\s+/g);

		for(i = 0; i < plugins.length; i++)
		{
			name   = plugins[i];
			plugin = source[name];

			if(plugin)
			{
				self._plugins[name] = plugin = new plugin();
				self[name] = function() { return plugin; };
				initList.push(plugin);
				$.extend(true, plugin, self.opts(OPT_EXT + '.*'), self.opts(OPT_EXT + '.' + name));
			}
		}

		// sort plugins based on their priority values
		initList.sort(function(p1, p2)
		{
			p1 = p1.initPriority();
			p2 = p2.initPriority();

			return p1 === p2
				? 0
				: p1 < p2 ? 1 : -1
				;
		});

		for(i = 0; i < initList.length; i++)
			initList[i].init(self);
	};

	/**
	 * Returns true if specified plugin is was instantiated for the current instance of core.
	 *
	 * @signature TextExt.hasPlugin(name)
	 *
	 * @param name {String} Name of the plugin to check.
	 *
	 * @author agorbatchev
	 * @date 2011/12/28
	 * @id TextExt.hasPlugin
	 * @version 1.1
	 */
	p.hasPlugin = function(name)
	{
		return !!this._plugins[name];
	};

	/**
	 * Allows to add multiple event handlers which will be execued in the scope of the current object.
	 * 
	 * @signature TextExt.on([target], handlers)
	 *
	 * @param target {Object} **Optional**. Target object which has traditional `bind(event, handler)` method.
	 *                        Handler function will still be executed in the current object's scope.
	 * @param handlers {Object} Key/value pairs of event names and handlers, eg `{ event: handler }`.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.on
	 */
	p.on = hookupEvents;

	/**
	 * Binds an event handler to the input box that user interacts with.
	 *
	 * @signature TextExt.bind(event, handler)
	 *
	 * @param event {String} Event name.
	 * @param handler {Function} Event handler.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.bind
	 */
	p.bind = function(event, handler)
	{
		this.input().bind(event, handler);
	};

	/**
	 * Triggers an event on the input box that user interacts with. All core events are originated here.
	 * 
	 * @signature TextExt.trigger(event, ...args)
	 *
	 * @param event {String} Name of the event to trigger.
	 * @param ...args All remaining arguments will be passed to the event handler.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.trigger
	 */
	p.trigger = function()
	{
		var args = arguments;
		this.input().trigger(args[0], slice.call(args, 1));
	};

	/**
	 * Returns instance of `itemManager` that is used by the component.
	 *
	 * @signature TextExt.itemManager()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.itemManager
	 */
	p.itemManager = function()
	{
		return this._itemManager;
	};

	/**
	 * Returns jQuery input element with which user is interacting with.
	 *
	 * @signature TextExt.input()
	 *
	 * @author agorbatchev
	 * @date 2011/08/10
	 * @id TextExt.input
	 */
	p.input = function()
	{
		return $(this).data('input');
	};

	/**
	 * Returns option value for the specified option by name. If the value isn't found in the user
	 * provided options, it will try looking for default value.
	 *
	 * @signature TextExt.opts(name)
	 *
	 * @param name {String} Option name as described in the options.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.opts
	 */
	p.opts = function(name)
	{
		var result = getProperty(this._opts, name);
		return typeof(result) == 'undefined' ? getProperty(this._defaults, name) : result;
	};

	/**
	 * Returns HTML element that was created from the `html.wrap` option. This is the top level HTML
	 * container for the text input with which user is interacting with.
	 *
	 * @signature TextExt.wrapElement()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.wrapElement
	 */
	p.wrapElement = function()
	{
		return $(this).data('wrapElement');
	};

	/**
	 * Updates container to match dimensions of the text input. Triggers `preInvalidate` and `postInvalidate`
	 * events.
	 *
	 * @signature TextExt.invalidateBounds()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.invalidateBounds
	 */
	p.invalidateBounds = function()
	{
		var self      = this,
			input     = self.input(),
			wrap      = self.wrapElement(),
			container = wrap.parent(),
			width     = self.originalWidth,
			height
			;

		self.trigger(EVENT_PRE_INVALIDATE);

		height = input.outerHeight();

		input.width(width);
		wrap.width(width).height(height);
		container.height(height);

		self.trigger(EVENT_POST_INVALIDATE);
	};

	/**
	 * Focuses user input on the text box.
	 *
	 * @signature TextExt.focusInput()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.focusInput
	 */
	p.focusInput = function()
	{
		this.input()[0].focus();
	};

	/**
	 * Serializes data for to be set into the hidden input field and which will be submitted 
	 * with the HTML form.
	 *
	 * By default simple JSON serialization is used. It's expected that `JSON.stringify`
	 * method would be available either through built in class in most modern browsers
	 * or through JSON2 library.
	 *
	 * @signature TextExt.serializeData(data)
	 *
	 * @param data {Object} Data to serialize.
	 *
	 * @author agorbatchev
	 * @date 2011/08/09
	 * @id TextExt.serializeData
	 */
	p.serializeData = stringify;

	/**
	 * Returns the hidden input HTML element which will be submitted with the HTML form.
	 *
	 * @signature TextExt.hiddenInput()
	 *
	 * @author agorbatchev
	 * @date 2011/08/09
	 * @id TextExt.hiddenInput
	 */
	p.hiddenInput = function(value)
	{
		return $(this).data('hiddenInput');
	};

	/**
	 * Abstracted functionality to trigger an event and get the data with maximum weight set by all
	 * the event handlers. This functionality is used for the `getFormData` event.
	 *
	 * @signature TextExt.getWeightedEventResponse(event, args)
	 *
	 * @param event {String} Event name.
	 * @param args {Object} Argument to be passed with the event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExt.getWeightedEventResponse
	 */
	p.getWeightedEventResponse = function(event, args)
	{
		var self      = this,
			data      = {},
			maxWeight = 0
			;

		self.trigger(event, data, args);

		for(var weight in data)
			maxWeight = Math.max(maxWeight, weight);

		return data[maxWeight];
	};

	/**
	 * Triggers the `getFormData` event to get all the plugins to return their data.
	 *
	 * After the data is returned, triggers `setFormData` and `setInputData` to update appopriate values.
	 *
	 * @signature TextExt.getFormData(keyCode)
	 *
	 * @param keyCode {Number} Key code number which has triggered this update. It's impotant to pass
	 * this value to the plugins because they might return different values based on the key that was 
	 * pressed. For example, the Tags plugin returns an empty string for the `input` value if the enter
	 * key was pressed, otherwise it returns whatever is currently in the text input.
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExt.getFormData
	 */
	p.getFormData = function(keyCode)
	{
		var self = this,
			data = self.getWeightedEventResponse(EVENT_GET_FORM_DATA, keyCode)
			;

		self.trigger(EVENT_SET_FORM_DATA  , data['form']);
		self.trigger(EVENT_SET_INPUT_DATA , data['input']);
	};

	//--------------------------------------------------------------------------------
	// Event handlers

	/**
	 * Reacts to the `anyKeyUp` event and triggers the `getFormData` to change data that will be submitted
	 * with the form. Default behaviour is that everything that is typed in will be JSON serialized, so
	 * the end result will be a JSON string.
	 *
	 * @signature TextExt.onAnyKeyUp(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.onAnyKeyUp
	 */
	p.onAnyKeyUp = function(e, keyCode)
	{
		this.getFormData(keyCode);
	};

	/**
	 * Reacts to the `setInputData` event and populates the input text field that user is currently
	 * interacting with.
	 *
	 * @signature TextExt.onSetInputData(e, data)
	 *
	 * @param e {Event} jQuery event.
	 * @param data {String} Value to be set.
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExt.onSetInputData
	 */
	p.onSetInputData = function(e, data)
	{
		this.input().val(data);
	};

	/**
	 * Reacts to the `setFormData` event and populates the hidden input with will be submitted with
	 * the HTML form. The value will be serialized with `serializeData()` method.
	 *
	 * @signature TextExt.onSetFormData(e, data)
	 *
	 * @param e {Event} jQuery event.
	 * @param data {Object} Data that will be set.
	 * 
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExt.onSetFormData
	 */
	p.onSetFormData = function(e, data)
	{
		var self = this;
		self.hiddenInput().val(self.serializeData(data));
	};

	/**
	 * Reacts to `getFormData` event triggered by the core. At the bare minimum the core will tell
	 * itself to use the current value in the text input as the data to be submitted with the HTML
	 * form.
	 *
	 * @signature TextExt.onGetFormData(e, data)
	 *
	 * @param e {Event} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/09
	 * @id TextExt.onGetFormData
	 */
	p.onGetFormData = function(e, data)
	{
		var val = this.input().val();
		data[0] = formDataObject(val, val);
	};

	//--------------------------------------------------------------------------------
	// User mouse/keyboard input

	/**
	 * Triggers `[name]KeyUp` and `[name]KeyPress` for every keystroke as described in the events.
	 *
	 * @signature TextExt.onKeyUp(e)
	 *
	 * @param e {Object} jQuery event.
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.onKeyUp
	 */

	/**
	 * Triggers `[name]KeyDown` for every keystroke as described in the events.
	 *
	 * @signature TextExt.onKeyDown(e)
	 *
	 * @param e {Object} jQuery event.
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.onKeyDown
	 */
	
	$(['Down', 'Up']).each(function()
	{
		var type = this.toString();

		p['onKey' + type] = function(e)
		{
			var self          = this,
				keyName       = self.opts(OPT_KEYS)[e.keyCode],
				defaultResult = true
				;

			if(keyName)
			{
				defaultResult = keyName.substr(-1) != '!';
				keyName       = keyName.replace('!', '');

				self.trigger(keyName + 'Key' + type);

				// manual *KeyPress event fimplementation for the function keys like Enter, Backspace, etc.
				if(type == 'Up' && self._lastKeyDown == e.keyCode)
				{
					self._lastKeyDown = null;
					self.trigger(keyName + 'KeyPress');
				}

				if(type == 'Down')
					self._lastKeyDown = e.keyCode;
			}

			self.trigger('anyKey' + type, e.keyCode);

			return defaultResult;
		};
	});

	//--------------------------------------------------------------------------------
	// Plugin Base
	
	p = TextExtPlugin.prototype;

	/**
	 * Allows to add multiple event handlers which will be execued in the scope of the current object.
	 * 
	 * @signature TextExt.on([target], handlers)
	 *
	 * @param target {Object} **Optional**. Target object which has traditional `bind(event, handler)` method.
	 *                        Handler function will still be executed in the current object's scope.
	 * @param handlers {Object} Key/value pairs of event names and handlers, eg `{ event: handler }`.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.on
	 */
	p.on = hookupEvents;

	/**
	 * Returns the hash object that `getFormData` triggered by the core expects.
	 *
	 * @signature TextExtPlugin.formDataObject(input, form)
	 *
	 * @param input {String} Value that will go into the text input that user is interacting with.
	 * @param form {Object} Value that will be serialized and put into the hidden that will be submitted
	 * with the HTML form.
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExtPlugin.formDataObject
	 */
	p.formDataObject = formDataObject;

	/**
	 * Initialization method called by the core during plugin instantiation. This method must be implemented
	 * by each plugin individually.
	 *
	 * @signature TextExtPlugin.init(core)
	 *
	 * @param core {TextExt} Instance of the TextExt core class.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.init
	 */
	p.init = function(core) { throw new Error('Not implemented') };

	/**
	 * Initialization method wich should be called by the plugin during the `init()` call.
	 *
	 * @signature TextExtPlugin.baseInit(core, defaults)
	 *
	 * @param core {TextExt} Instance of the TextExt core class.
	 * @param defaults {Object} Default plugin options. These will be checked if desired value wasn't
	 * found in the options supplied by the user.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.baseInit
	 */
	p.baseInit = function(core, defaults)
	{
		var self = this;

		core._defaults = $.extend(true, core._defaults, defaults);
		self._core     = core;
		self._timers   = {};
	};

	/**
	 * Allows starting of multiple timeout calls. Each time this method is called with the same
	 * timer name, the timer is reset. This functionality is useful in cases where an action needs
	 * to occur only after a certain period of inactivity. For example, making an AJAX call after 
	 * user stoped typing for 1 second.
	 *
	 * @signature TextExtPlugin.startTimer(name, delay, callback)
	 *
	 * @param name {String} Timer name.
	 * @param delay {Number} Delay in seconds.
	 * @param callback {Function} Callback function.
	 *
	 * @author agorbatchev
	 * @date 2011/08/25
	 * @id TextExtPlugin.startTimer
	 */
	p.startTimer = function(name, delay, callback)
	{
		var self = this;

		self.stopTimer(name);

		self._timers[name] = setTimeout(
			function()
			{
				delete self._timers[name];
				callback.apply(self);
			},
			delay * 1000
		);
	};

	/**
	 * Stops the timer by name without resetting it.
	 *
	 * @signature TextExtPlugin.stopTimer(name)
	 *
	 * @param name {String} Timer name.
	 *
	 * @author agorbatchev
	 * @date 2011/08/25
	 * @id TextExtPlugin.stopTimer
	 */
	p.stopTimer = function(name)
	{
		clearTimeout(this._timers[name]);
	};

	/**
	 * Returns instance of the `TextExt` to which current instance of the plugin is attached to.
	 *
	 * @signature TextExtPlugin.core()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.core
	 */
	p.core = function()
	{
		return this._core;
	};

	/**
	 * Shortcut to the core's `opts()` method. Returns option value.
	 *
	 * @signature TextExtPlugin.opts(name)
	 * 
	 * @param name {String} Option name as described in the options.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.opts
	 */
	p.opts = function(name)
	{
		return this.core().opts(name);
	};

	/**
	 * Shortcut to the core's `itemManager()` method. Returns instance of the `ItemManger` that is
	 * currently in use.
	 *
	 * @signature TextExtPlugin.itemManager()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.itemManager
	 */
	p.itemManager = function()
	{
		return this.core().itemManager();
	};

	/**
	 * Shortcut to the core's `input()` method. Returns instance of the HTML element that represents
	 * current text input.
	 *
	 * @signature TextExtPlugin.input()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.input
	 */
	p.input = function()
	{
		return this.core().input();
	};

	/**
	 * Shortcut to the commonly used `this.input().val()` call to get or set value of the text input.
	 *
	 * @signature TextExtPlugin.val(value)
	 *
	 * @param value {String} Optional value. If specified, the value will be set, otherwise it will be
	 * returned.
	 *
	 * @author agorbatchev
	 * @date 2011/08/20
	 * @id TextExtPlugin.val
	 */
	p.val = function(value)
	{
		var input = this.input();

		if(typeof(value) === UNDEFINED)
			return input.val();
		else
			input.val(value);
	};

	/**
	 * Shortcut to the core's `trigger()` method. Triggers specified event with arguments on the
	 * component core.
	 *
	 * @signature TextExtPlugin.trigger(event, ...args)
	 *
	 * @param event {String} Name of the event to trigger.
	 * @param ...args All remaining arguments will be passed to the event handler.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.trigger
	 */
	p.trigger = function()
	{
		var core = this.core();
		core.trigger.apply(core, arguments);
	};

	/**
	 * Shortcut to the core's `bind()` method. Binds specified handler to the event.
	 *
	 * @signature TextExtPlugin.bind(event, handler)
	 *
	 * @param event {String} Event name.
	 * @param handler {Function} Event handler.
	 *
	 * @author agorbatchev
	 * @date 2011/08/20
	 * @id TextExtPlugin.bind
	 */
	p.bind = function(event, handler)
	{
		this.core().bind(event, handler);
	};

	/**
	 * Returns initialization priority for this plugin. If current plugin depends upon some other plugin
	 * to be initialized before or after, priority needs to be adjusted accordingly. Plugins with higher
	 * priority initialize before plugins with lower priority.
	 *
	 * Default initialization priority is `0`.
	 *
	 * @signature TextExtPlugin.initPriority()
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExtPlugin.initPriority
	 */
	p.initPriority = function()
	{
		return 0;
	};

	//--------------------------------------------------------------------------------
	// jQuery Integration
	
	/**
	 * TextExt integrates as a jQuery plugin available through the `$(selector).textext(opts)` call. If
	 * `opts` argument is passed, then a new instance of `TextExt` will be created for all the inputs
	 * that match the `selector`. If `opts` wasn't passed and TextExt was already intantiated for 
	 * inputs that match the `selector`, array of `TextExt` instances will be returned instead.
	 *
	 *     // will create a new instance of `TextExt` for all elements that match `.sample`
	 *     $('.sample').textext({ ... });
	 *
	 *     // will return array of all `TextExt` instances
	 *     var list = $('.sample').textext();
	 *
	 * The following properties are also exposed through the jQuery `$.fn.textext`:
	 *
	 * * `TextExt` -- `TextExt` class.
	 * * `TextExtPlugin` -- `TextExtPlugin` class.
	 * * `ItemManager` -- `ItemManager` class.
	 * * `plugins` -- Key/value table of all registered plugins.
	 * * `addPlugin(name, constructor)` -- All plugins should register themselves using this function.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.jquery
	 */

	var cssInjected = false;

	var textext = $.fn.textext = function(opts)
	{
		var css;
		
		if(!cssInjected && (css = $.fn.textext.css) != null)
		{
			$('head').append('<style>' + css + '</style>');
			cssInjected = true;
		}

		return this.map(function()
		{
			var self = $(this);

			if(opts == null)
				return self.data('textext');

			var instance = new TextExt();

			instance.init(self, opts);
			self.data('textext', instance);

			return instance.input()[0];
		});
	};

	/**
	 * This static function registers a new plugin which makes it available through the `plugins` option
	 * to the end user. The name specified here is the name the end user would put in the `plugins` option
	 * to add this plugin to a new instance of TextExt.
	 * 
	 * @signature $.fn.textext.addPlugin(name, constructor)
	 *
	 * @param name {String} Name of the plugin.
	 * @param constructor {Function} Plugin constructor.
	 *
	 * @author agorbatchev
	 * @date 2011/10/11
	 * @id TextExt.addPlugin
	 */
	textext.addPlugin = function(name, constructor)
	{
		textext.plugins[name] = constructor;
		constructor.prototype = new textext.TextExtPlugin();
	};

	/**
	 * This static function registers a new patch which is added to each instance of TextExt. If you are
	 * adding a new patch, make sure to call this method.
	 * 
	 * @signature $.fn.textext.addPatch(name, constructor)
	 *
	 * @param name {String} Name of the patch.
	 * @param constructor {Function} Patch constructor.
	 *
	 * @author agorbatchev
	 * @date 2011/10/11
	 * @id TextExt.addPatch
	 */
	textext.addPatch = function(name, constructor)
	{
		textext.patches[name] = constructor;
		constructor.prototype = new textext.TextExtPlugin();
	};

	textext.TextExt       = TextExt;
	textext.TextExtPlugin = TextExtPlugin;
	textext.ItemManager   = ItemManager;
	textext.plugins       = {};
	textext.patches       = {};
})(jQuery);

(function($)
{
	function TextExtIE9Patches() {};

	$.fn.textext.TextExtIE9Patches = TextExtIE9Patches;
	$.fn.textext.addPatch('ie9',TextExtIE9Patches);

	var p = TextExtIE9Patches.prototype;

	p.init = function(core)
	{
		if(navigator.userAgent.indexOf('MSIE 9') == -1)
			return;

		var self = this;

		core.on({ postInvalidate : self.onPostInvalidate });
	};

	p.onPostInvalidate = function()
	{
		var self  = this,
			input = self.input(),
			val   = input.val()
			;

		// agorbatchev :: IE9 doesn't seem to update the padding if box-sizing is on until the
		// text box value changes, so forcing this change seems to do the trick of updating
		// IE's padding visually.
		input.val(Math.random());
		input.val(val);
	};
})(jQuery);

/**
 * jQuery TextExt Plugin
 * http://alexgorbatchev.com/textext
 *
 * @version 1.2.0
 * @copyright Copyright (C) 2011 Alex Gorbatchev. All rights reserved.
 * @license MIT License
 */
(function($)
{
	/**
	 * Tags plugin brings in the traditional tag functionality where user can assemble and 
	 * edit list of tags. Tags plugin works especially well together with Autocomplete, Filter,
	 * Suggestions and Ajax plugins to provide full spectrum of features. It can also work on 
	 * its own and just do one thing -- tags.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags
	 */
	function TextExtTags() {};

	$.fn.textext.TextExtTags = TextExtTags;
	$.fn.textext.addPlugin('tags', TextExtTags);

	var p = TextExtTags.prototype,

		CSS_DOT             = '.',
		CSS_TAGS_ON_TOP     = 'text-tags-on-top',
		CSS_DOT_TAGS_ON_TOP = CSS_DOT + CSS_TAGS_ON_TOP,
		CSS_TAG             = 'text-tag',
		CSS_DOT_TAG         = CSS_DOT + CSS_TAG,
		CSS_TAGS            = 'text-tags',
		CSS_DOT_TAGS        = CSS_DOT + CSS_TAGS,

		/**
		 * Tags plugin options are grouped under `tags` when passed to the 
		 * `$().textext()` function. For example:
		 *
		 *     $('textarea').textext({
		 *         plugins: 'tags',
		 *         tags: {
		 *             items: [ "tag1", "tag2" ]
		 *         }
		 *     })
		 *
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExtTags.options
		 */

		/**
		 * This is a toggle switch to enable or disable the Tags plugin. The value is checked
		 * each time at the top level which allows you to toggle this setting on the fly.
		 *
		 * @name tags.enabled
		 * @default true
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExtTags.options.tags.enabled
		 */
		OPT_ENABLED = 'tags.enabled',

		/**
		 * Allows to specify tags which will be added to the input by default upon initialization.
		 * Each item in the array must be of the type that current `ItemManager` can understand.
		 * Default type is `String`.
		 *
		 * @name tags.items
		 * @default null
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExtTags.options.tags.items
		 */
		OPT_ITEMS = 'tags.items',
		
		/**
		 * HTML source that is used to generate a single tag.
		 *
		 * @name html.tag
		 * @default '<div class="text-tags"/>'
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExtTags.options.html.tag
		 */
		OPT_HTML_TAG  = 'html.tag',
		
		/**
		 * HTML source that is used to generate container for the tags.
		 *
		 * @name html.tags
		 * @default '<div class="text-tag"><div class="text-button"><span class="text-label"/><a class="text-remove"/></div></div>'
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExtTags.options.html.tags
		 */
		OPT_HTML_TAGS = 'html.tags',

		/**
		 * Tags plugin dispatches or reacts to the following events.
		 *
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExtTags.events
		 */

		/**
		 * Tags plugin triggers the `isTagAllowed` event before adding each tag to the tag list. Other plugins have
		 * an opportunity to interrupt this by setting `result` of the second argument to `false`. For example:
		 *
		 *     $('textarea').textext({...}).bind('isTagAllowed', function(e, data)
		 *     {
		 *         if(data.tag === 'foo')
		 *             data.result = false;
		 *     })
		 *
		 * The second argument `data` has the following format: `{ tag : {Object}, result : {Boolean} }`. `tag`
		 * property is in the format that the current `ItemManager` can understand.
		 *
		 * @name isTagAllowed
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExtTags.events.isTagAllowed
		 */
		EVENT_IS_TAG_ALLOWED = 'isTagAllowed',

		DEFAULT_OPTS = {
			tags : {
				enabled : true,
				items   : null
			},

			html : {
				tags : '<div class="text-tags"/>',
				tag  : '<div class="text-tag"><div class="text-button"><span class="text-label"/><a class="text-remove"/></div></div>'
			}
		}
		;

	/**
	 * Initialization method called by the core during plugin instantiation.
	 *
	 * @signature TextExtTags.init(core)
	 *
	 * @param core {TextExt} Instance of the TextExt core class.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.init
	 */
	p.init = function(core)
	{
		this.baseInit(core, DEFAULT_OPTS);

		var self  = this,
			input = self.input(),
			container
			;

		if(self.opts(OPT_ENABLED))
		{
			container = $(self.opts(OPT_HTML_TAGS));
			input.after(container);

			$(self).data('container', container);

			self.on({
				enterKeyPress    : self.onEnterKeyPress,
				backspaceKeyDown : self.onBackspaceKeyDown,
				preInvalidate    : self.onPreInvalidate,
				postInit         : self.onPostInit,
				getFormData      : self.onGetFormData
			});

			self.on(container, {
				click     : self.onClick,
				mousemove : self.onContainerMouseMove
			});

			self.on(input, {
				mousemove : self.onInputMouseMove
			});
		}

		self._originalPadding = { 
			left : parseInt(input.css('paddingLeft') || 0),
			top  : parseInt(input.css('paddingTop') + 5 || 0)
		};

		self._paddingBox = {
			left : 0,
			top  : 5
		};

		self.updateFormCache();
	};

	/**
	 * Returns HTML element in which all tag HTML elements are residing.
	 *
	 * @signature TextExtTags.containerElement()
	 *
	 * @author agorbatchev
	 * @date 2011/08/15
	 * @id TextExtTags.containerElement
	 */
	p.containerElement = function()
	{
		return $(this).data('container');
	};

	//--------------------------------------------------------------------------------
	// Event handlers
	
	/**
	 * Reacts to the `postInit` event triggered by the core and sets default tags
	 * if any were specified.
	 *
	 * @signature TextExtTags.onPostInit(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/09
	 * @id TextExtTags.onPostInit
	 */
	p.onPostInit = function(e)
	{
		var self = this;
		self.addTags(self.opts(OPT_ITEMS));
	};

	/**
	 * Reacts to the [`getFormData`][1] event triggered by the core. Returns data with the
	 * weight of 200 to be *greater than the Autocomplete plugin* data weight. The weights 
	 * system is covered in greater detail in the [`getFormData`][1] event documentation.
	 *
	 * [1]: /manual/textext.html#getformdata
	 *
	 * @signature TextExtTags.onGetFormData(e, data, keyCode)
	 *
	 * @param e {Object} jQuery event.
	 * @param data {Object} Data object to be populated.
	 * @param keyCode {Number} Key code that triggered the original update request.
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExtTags.onGetFormData
	 */
	p.onGetFormData = function(e, data, keyCode)
	{
		var self       = this,
			inputValue = keyCode === 13 ? '' : self.val(),
			formValue  = self._formData
			;

		data[200] = self.formDataObject(inputValue, formValue);
	};

	/**
	 * Returns initialization priority of the Tags plugin which is expected to be
	 * *less than the Autocomplete plugin* because of the dependencies. The value is
	 * 100.
	 *
	 * @signature TextExtTags.initPriority()
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExtTags.initPriority
	 */
	p.initPriority = function()
	{
		return 100;
	};

	/**
	 * Reacts to user moving mouse over the text area when cursor is over the text
	 * and not over the tags. Whenever mouse cursor is over the area covered by
	 * tags, the tags container is flipped to be on top of the text area which
	 * makes all tags functional with the mouse.
	 *
	 * @signature TextExtTags.onInputMouseMove(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/08
	 * @id TextExtTags.onInputMouseMove
	 */
	p.onInputMouseMove = function(e)
	{
		this.toggleZIndex(e);
	};

	/**
	 * Reacts to user moving mouse over the tags. Whenever the cursor moves out
	 * of the tags and back into where the text input is happening visually,
	 * the tags container is sent back under the text area which allows user
	 * to interact with the text using mouse cursor as expected.
	 *
	 * @signature TextExtTags.onContainerMouseMove(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/08
	 * @id TextExtTags.onContainerMouseMove
	 */
	p.onContainerMouseMove = function(e)
	{
		this.toggleZIndex(e);
	};

	/**
	 * Reacts to the `backspaceKeyDown` event. When backspace key is pressed in an empty text field, 
	 * deletes last tag from the list.
	 *
	 * @signature TextExtTags.onBackspaceKeyDown(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/02
	 * @id TextExtTags.onBackspaceKeyDown
	 */
	p.onBackspaceKeyDown = function(e)
	{
		var self    = this,
			lastTag = self.tagElements().last()
			;

		if(self.val().length == 0)
			self.removeTag(lastTag);
	};

	/**
	 * Reacts to the `preInvalidate` event and updates the input box to look like the tags are
	 * positioned inside it.
	 * 
	 * @signature TextExtTags.onPreInvalidate(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.onPreInvalidate
	 */
	p.onPreInvalidate = function(e)
	{
		var self    = this,
			lastTag = self.tagElements().last(),
			pos     = lastTag.position()
			;
		
		if(lastTag.length > 0)
			pos.left += lastTag.innerWidth();
		else
			pos = self._originalPadding;

		self._paddingBox = pos;

		self.input().css({
			paddingLeft : pos.left,
			paddingTop  : pos.top + 5
		});
	};

	/**
	 * Reacts to the mouse `click` event.
	 *
	 * @signature TextExtTags.onClick(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.onClick
	 */
	p.onClick = function(e)
	{
		var self   = this,
			source = $(e.target),
			focus  = 0
			;

		if(source.is(CSS_DOT_TAGS))
		{
			focus = 1;
		}
		else if(source.is('.text-remove'))
		{
			self.removeTag(source.parents(CSS_DOT_TAG + ':first'));
			focus = 1;
		}

		if(focus)
			self.core().focusInput();
	};

	/**
	 * Reacts to the `enterKeyPress` event and adds whatever is currently in the text input
	 * as a new tag. Triggers `isTagAllowed` to check if the tag could be added first.
	 *
	 * @signature TextExtTags.onEnterKeyPress(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.onEnterKeyPress
	 */
	p.onEnterKeyPress = function(e)
	{
		var self = this,
			val  = self.val(),
			tag  = self.itemManager().stringToItem(val)
			;

		if(self.isTagAllowed(tag))
		{
			self.addTags([ tag ]);
			// refocus the textarea just in case it lost the focus
			self.core().focusInput();
		}
	};

	//--------------------------------------------------------------------------------
	// Core functionality

	/**
	 * Creates a cache object with all the tags currently added which will be returned
	 * in the `onGetFormData` handler.
	 *
	 * @signature TextExtTags.updateFormCache()
	 *
	 * @author agorbatchev
	 * @date 2011/08/09
	 * @id TextExtTags.updateFormCache
	 */
	p.updateFormCache = function()
	{
		var self   = this,
			result = []
			;

		self.tagElements().each(function()
		{
			result.push($(this).data(CSS_TAG));
		});

		// cache the results to be used in the onGetFormData
		self._formData = result;
	};

	/**
	 * Toggles tag container to be on top of the text area or under based on where
	 * the mouse cursor is located. When cursor is above the text input and out of
	 * any of the tags, the tags container is sent under the text area. If cursor
	 * is over any of the tags, the tag container is brought to be over the text
	 * area.
	 * 
	 * @signature TextExtTags.toggleZIndex(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/08
	 * @id TextExtTags.toggleZIndex
	 */
	p.toggleZIndex = function(e)
	{
		var self            = this,
			offset          = self.input().offset(),
			mouseX          = e.clientX - offset.left,
			mouseY          = e.clientY - offset.top,
			box             = self._paddingBox,
			container       = self.containerElement(),
			isOnTop         = container.is(CSS_DOT_TAGS_ON_TOP),
			isMouseOverText = mouseX > box.left && mouseY > box.top
			;

		if(!isOnTop && !isMouseOverText || isOnTop && isMouseOverText)
			container[(!isOnTop ? 'add' : 'remove') + 'Class'](CSS_TAGS_ON_TOP);
	};

	/**
	 * Returns all tag HTML elements.
	 *
	 * @signature TextExtTags.tagElements()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.tagElements
	 */
	p.tagElements = function()
	{
		return this.containerElement().find(CSS_DOT_TAG);
	};

	/**
	 * Wrapper around the `isTagAllowed` event which triggers it and returns `true`
	 * if `result` property of the second argument remains `true`.
	 *
	 * @signature TextExtTags.isTagAllowed(tag)
	 *
	 * @param tag {Object} Tag object that the current `ItemManager` can understand.
	 * Default is `String`.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.isTagAllowed
	 */
	p.isTagAllowed = function(tag)
	{
		var opts = { tag : tag, result : true };
		this.trigger(EVENT_IS_TAG_ALLOWED, opts);
		return opts.result === true;
	};

	/**
	 * Adds specified tags to the tag list. Triggers `isTagAllowed` event for each tag
	 * to insure that it could be added. Calls `TextExt.getFormData()` to refresh the data.
	 *
	 * @signature TextExtTags.addTags(tags)
	 *
	 * @param tags {Array} List of tags that current `ItemManager` can understand. Default
	 * is `String`.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.addTags
	 */
	p.addTags = function(tags)
	{
		if(!tags || tags.length == 0)
			return;

		var self      = this,
			core      = self.core(),
			container = self.containerElement(),
			i, tag
			;

		for(i = 0; i < tags.length; i++)
		{
			tag = tags[i];

			if(tag && self.isTagAllowed(tag))
				container.append(self.renderTag(tag));
		}

		self.updateFormCache();
		core.getFormData();
		core.invalidateBounds();
	};

	/**
	 * Returns HTML element for the specified tag.
	 *
	 * @signature TextExtTags.getTagElement(tag)
	 *
	 * @param tag {Object} Tag object in the format that current `ItemManager` can understand. 
	 * Default is `String`.

	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.getTagElement
	 */
	p.getTagElement = function(tag)
	{
		var self = this,
			list = self.tagElements(),
			i, item
			;

		for(i = 0; i < list.length, item = $(list[i]); i++)
			if(self.itemManager().compareItems(item.data(CSS_TAG), tag))
				return item;
	};

	/**
	 * Removes specified tag from the list. Calls `TextExt.getFormData()` to refresh the data.
	 *
	 * @signature TextExtTags.removeTag(tag)
	 *
	 * @param tag {Object} Tag object in the format that current `ItemManager` can understand. 
	 * Default is `String`.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.removeTag
	 */
	p.removeTag = function(tag)
	{
		var self = this,
			core = self.core(),
			element
			;

		if(tag instanceof $)
		{
			element = tag;
			tag = tag.data(CSS_TAG);
		}
		else
		{
			element = self.getTagElement(tag);
		}

		element.remove();
		self.updateFormCache();
		core.getFormData();
		core.invalidateBounds();
	};

	/**
	 * Creates and returns new HTML element from the source code specified in the `html.tag` option.
	 *
	 * @signature TextExtTags.renderTag(tag)
	 *
	 * @param tag {Object} Tag object in the format that current `ItemManager` can understand. 
	 * Default is `String`.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.renderTag
	 */
	p.renderTag = function(tag)
	{
		var self = this,
			node = $(self.opts(OPT_HTML_TAG))
			;

		node.find('.text-label').text(self.itemManager().itemToString(tag));
		node.data(CSS_TAG, tag);
		return node;
	};
})(jQuery);
;$.fn.textext.css = '.text-core {\n\
  position: relative;\n\
  background: #fff;\n\
}\n\
.text-core .text-wrap {\n\
  position: absolute;\n\
}\n\
.text-core .text-wrap textarea,\n\
.text-core .text-wrap input {\n\
  -webkit-box-sizing: border-box;\n\
  -moz-box-sizing: border-box;\n\
  box-sizing: border-box;\n\
  -webkit-border-radius: 0px;\n\
  -moz-border-radius: 0px;\n\
  border-radius: 0px;\n\
  border: 1px solid #9daccc;\n\
  outline: none;\n\
  resize: none;\n\
  position: absolute;\n\
  z-index: 1;\n\
  background: none;\n\
  overflow: hidden;\n\
  margin: 0;\n\
  padding: 3px 5px 4px 5px;\n\
  white-space: nowrap;\n\
  font: 14px arial, sans-serif;\n\
  line-height: 13px;\n\
  height: auto;\n\
}\n\
.text-core .text-wrap .text-arrow {\n\
  -webkit-box-sizing: border-box;\n\
  -moz-box-sizing: border-box;\n\
  box-sizing: border-box;\n\
  position: absolute;\n\
  top: 0;\n\
  right: 0;\n\
  width: 22px;\n\
  height: 22px;\n\
  background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAOAQMAAADHWqTrAAAAA3NCSVQICAjb4U/gAAAABlBMVEX///8yXJnt8Ns4AAAACXBIWXMAAAsSAAALEgHS3X78AAAAHHRFWHRTb2Z0d2FyZQBBZG9iZSBGaXJld29ya3MgQ1MzmNZGAwAAABpJREFUCJljYEAF/xsY6hkY7BgYZBgYOFBkADkdAmFDagYFAAAAAElFTkSuQmCC") 50% 50% no-repeat;\n\
  cursor: pointer;\n\
  z-index: 2;\n\
}\n\
.text-core .text-wrap .text-dropdown {\n\
  -webkit-box-sizing: border-box;\n\
  -moz-box-sizing: border-box;\n\
  box-sizing: border-box;\n\
  padding: 0;\n\
  position: absolute;\n\
  z-index: 3;\n\
  background: #fff;\n\
  border: 1px solid #9daccc;\n\
  width: 100%;\n\
  max-height: 100px;\n\
  padding: 1px;\n\
  font: 11px "lucida grande", tahoma, verdana, arial, sans-serif;\n\
  display: none;\n\
  overflow-x: hidden;\n\
  overflow-y: auto;\n\
}\n\
.text-core .text-wrap .text-dropdown.text-position-below {\n\
  margin-top: 1px;\n\
}\n\
.text-core .text-wrap .text-dropdown.text-position-above {\n\
  margin-bottom: 1px;\n\
}\n\
.text-core .text-wrap .text-dropdown .text-list .text-suggestion {\n\
  padding: 3px 5px;\n\
  cursor: pointer;\n\
}\n\
.text-core .text-wrap .text-dropdown .text-list .text-suggestion em {\n\
  font-style: normal;\n\
  text-decoration: underline;\n\
}\n\
.text-core .text-wrap .text-dropdown .text-list .text-suggestion.text-selected {\n\
  color: #fff;\n\
  background: #6d84b4;\n\
}\n\
.text-core .text-wrap .text-focus {\n\
  -webkit-box-shadow: 0px 0px 6px #6d84b4;\n\
  -moz-box-shadow: 0px 0px 6px #6d84b4;\n\
  box-shadow: 0px 0px 6px #6d84b4;\n\
  position: absolute;\n\
  width: 100%;\n\
  height: 100%;\n\
  display: none;\n\
}\n\
.text-core .text-wrap .text-focus.text-show-focus {\n\
  display: block;\n\
}\n\
.text-core .text-wrap .text-prompt {\n\
  -webkit-box-sizing: border-box;\n\
  -moz-box-sizing: border-box;\n\
  box-sizing: border-box;\n\
  position: absolute;\n\
  width: 100%;\n\
  height: 100%;\n\
  margin: 1px 0 0 2px;\n\
  font: 11px "lucida grande", tahoma, verdana, arial, sans-serif;\n\
  color: #c0c0c0;\n\
  overflow: hidden;\n\
  white-space: pre;\n\
}\n\
.text-core .text-wrap .text-prompt.text-hide-prompt {\n\
  display: none;\n\
}\n\
.text-core .text-wrap .text-tags {\n\
  -webkit-box-sizing: border-box;\n\
  -moz-box-sizing: border-box;\n\
  box-sizing: border-box;\n\
  position: absolute;\n\
  width: 100%;\n\
  height: 100%;\n\
  padding: 5px 35px 5px 5px;\n\
  cursor: text;\n\
}\n\
.text-core .text-wrap .text-tags.text-tags-on-top {\n\
  z-index: 2;\n\
}\n\
.text-core .text-wrap .text-tags .text-tag {\n\
  float: left;\n\
}\n\
.text-core .text-wrap .text-tags .text-tag .text-button {\n\
  -webkit-border-radius: 2px;\n\
  -moz-border-radius: 2px;\n\
  border-radius: 2px;\n\
  -webkit-box-sizing: border-box;\n\
  -moz-box-sizing: border-box;\n\
  box-sizing: border-box;\n\
  position: relative;\n\
  float: left;\n\
  border: 1px solid #888;\n\
  background: #202020;\n\
  color: #CCC;\n\
  padding: 6px 25px 5px 6px;\n\
  margin: 0 2px 2px 0;\n\
  cursor: pointer;\n\
  height: 28px;\n\
  font: 14px arial, sans-serif;\n\
}\n\
.text-core .text-wrap .text-tags .text-tag .text-button a.text-remove {\n\
  position: absolute;\n\
  right: 5px;\n\
  top: 9px;\n\
  display: block;\n\
  width: 11px;\n\
  height: 11px;\n\
  background: url("img/remove.png") 0 -11px no-repeat;\n\
}\n\
.text-core .text-wrap .text-tags .text-tag .text-button a.text-remove:hover {\n\
  background-position: 0 -22px;\n\
}\n\
.text-core .text-wrap .text-tags .text-tag .text-button a.text-remove:active {\n\
  background-position: 0 -22px;\n\
}\n\
';