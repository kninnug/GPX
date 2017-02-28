(function(root, factory){
	if(typeof define !== 'undefined' && define.amd){
		define(factory);
	}else if(typeof module !== 'undefined'){
		module.exports = factory();
	}else{
		root.PicoTemplate = factory();
	}
})(this, function(){
	"use strict";
	/**
	 * A miniscule template 'engine'. Quick start:
	 * 1. Select root element.
	 * 2. Add the 'pico'-class (configurable) to elements to fill in.
	 * 3. Fill the elements with the properties to bind to. Optionally with
	 *    formatters: <element class="pico">property</element>
	 *    <element class="pico">property | format1 | ...</element>
	 * 4. Call set({...}) with the data.
	 *
	 * Example:
	 *
	 * <table id="table">
	 *                         <!-- bind to .name -->
	 *   <tr><td>Name  </td><td class="pico">name</td></tr>
	 *                   <!-- bind to .date and process with 'iso' formatter -->
	 *   <tr><td>Date  </td><td class="pico">date | iso</td></tr>
	 *                         <!-- bind to .place -->
	 *   <tr><td>Place </td><td class="pico">place</td></tr>
	 *                     <!-- Left untouched -->
	 *   <tr><td>Status</td><td>Unknown</td></tr>
	 * </table>
	 *
	 * <script src="picotemplate.js"></script>
	 * <script>
	 *   // Make template for table
	 *   const tpl = new PicoTemplate({
	 *     // Look for bindable-elements inside the #table
	 *     root: document.getElementById('table'),
	 *     // Formatters
	 *     formats: {
	 *       // Format a Date as an ISO-string
	 *       iso: (d) => d.toISOString()
	 *     }
	 *   });
	 *   // Show data. Call as often as you like
	 *   tpl.set({
	 *     name: "Gordon Freeman",
	 *     date: new Date(),
	 *     place: "Black Mesa Research Facility"
	 *   });
	 * </script>
	 *
	 * @constructor
	 * @param opt {Object} The options.
	 * @param opt.root {Element} The root element to look for children.
	 *        Aliases: elm, element. Default: null.
	 * @param opt.class {String} The class of child-elements to bind to.
	 *        Aliases: cls, bindClass. Default: 'pico'.
	 * @param opt.children {Array:Element} Child-elements to bind to. Set
	 *        opt.class to null and fill this to manually add children, rather
	 *        than find them with root.getElementsByClassName(). Note that the
	 *        elements need to have their template-string set on their
	 *        data-<opt.data> (below) attribute rather than inside their HTML.
	 * @param opt.formats {Object:Function} An object of functions to post-
	 *        process values. The object keys are formatter names. The function
	 *        receives the (previous) value, the full data set and this as its
	 *        arguments and is expected to return the new/next value.
	 *        Aliases: fmts, formatters. Default: {}.
	 * @param opt.delimiter {String} The seperator between formatters. 
	 *        Aliases: delim. Default: '|'.
	 * @param opt.data {String} The name of the dataset-key to use to store the
	 *        template-string.
	 *        Aliases: data. Default: 'pico'.
	 */
	function PicoTemplate(opt){
		/** @var root {Element} The root element */
		this.root = opt.root || opt.elm || opt.element || null;
		/** @var bindClass {String} Class-name to find bindable-elements with */
		this.bindClass = opt.class || opt.cls || opt.bindClass;
		/** @var formatters {Object of Function} Format-functions. */
		this.formatters = opt.formats || opt.fmts || opt.formatters || {};
		/** @var formatDelimiter {String} Seperator between property & formatters. */
		this.formatDelimiter = opt.delim || opt.delimiter || '|';
		/** @var dataName {String} Name of the dataset-key. */
		this.dataName = opt.data || opt.dataName || 'pico';
		
		/** @var children {Array of Element} Child-elements. */
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
	 * Gathers the bindable children and moves the template string from their
	 * inner-HTML to the data-<this.dataName> attribute. Called by the 
	 * constructor if no children are supplied and this.bindClass isn't null.
	 *
	 * @param root {Element} The element to gather children from.
	 * @return this.
	 */
	PicoTemplate.prototype.gatherChildren = function(root){
		root = root || this.root;
		
		if(!root){
			return null;
		}
		
		this.children = Array.from(root.getElementsByClassName(this.bindClass));
		
		this.children.forEach((c) => {
			// already has the data set
			if(c.dataset[this.dataName]){
				return;
			}
			
			c.dataset[this.dataName] = c.innerHTML;
			c.innerHTML = '';
		});
		
		return this;
	};
	
	/**
	 * Run a value through the formatters-pipeline.
	 *
	 * @param val {Anything} The initial value.
	 * @param tpl {Array of String} The list of formatters to apply.
	 * @param data {Object} The full data-set (to pass to the formatter).
	 *
	 * @return The end-result of the formatting.
	 */
	PicoTemplate.prototype.processFormats = function(val, tpl, data){
		return tpl.reduce((val, tp) => {
			if(val === undefined){
				return undefined;
			}
			
			if(!this.formatters[tp]){
				return undefined;
			}
			
			const fn = this.formatters[tp];
			return fn(val, data, this);
		}, val);
	};
	
	/**
	 * Show the given data in the template.
	 *
	 * @param data {Object} The data to display. Values that are functions are
	 *        invoked with the full data-set, the child element being filled
	 *        and this, and its return value is used.
	 *
	 * @return this.
	 */
	PicoTemplate.prototype.set = function(data){
		// Iterate over the children and format & display the corresponding 
		// property if present.
		this.children.forEach((c) => {
			// split the template into prop and formatters
			const tpl = c.dataset[this.dataName].split(this.formatDelimiter).map((t) => t.trim()),
				prop = tpl[0];
			
			// data-set doesn't have property
			if(!prop || !data.hasOwnProperty(prop)){
				return;
			}
			
			// get the (initial) value
			var val = data[prop];
			if(typeof val === 'function'){
				val = val(data, c, this);
			}
			
			// run it through the formatters and display
			c.innerHTML = this.processFormats(val, tpl.slice(1), data);
		});
		
		return this;
	};
	
	/** Alias for PicoTemplate.prototype.set */
	PicoTemplate.prototype.show = PicoTemplate.prototype.set;
	
	return PicoTemplate;
});
