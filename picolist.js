(function(root, factory){
	if(typeof define !== 'undefined' && define.amd){
		define(['PicoInput'], factory);
	}else if(typeof module !== 'undefined'){
		module.exports = factory(require('PicoInput'));
	}else{
		root.PicoList = factory(root.PicoInput);
	}
})(this, function(PicoInput){
	"use strict";
	
	function PicoList(opt){
		/** @var root {Element} The root element */
		this.root = opt.root || opt.elm || opt.element || null;
		/** @var dataName {String} Name of the dataset-key */
		this.dataName = opt.name || opt.dataName || 'pico';
		/** @var bindClass {String} Class-name to find bindable-elements with */
		this.bindClass = opt.class || opt.cls || opt.bindClass;
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
	
	PicoList.prototype.gatherChildren = function(root){
		root = root || this.root;
		
		if(!root){
			return null;
		}
		
		this.children = Array.from(root.getElementsByClassName(this.bindClass));
		
		return this;
	};
	
	return PicoList;
});