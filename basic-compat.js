/**
* minimal jquery/zepto compatibility layer
* be aware that won't mimic jquery/zepto at all but offer a similar api for basic stuffs as querySelectorAll and addEventListener ...
* @author jgotti at modedemploi dot fr for agence-modedemploi.com
* @licence Dual licence LGPL / MIT
* @changelog
*            - 2013-03-25 - now can work together with other $ library if basicCompatExportName is previously defined
*            - 2013-03-01 - bugcorrections in prop and toggleClass
*            - 2013-01-30 - add append/appendTo + support for $(htmlString)
*            - 2013-01-29 - big correction in not
*            - 2013-01-23 - add scoping to selectors to react more like jquery
*                         - better performance in selectors
*            - 2013-01-21 - add removeAttr and support for plainObject and function as value for attr method
*                         - bug correction in extend regarding arrays properties
*            - 2013-01-18 - add isArray/isFunction/isNumeric/isObject/isEmptyObject/isPlainObject/filter/not methods
*                         - is/filter/not may now use selector, domElement, function or collection to match against
*                         - first attempt for adding selectors and namespaces supports to on and off methods
*            - 2012-12-11 - add hasClass/addClass/removeClass/toggleClass/hide/show/toggle/is/closest methods
*            - 2012-12-07 - add css/attr/prop/html/remove/find methods
*            - 2012-11-28 - more jquery like syntax and some events related stuffs
*/
(function(exportName){
	"use strict";
	/*jshint expr:true*/
if( (! window.$) || exportName !== '$' ){
	/**
	* can be used as querySelectorAll (selector as first parameter and optionaly domElement used as context passed as second parameter )
	* or if first parameter is a function just a shorthand of $.ready
	*/
	var $ = function(selector,context){ // not supporting IE
		if( isFunction(selector) ){
			return $.ready(selector);
		}
		var c;
		if( selector === window || selector===document || isDomElmt(selector) ){
			c = [selector];
		}else if( isArray(selector) ){
			c = selector;
		}else	if(! isArray(context) ){
			if( ((! context )|| (context.nodeType === 9)) && idExp.test(selector) ){
				c = [(context||document).getElementById(selector.substr(1))];
				c[0] === null && (c=[]);
			}else if( classExp.test(selector)){
				c = slice((context||document).getElementsByClassName(selector.substr(1)));
			}else if( tagExp.test(selector) ){
				c = slice((context||document).getElementsByTagName(selector));
			}else if( htmlExp.test(selector)){
				c = fragment(selector);
			}else{
				context && (context === window || context.document) && (context = context.document);
				var scope = '';
				//scope context if required
				context && selector.match(/(^\s*[:>]|\S\s+\S)/) && (scope = '#'+(context.id || (context.id=bcScopeId))+' ');
				c = slice((context||document).querySelectorAll(scope+selector));
				scope && context.id===bcScopeId && (context.id=null);
			}
		}else{
			c = [];
			$.each(context,function(k,v){
				$(selector,v).each(function(k,v){
					c.push(v);
				});
			});
		}
		c.hasOwnProperty('each') || $.each($.fn,function(k,v){
			c[k] = v;
		});
		return c;
	};
	/**
	 * take a callback to execute when dom is ready
	 */
	$.ready = function(cb){ // not supporting IE
		if(document.readyState.match(/complete|loaded|interactive/)){
			setTimeout(cb,0);
		}else{
			document.addEventListener('DOMContentLoaded', function(){ setTimeout(cb,0);}, false);
		}
		return this;
	};
	/**
	 * first parameter is destination object to extend or boolean forcing deep extension.
	 * all others parameters are object to copy property from to destination object
	 */
	$.extend = function(){
		var A=arguments
			, deepPassed = typeof A[0] === 'boolean' ? true : false
			, deep = deepPassed ? A[0] : false
			, dest =  A[deepPassed?1:0]
			, a = deepPassed?2:1
			, al = A.length
			, p
		;
		if( a ===2 ){
			dest = A[1];
		}
		for(;a<al;a++){
			if( A[a] == null ){ continue; }
			for(p in A[a]){
				if( A[a][p] === Undef || A[a][p]===dest || (!A[a].hasOwnProperty(p))){
					continue;
				}
				if( deep && typeof(A[a][p]) === 'object' ){
					dest[p] = dest[p] || (isArray(A[a][p])?[] : {});
					$.extend(deep,dest[p],A[a][p]);
				}else{
					dest[p] = A[a][p];
				}
			}
		}
		return dest;
	};
	/**
	 * iterate over collection using a given callback (cb)
	 */
	$.each = function(collection, cb){
		var i,l,key;
		if( isArray(collection) || (collection instanceof NodeList) ) {
			for(i=0,l=collection.length; i<l;i++){
				if(cb.call(collection[i], i, collection[i]) === false){
					return collection;
				}
			}
		}else{
			for(key in collection){
				if(collection.hasOwnProperty(key) && cb.call(collection[key],key,collection[key]) === false){
					return collection;
				}
			}
		}
		return collection;
	};

	$.Event=function(type,props){
		var event = document.createEvent(type.match(/^(click|mousedown|mouseup|mousemove)$/) ? 'MouseEvents':'Events');
		props && $.extend(event,props);
		event.initEvent(type, (props && props.bubbles===false)?false:true, true, null, null, null, null, null, null, null, null, null, null, null, null);
		return event;
	};

	// some internal helpers
	var dfltDisplays={}
		,Undef // undefined pointer
		,handlers={elmts:{},handlers:{}}
		,_uid=0
		,uid=function(o){ return o._uid || (o._uid=++_uid); }
		,bcScopeId = 'bcScopeSelectorId'
		,addEvent = (window.document.addEventListener ? function(type, e, cb){ e.addEventListener(type, cb, false);} : function(type, e, cb){ e.attachEvent('on' + type, cb);} )
		,removeEvent = (window.document.removeEventListener ? function(type, e, cb){ e.removeEventListener(type, cb, false); }  : function(type, e, cb){ e.detachEvent('on' + type, cb);} )
		,on=function(type,elmt,cb,selector){
			$.each(type.split(/\s+/),function(k,type){
				var parts = type.split('.'), hid=uid(cb);
				handlers.handlers[hid] = cb;
				(handlers.elmts[uid(elmt)] || (handlers.elmts[uid(elmt)]=[])).push({
					ns:parts.length<2?Undef:parts.slice(1).sort().join(' ')
					,type:parts[0]
					,handler:hid
					,s:selector||Undef
				});
				addEvent(parts[0],elmt,cb);
			});
		}
		,off=function(type,elmt,cb,selector){
			$.each(type.split(/\s+/),function(k,type){
				var parts = type.split('.'), hid=cb?uid(cb):Undef,ns=parts.slice(2).sort().join(' ');
				type=parts[0];
				if(! handlers.elmts[uid(elmt)]){
					return;
				}
				for(var eid=uid(elmt), i=handlers.elmts[eid].length,hdef,unused;~--i;){/*jshint laxbreak:true*/
					hdef = handlers.elmts[eid][i];
					(!type || hdef.type===type)
					&& (!selector || hdef.s===selector)
					&& (!hid || hdef.handler===hid)
					&& (!ns || (hdef.ns && hdef.ns.match(new RegExp('(^| )'+ns+'( |$)'))))
					&& ( removeEvent(hdef.type,elmt,handlers.handlers[hdef.handler]) || handlers.elmts[eid].splice(i,1) );
					unused = true;
					$.each(handlers.elmts,function(eid,eHandlers){
						$.each(eHandlers,function(k,hDef){
							if( hDef.handler === hdef.handler ){
								return (unused=false);
							}
						});
						return unused;
					});
					unused && delete handlers.handlers[hdef.handler];
				}
			});
		}
		,ok=function(){return true;}
		,nok=function(){return false;}
		,hasClass = function (elmt,className){ return ( 'className' in elmt && elmt.className.match(new RegExp('(^|\\s)'+className+'($|\\s)')) ) ? true : false; }
		,getComputed = function (elmt,propName){ return ( window.getComputedStyle && window.getComputedStyle(elmt,null).getPropertyValue(propName) );}
		,matchSelector = function(elmt,selector){
			var fn = elmt.webkitMatchesSelector || elmt.mozMatchesSelector || elmt.oMatchesSelector || elmt.matchesSelector;
			return fn ? fn.call(elmt,selector) : !!~ $(selector,elmt.parentNode).indexOf(elmt);
		}
		,matchFunction = function(elmt,fn,k){ return fn.call(elmt,k); }
		,matchCollection = function(elmt,collection){ return !!~collection.indexOf(elmt); }
		,getMatchFn = function(selector){ var sType = typeof selector; return sType === 'string' ? matchSelector : (sType ==='function' ? matchFunction : matchCollection ); }
		,isArray = $.isArray = function(a){ return a instanceof Array;}
		,isObject = $.isObject = function(o){ return typeof o === 'object';}
		,isFunction = $.isFunction = function(f){ return f instanceof Function;}
		,isNumeric = $.isNumeric = function(n){ return !isNaN( parseFloat(n) ) && isFinite(n);} // from jquery source code
		,isEmptyObject = $.isEmptyObject = function(o){ var res=true; $.each(o,function(){ return (res=false);}); return res;}
		,isPlainObject = $.isPlainObject = function(o){
			if((! (o instanceof Object) ) || o.nodeType || (o.window && o.window===o) ){
				return false;
			}
			try{
				if( o.constructor.prototype.hasOwnProperty( "isPrototypeOf" ) ){
					return true;
				}
			}catch(e){}
			return false;
		}
		,isDomNode = $.isDomNode = function(n){ return (isObject(n) && n.nodeType); }
		,isDomElmt = $.isDomElmt = function(n){ return (isDomNode(n) && n.nodeType===1); }
		,classExp =  /^\s*\.([a-z0-9-]+)\s*$/i
		,idExp =  /^\s*#([a-z0-9-]+)\s*$/i
		,tagExp =  /^\s*([a-z]+)\s*$/i
		,htmlExp = /<(?:!|\w)+/
		,slice = function(v){ return [].slice.call(v,0); }
		,fragment=function(htmlStr){
			var f = document.createDocumentFragment().appendChild(document.createElement('div'))
				, firstTagName = htmlStr.match(/<(\w+)/)
				, wrapper=''
			;
			//-- check for specific wrapper
			firstTagName && (firstTagName=firstTagName[1]).toLowerCase();
			if( firstTagName ){
				if( firstTagName.match(/^(thead|tfoot|tbody|caption|colgroup|col)$/) ){
					wrapper= "<table>";
				}else if(firstTagName==='tr'){
					wrapper= "<table><tbody>";
				}else if(firstTagName.match(/^t[hd]/) ){
					wrapper= "<table><tbody><tr>";
				}else if(firstTagName==='option'){
					wrapper= "<select>";
				}
			}
			f.innerHTML = wrapper+htmlStr+wrapper.replace(/</g,'</');
			if( wrapper ){
				wrapper = wrapper.match(/</g);
				wrapper = wrapper ? wrapper.length:0;
				for(;wrapper--;f=f.childNodes[0]);
			}
			return slice(f.childNodes);
		}
	;
	$.fn = {
		each:function(cb){ $.each(this,cb); return this; }
		,on:function(types,selector,data,handler){
			var a = arguments,al=a.length,cb;
			handler || (handler = a[al-1]);
			if(al === 2 ){
				selector = data = Undef ;
			}else if(al === 3 ){
				if( isObject(selector) ){
					data=selector; data=Undef;
				}else{
					data=Undef;
				}
			}
			cb = (selector || data) ? function(e){ if( selector===Undef || $(e.target).is(selector) ){ data && (e.data = data); return handler.call(e.target,e); } } : handler ;
			return $.each(this,function(k,elmt){
				on(types,elmt,cb,selector);
			});
		}
		,off:function(types,selector,handler){
			if((! handler) && isFunction(selector) ){
				handler=selector; selector=Undef;
			}
			return $.each(this,function(k,elmt){ off(types,elmt,handler,selector); });
		}
		,trigger:function(event, data){
			if( typeof event === 'string' ){
				event = $.Event(event);
			}
			data && (event.data = data);
			return $.each(this,function(k,v){
				if( 'dispatchEvent' in v){ v.dispatchEvent(event);}
			});
		}
		,css:function(propName,value){ // don't support .css( propertyName, function(index, value) ) or any compatibility as on opacity or other stuffs
			if( isObject(propName) ){
				var collection = this;
				$.each(propName,function(name,val){
					collection.css(name,val);
				});
				return this;
			}
			if( propName.match(/[A-Z]/) ){ // @todo this part need review
				propName = propName.replace(/([A-Z])/g,'-$1');
			}
			var camelCasedPropName = propName.replace(/-([a-z])/g,function(m,l){ return l.toUpperCase();});
			if( value === Undef){
				return this[0].style[camelCasedPropName] || getComputed(this[0],propName);
			}
			return $.each(this,function(k,v){
				v.style[camelCasedPropName]=value;
			});
		}
		,attr:function(attrName,value){
			if( isPlainObject(attrName) ){
				var self = this;
				$.each(attrName,function(k,v){
					self.attr(k,v);
				});
				return this;
			}
			if( value === Undef){
				var res = this[0].getAttribute(attrName);
				return ((! res ) && attrName in this[0]) ? this[0][attrName]:res;
			}
			return $.each(this,function(k,v){
				if( isFunction(value)){
					(attrName in v) ? (v[attrName] = value.call(v,k,v[attrName])) : v.setAttribute(attrName,value.call(v,k,v.getAttribute(attrName)));
				}else if( attrName in v ){
					v[attrName] = value;
				}else{
					value ? v.setAttribute(attrName,value) : v.removeAttribute(attrName);
				}
			});
		}
		,removeAttr:function(attrName){ return this.attr(attrName,'');}
		,prop:function(propName,value){
			return value===Undef?(this[0] && this[0][propName]) : $.each(this,function(k,v){ v[propName] = value;});
		}
		,html:function(html){
			return html===Undef?this[0][isDomElmt(this[0])?'innerHTML':'value'] : $.each(this,function(k,elmt){ elmt[isDomElmt(elmt)? 'innerHTML' : 'value']=html;});
		}
		,remove:function(){
			return $.each(this,function(){ this.parentNode && this.parentNode.removeChild(this);});
		}
		,find:function(selector){
			var res = [];
			$(selector,this).each(function(){
				res.push(this);
			});
			return $(res);
		}
		,hasClass:function(className){
			var res=false;
			$.each(this,function(){
				if( hasClass(this,className) ){
					return !(res = true);
				}
			});
			return res;
		}
		,addClass:function(className){
			className = className.split(/\s+/);
			return $.each(this,function(k,elmt){
				$.each(className,function(){
					hasClass(elmt,this) || (elmt.className += (elmt.className.length?' ':'')+this);
				});
			});
		}
		,removeClass:function(className){
			var exp = new RegExp('(^|\\s)('+className.replace(/\s+/g,'|')+')($|\\s)','g')
				, replace=function(m,a,className,b){ return a===b?' ':'';}
			;
			return $.each(this,function(){
				this.className = this.className.replace(exp,replace);
			});
		}
		,toggleClass:function(className,addOrRemove){
			addOrRemove = (addOrRemove===Undef) ? hasClass : (addOrRemove?nok:ok);
			className = className.split(/\s+/);
			return $.each(this,function(k,elmt){
				$.each(className,function(){
					$(elmt)[ addOrRemove(elmt,this)?'removeClass':'addClass' ](this);
				});
			});
		}
		,hide:function(){
			return $.each(this,function(){
				var e=$(this), curDisplay = e.css('display');
				if( curDisplay === 'none' ){
					return;
				}
				this.setAttribute('data-bc-oldisplay',curDisplay);
				e.css('display','none');
			});
		}
		,show:function(){
			return $.each(this,function(){
				this.style.display = null;
				if( getComputed(this,'display') === 'none' ){
					this.style.display = this.getAttribute('data-bc-olddisplay') || (function(e){
						if(! dfltDisplays[e.nodeName]){
							var d = document.createElement(e.nodeName),b = document.body;
							b.appendChild(d);
							dfltDisplays[e.nodeName] = getComputed(d,'display');
							dfltDisplays[e.nodeName] === 'none' && (dfltDisplays[e.nodeName] = 'block');
							b.removeChild(d);
						}
						return dfltDisplays[e.nodeName];
					})(this);
				}
			});
		}
		,toggle:function(showOrHide){
			showOrHide = (showOrHide===Undef)?function(e){ return e.css('display')==='none';}:(showOrHide?ok:nok);
			return $.each(this,function(){
				var e = $(this); e[showOrHide(e)?'show':'hide']();
			});
		}
		,is:function(selector){ // selector may be a string, a function(index), a Dom node or collection
			if( isDomNode(selector) ){ // match against a node
				return !!~this.indexOf(selector);
			}
			var res = false ,testFn = getMatchFn(selector);
			$.each(this,function(k,elmt){
				if(testFn(elmt,selector,k)){
					return ! (res = true);
				}
			});
			return res;
		}
		,filter:function(filter){
			if( isDomNode(filter) ){
				return $(~this.indexOf(filter)?filter:[]);
			}
			var res = [],testFn = getMatchFn(filter);
			$.each(this,function(k,elmt){
				testFn(elmt,filter,k) && res.push(elmt);
			});
			return $(res);
		}
		,not:function(selector){
			if( isDomNode(selector) ){
				return  $( ~this.indexOf(selector)?[]:selector);
			}
			var res = [],testFn = getMatchFn(selector);
			$.each(this,function(k,elmt){
				testFn(elmt,selector,k) || res.push(elmt);
			});
			return $(res);
		}
		,closest:function(selector){ // no context support
			var res=[];
			$.each(this,function(k,node){
				do{
					if( $(node).is(selector) ){
						return ! res.push(node);
					}
				}while(node = node.parentNode);
			});
			return $(res);
		}
		,append:function(content){
			var self = this,a=arguments;
			a.length > 1 && (content = slice(a));
			if( isArray(content) ){
				$.each(content,function(k,v){ self.append(v); });
				return self;
			}
			if( isFunction(content) ){
				return $.each(this,function(k,v){
					isDomElmt(v) && $(v).append(content.call(v,k,v.innerHTML));
				});
			}
			if( typeof content === 'string' ){
				return this.append(fragment(content));
			}
			if( isDomNode(content) ){
				return $.each(this,function(k,v){
					v.appendChild(k?content.cloneNode(true):content);
				});
			}
			return this;
		}
		,appendTo:function(target){
			$(target).append(this);
			return this;
		}
	};
	window[exportName] = $;
}})(typeof(basicCompatExportName) !== 'undefined' ? basicCompatExportName : '$');
