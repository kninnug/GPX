(function(root, factory){
	if(typeof define !== 'undefined' && define.amd){
		define(factory);
	}else if(typeof module !== 'undefined'){
		module.exports = factory();
	}else{
		root.PicoInput = factory();
	}
})(this, function(){
	"use strict";
	
	/**
	 * A miniscule input 'library'. Quick start:
	 * 1. Select root element.
	 * 2. Add 'pico' class (configurable) to elements to get input from.
	 * 3. Optionally define parsers and/or handlers.
	 * 4. Optionally define a callback when any change happens.
	 *
	 * When any input happens on a bindable element, the value from the element
	 * is grabbed, possibly parsed and placed into the .data member of the
	 * PicoInput instance. Then the callback (if defined) is called. The key
	 * for the value is determined, in order, by the element data-<dataName>
	 * attribute (default: data-pico), the name attribute and finally the 
	 * element id.
	 *
	 * Example:
	 *
	 * <table id="table">
	 *                               <!-- text value is placed into .string -->
	 *   <tr><td>String:</td><td><input class="pico" type="text" id="string" /></td>
	 *                                  <!-- date is parsed and placed into .date -->
	 *   <tr><td>Date:</td><td><input class="pico" type="datetime-local" id="date" /></td>
	 *                                               <!-- when checked .check is true -->
	 *   <tr><td>Check:</td><td><input class="pico" type="checkbox" id="check" /></td>
	 * </table>
	 *
	 * <script src="picoinput.js"></script>
	 * <script>
	 *   // gather input inside table
	 *   const input = new PicoInput({
	 *     // look for bindable elements in #table
	 *     root: document.getElementById("table"),
	 *     // log data whenever it changes
	 *     callback: console.log
	 *   });
	 * </script>
	 *
	 * @constructor
	 * @param opt {Object} The options.
	 * @param opt.root {Element} The root element to find bindable elements in.
	 *        Aliases: elm, element. Default: null.
	 * @param opt.dataName {String} The name of the data- attribute to use for
	 *        getting element keys.
	 *        Alias: name. Default: 'pico'.
	 * @param opt.class {String} The class of child-elements to bind to.
	 *        Aliases: cls, bindClass. Default: 'pico'.
	 * @param opt.children {Array:Element} Child-elements to bind to. Set
	 *        opt.class to null and fill this to manually add children, rather
	 *        than find them with root.getElementsByClassName().
	 * @param opt.parsers {Object:Function} An object of functions to get values
	 *        from elements. The object keys refer to the element keys. The 
	 *        function is called with the element, the event causing the update
	 *        and this. Note that event may be null.
	 *        Alias: parse. Default: {}.
	 * @param opt.handlers {Object:Function} An object of functions to handle
	 *        updates of specific elements. The object keys refer to the element
	 *        keys. The function is called with the element, the event causing
	 *        the update and this. If it returns falsy the element value is not
	 *        get/set and the general callback (below) is not called.
	 *        Alias: handle. Default: {}.
	 * @param opt.callback {Function} A callback to call after every update.
	 *        Called with the data-set, the event causing the update (may be
	 *        null) and this.
	 *        Alias: cb, update. Default: function(){}.
	 * @param opt.data {Object} The object to fill the inputted values. If not
	 *        provided it is available at this.data and passed to the callback.
	 *        Alias: target, tgt. Default: {}.
	 */
	function PicoInput(opt){
		/** @var root {Element} The root element */
		this.root = opt.root || opt.elm || opt.element || null;
		/** @var dataName {String} Name of the dataset-key */
		this.dataName = opt.name || opt.dataName || 'pico';
		/** @var bindClass {String} Class-name to find bindable-elements with */
		this.bindClass = opt.class || opt.cls || opt.bindClass;
		/** @var parsers {Object:Function} Post-processors for input values */
		this.parsers = opt.parsers || opt.parse || {};
		/** @var handlers {Object:Function} Callbacks for specific values */
		this.handlers = opt.handlers || opt.handle || {};
		/** @var callback {Function} Function to call when the input has changed */
		this.callback = opt.callback || opt.cb || opt.update || function(){};
		/** @var data {Object} Object values are stored in */
		this.data = opt.data || opt.target || opt.tgt || {};
		
		/** @var children {Array:Element} Child-elements. */
		this.children = opt.children || [];
		
		// Not set, use default. Can't OR because explicit null'ing is allowed.
		if(!this.bindClass && this.bindClass !== null){
			this.bindClass = 'pico';
		}
		
		if(this.root && this.bindClass && !this.children.length){
			this.gatherChildren(this.root);
		}
	}
	
	/**
	 * Gathers the bindable children and registers the events on them. Called by
	 * the constructor if no children are supplied and this.bindClass isn't
	 * null.
	 *
	 * @param root {Element} The element to gather children from.
	 * @return this.
	 */
	PicoInput.prototype.gatherChildren = function(root){
		root = root || this.root;
		
		if(!root){
			return null;
		}
		
		this.children = Array.from(root.getElementsByClassName(this.bindClass));
		
		this.children.forEach((elm) => {
			this.registerEvents(elm);
			this.setValue(elm, null);
		}, this);
		
		this.callback(this.data, null, this);
		
		return this;
	};
	
	/**
	 * Register the appropriate event for the input-type. If no parser is 
	 * specified for the element it also attaches a default-parser, if 
	 * appropriate.
	 *
	 * @param elm {Element} The element.
	 * @return this.
	 */
	PicoInput.prototype.registerEvents = function(elm){
		const tn = elm.tagName.toLowerCase(),
			key = this.getKey(elm);
		var type = elm.type, evt = null;
		
		if(tn === 'input'){
			type = elm.type;
		}else{
			type = tn;
		}
		
		switch(type){
			case 'button':
			case 'image':
			case 'reset':
			case 'submit':
				evt = 'click';
				break;
			case 'checkbox':
			case 'file':
			case 'radio':
			case 'select':
				evt = 'change';
				break;
			case 'color':
			case 'date':
			case 'datetime':
			case 'datetime-local':
			case 'email':
			case 'month':
			case 'number':
			case 'password':
			case 'range':
			case 'search':
			case 'tel':
			case 'text':
			case 'textarea':
			case 'time':
			case 'url':
			case 'week':
				evt = 'input';
				break;
		}
		
		if(!evt){
			return this;
		}
		
		elm.addEventListener(evt, this.handle.bind(this), false);
		if(PicoInput.defaultParsers[type] && !this.parsers[key]){
			this.parsers[key] = PicoInput.defaultParsers[type];
		}
		
		return this;
	};
	
	/**
	 * Get the data-key of the element. In order it tries the data-<dataName>
	 * attribute, then name and finally the element id.
	 *
	 * @param elm {Element} The element.
	 * @return {String} The key.
	 */
	PicoInput.prototype.getKey = function(elm){
		if(elm.dataset && elm.dataset[this.dataName]){
			return elm.dataset[this.dataName];
		}
		if(elm.hasAttributeNS(null, 'name')){
			return elm.getAttributeNS(null, 'name');
		}
		
		return elm.id;
	};
	
	/**
	 * Get the value from the element. Calls the parser for the element key if
	 * one is set. For checkboxes it gets elm.checked, otherwise elm.value.
	 *
	 * @param elm {Element} The element.
	 * @param key {String} The key for the element.
	 * @param evt {Event} The event that caused the value to change, passed to
	 *        the parser.
	 * @return {any} The value.
	 */
	PicoInput.prototype.getValue = function(elm, key, evt){
		if(this.parsers[key]){
			return this.parsers[key](elm, evt, this);
		}
		
		if(elm.tagName.toLowerCase() === 'input' && elm.type === 'checkbox'){
			return elm.checked;
		}
		
		return elm.value;
	};
	
	/**
	 * Get the value from the element and put it in the data.
	 *
	 * @param elm {Element} The element.
	 * @param evt {Event} The event causing the update, passed to getValue.
	 * @return this.
	 */
	PicoInput.prototype.setValue = function(elm, evt){
		const key = this.getKey(elm),
			val = this.getValue(elm, key, evt);
		
		this.data[key] = val;
		
		return this;
	};
	
	/**
	 * Handle an event on one of the elements. Sets the value and calls
	 * callback, unless the element has a handler and it returns falsy.
	 *
	 * @param evt {Event} The event.
	 * @return {any} The return value of callback.
	 */
	PicoInput.prototype.handle = function(evt){
		var elm = evt.target,
			key = this.getKey(elm),
			val;
		
		if(this.handlers[key]){
			if(!this.handlers[key](elm, evt, this)){
				return false;
			}
		}
		
		this.setValue(elm, evt);
		
		return this.callback(this.data, evt, this);
	};
	
	/*
	 * Default parsers
	 */
	
	/**
	 * Parse checkbox: if it has a value attribute and  the box is checked, the
	 * value is returned, if unchecked null is returned. Otherwise elm.checked.
	 *
	 * @param elm {Element} The checkbox.
	 * @return {Boolean|String} The value, null or the checked status.
	 */
	function parseCheckbox(elm){
		if(elm.hasAttributeNS(null, 'value')){
			return elm.checked ? elm.value : null;
		}
		
		return elm.checked;
	}
	
	/**
	 * Parse a date: calls new Date with the element value.
	 *
	 * @param elm {Element} The date element.
	 * @return {Date} The date.
	 */
	function parseDate(elm){
		return new Date(elm.value);
	}
	
	/**
	 * Parse a file: a (proper) array of files, if the element has multiple
	 * files allowed. Or the first file, or null.
	 *
	 * @param elm {Element} The file element.
	 * @return {Array:File|File} The file(s) or null.
	 */
	function parseFile(elm){
		if(!elm.multiple){
			return elm.files.length ? elm.files[0] : null;
		}
		return Array.from(elm.files);
	}
	
	/**
	 * Parse a number: turn the element value into a number.
	 *
	 * @param elm {Element} The element.
	 * @return {Number} The numerical value.
	 */
	function parseNumber(elm){
		return Number(elm.value);
	}
	
	/**
	 * Parse a select: if it is not a multi-select returns the element value.
	 * Otherwise it creates an Array of the values of the selected elements.
	 *
	 * @param elm {Element} The select element.
	 * @return {Array:String|String} The value(s).
	 */
	function parseSelect(elm){
		if(!elm.multiple){
			return elm.value;
		}
		
		return Array.prototype.filter.call(elm.options, (opt) => {
			return opt.selected;
		}).map((opt) => {
			return opt.value || opt.text;
		});
	}
	
	/**
	 * Parse an URL: if the browser doesn't have window.URL, or if it fails to
	 * parse the URL, returns the element value. Otherwise the parsed URL.
	 *
	 * @param elm {Element} The URL element.
	 * @return {URL|String} The (parsed) URL.
	 */
	function parseURL(elm){
		if(!window.URL || typeof window.URL !== 'function'){
			return elm.value;
		}
		
		try{
			return new URL(elm.value);
		}catch(ex){
			return elm.value;
		}
	}
	
	/**
	 * The default parsers. Elements of these types that do not have a parser
	 * set explicitly, will use the appropriate one here.
	 */
	PicoInput.defaultParsers = {
		checkbox: parseCheckbox,
		date: parseDate,
		datetime: parseDate,
		'datetime-local': parseDate,
		file: parseFile,
		number: parseNumber,
		select: parseSelect,
		range: parseNumber,
		url: parseURL
	};
	
	return PicoInput;
});
