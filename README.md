basic-compat
============

lightweight jquery/zepto compatibility layer with mobile target in mind. There is no goal in being fully compatible, only stay lightweight as much as possible with mobile browsers in mind.

css selectors used native document.querySelectorAll methods so don't expect to have all sizzle expressions support here.

methods will be added as we need them but don't expect this library to cover all cases handled by jquery or zepto. If your need feet this library use it if you need more just go for zepto or jquery.

bug reports and proposals are welcome.

currently implemented methods are:

 - $.ready or $(function(){})
 - $.extend
 - $.each
 - $.Event
 - $.isArray
 - $.isObject
 - $.isFunction
 - $.isNumeric
 - $.isEmptyObject
 - $.isPlainObject
 - $.isDomNode
 - $.isDomElmt
 - each
 - on
 - off
 - trigger
 - css (don't support .css( propertyName, function(index, value) ) or any compatibility as on opacity or other stuffs)
 - attr
 - removeAttr
 - prop
 - html
 - remove
 - find
 - hasClass
 - addClass
 - removeClass
 - toggleClass
 - hide
 - show
 - toggle
 - is
 - filter
 - not
 - closest (no support for context)
 - append/appendTo

