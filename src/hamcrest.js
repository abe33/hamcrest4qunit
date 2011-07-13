(function(window){

    var Description = function(msg)
    {
        this.message = msg ? msg : "";
        this.diff = null;
    }
    Description.prototype = {
        toString:function(){ return this.message; },
        clearMessage:function(){
            this.message = "";
            return this;
        },
        hasDiff:function()
        {
            return this.diff != null;
        },
        appendText:function( msg ){
            this.append(msg);
            return this;
        },
        appendValue:function( val ){
            
            this.append(_$("<span class='value'>$0</span>", QUnit.jsDump.parse( val ) ) );
            return this;
        },
        appendDescriptionOf:function( matcher ){
            matcher.describeTo( this );
            return this;
        },
        append:function(s) {
        
            if( this.message != "" )
                this.message += " ";
                
            this.message += s;
        }
    };
    
    var Matcher = function(o){
        for( var i in o )
            this[ i ] = o[ i ];
        
        if( !this._matches )
            throw new Error("Improperly configured matcher, the matcher expect a _matches method");
        else if( typeof this._matches != "function" )
            throw new Error("Improperly configured matcher, the _matches argument must be a function");
            
        if( !this._describeTo || typeof this._matches != "function" )
            throw new Error("Improperly configured matcher, the matcher expect a _describeTo method");
        else if( typeof this._describeTo != "function" )
            throw new Error("Improperly configured matcher, the _describeTo argument must be a function");
    }
    Matcher.prototype = {
        matches:function(v, message ){
            var expectedMsg = new Description();
            var mismatchMsg = new Description();
            
            var result = this._matches.call( this, v, mismatchMsg );
            expectedMsg.appendDescriptionOf( this );
            
            this.push( result, 
                       mismatchMsg, 
                       expectedMsg, 
                       message != null ? message : 
                          ( result ? "okay" : "failed" ) );
        },
        describeTo:function( msg ){
            this._describeTo.call( this, msg );
        },
        push:function( result, mismatchMsg, expectedMsg, message )
        {
            var details = {
                result: result,
                message: message,
            };

            var output = _$( '<span class="test-message">${message}</span>\
                              <table>\
                                  <tr class="test-expected"><th>Expected: </th><td><pre>${expectedMsg}</pre></td></tr>\
                                  ${resultMsg}\
                                  ${diffMsg}\
                              </table>', 
                            extend({
                                    'resultMsg':_$( '<tr class="test-actual"><th>$1 </th><td><pre>$0</pre></td></tr>',
                                                        mismatchMsg.message, !result ? "But:" : "And:" ),
                                    'expectedMsg':expectedMsg.message,
                                    'diffMsg':mismatchMsg.hasDiff() ? 
                                                    _$( '<tr class="test-diff"><th>Diff: </th><td><pre>$0</pre></td></tr>',
                                                        mismatchMsg.diff) : ""
                                }, 
                                details) );
            
            QUnit.log(details);
            QUnit.config.current.assertions.push({
                result: result,
                message: output,
            });
        }
    };

    var hamcrest = {
        // provides a visibility for testing purpose
        Matcher:Matcher,
        Description:Description,
        //
        _$:tokenReplace,
        
        assertThat:function()
        {
            var args = argumentsToArray( arguments );
            var msg = null;
            switch( args.length )
            {
                case 1 :
                    var v = args[0];
                    equalTo(true).matches( v );
                    break;
                case 3 : 
                    if( typeof args[2] == 'string' )
                        msg = args[2];
                case 2 : 
                    var v = args[0];
                    var m = args[1];
                    
                    if( m instanceof Matcher )
                        m.matches( v, msg );
                    else
                        equalTo(m).matches( v, msg );
                    break;
                    
                case 0 :
                    throw new Error("Empty assertion");
                default : 
                    throw new Error("Unsupported assertion");
            }
        },
        equalTo:function( m ){
            return new Matcher({
                'value':m,
                '_matches':function( v, msg ){
                
                    msg.appendText( "was ").appendValue(v);
                    if( v instanceof Array && m instanceof Array )
                    {
                        var l = v.length;
                        if( l != m.length )
                        {
                            msg.appendText("with a length of").appendValue( l );
                            return false;
                        }
                        else
                        {
                            var hasError = false;
                            
                            for(var i =0;i<l;i++)
                            {
                                if( v[i] != m[i] )
                                {
                                    if(hasError)
                                        msg.appendText("and");
                                    
                                    msg.appendText("with")
                                       .appendValue(v[i])
                                       .appendText("at index" )
                                       .appendValue(i)
                                       .appendText("instead of")
                                       .appendValue( m[i] );
                                    hasError = true;
                                }
                            }
                            if( hasError )
                                msg.diff = QUnit.diff( QUnit.jsDump.parse(m),
                                                       QUnit.jsDump.parse(v) );
                            return !hasError;   
                        }
                    }
                    if( v == this.value )
                        return true;
                    else
                    {
                        msg.diff = QUnit.diff( QUnit.jsDump.parse(m),
                                               QUnit.jsDump.parse(v) );
                        return false;
                    }
                },
                '_describeTo':function( msg ){
                    msg.appendValue(this.value);
                }
            });
        },
        not:function( m ){
            return new Matcher({
                'submatch':m,
                '_matches':function (v, msg){
                    if( this.submatch instanceof Matcher )
                        return !this.submatch._matches.call( this.submatch, v, msg );
                    else
                    {
                        msg.appendText( "was" ).appendValue(v);
                        return v != this.submatch;
                    }
                },
                '_describeTo':function(msg)
                {
                    if( this.submatch instanceof Matcher )
                    {
                        msg.appendText("not");
                        this.submatch.describeTo( msg );
                    }
                    else
                        msg.appendText("not").appendValue(this.submatch);
                }
            });
        },
        nullValue:function()
        {
            return new Matcher({
                '_matches':function(v, msg){
                    msg.appendText( "was" ).appendValue(v);
                    if( v == null )
                        return true;
                    else
                        return false;
                },
                '_describeTo':function( msg )
                {
                    msg.appendValue(null);
                }
            });
        },
        notNull:function()
        {
            return new Matcher({
                '_matches':function(v, msg){
                    msg.appendText( "was" ).appendValue(v)
                    if( v != null )
                        return true;
                    else
                        return false;
                },
                '_describeTo':function( msg )
                {
                    msg.appendText( "not").appendValue(null);
                }
            });
        },
        anything:function()
        {
            return new Matcher({
                '_matches':function(v, msg){
                    msg.appendText( "was").appendValue(v);
                    return true;
                },
                '_describeTo':function(msg){
                    msg.clearMessage().appendText("anything");
                }
            });
        },
        allOf:function()
        {
            var args = argumentsToArray(arguments);
            var matchers = [];
            var l = args.length;
            for(var i=0;i<l;i++)
            {
                var m = args[i];
                if( m instanceof Matcher )
                    matchers.push( m );
                else
                    matchers.push( equalTo( m ) );
            }
            return new Matcher({
                'matchers':matchers,
                '_matches':function(v, msg){
                    msg.appendText( "was").appendValue(v);
                    
                    var l = this.matchers.length;
                    var hasError = false;
                    for( var i=0;i<l;i++)
                    {
                        
                        var m = this.matchers[i];
                        var msgtmp = new Description();
                        var res = m._matches.call(m,v,msgtmp);
                        if(!res)
                        {
                            hasError = true;   
                        }
                    }
                    return !hasError;
                },
                '_describeTo':function(msg){
                    var l = this.matchers.length;
                    msg.appendText('(');
                    this.matchers.map(function(o,i) { 
                        var msgtmp = new Description();
                        if(i==l-1)
                            msg.appendText("and");
                        else if( i>0 )
                            msg.appendText(",");
                        
                        o.describeTo(msg);
                    });
                    msg.appendText(')');
                }
            });
        },
        anyOf:function()
        {
            var args = argumentsToArray(arguments);
            var matchers = [];
            var l = args.length;
            for(var i=0;i<l;i++)
            {
                var m = args[i];
                if( m instanceof Matcher )
                    matchers.push( m );
                else
                    matchers.push( equalTo( m ) );
            }
            return new Matcher({
                'matchers':matchers,
                '_matches':function(v, msg){
                    msg.appendText( "was ").appendValue(v);
                    var l = this.matchers.length;
                    var hasMatches = false;
                    var hasError = false;
                    for( var i=0;i<l;i++)
                    {
                        var m = this.matchers[i];
                        var msgtmp = new Description();
                        var res = m._matches.call(m,v,msgtmp);
                        if(res)
                        {
                            hasMatches = true;
                        }
                    }
                    return hasMatches;
                },
                '_describeTo':function(msg){
                    msg.appendText('(');
                    var l = this.matchers.length;
                    this.matchers.map(function(o,i) { 
                        if(i==l-1)
                            msg.appendText("or");
                        else if( i>0 )
                            msg.appendText(",");
                        
                        o.describeTo(msg);
                    });
                    msg.appendText(')');
                }
            });
        },
        both:function(m){
            return new Matcher({
                'matchA':m instanceof Matcher ? m : equalTo( m ),
                'and':function(m){
                    this.matchB = m instanceof Matcher ? m : equalTo( m );
                    return this;
                },
                '_matches':function(v,msg){
                    msg.appendText("was").appendValue(v);                
                    if( !this.matchB )
                        throw new Error("the both..and matcher require an 'and' assertion");
                    var msgtmp = new Description();
                    return this.matchA._matches.call( this.matchA, v, msgtmp) &&
                           this.matchB._matches.call( this.matchB, v, msgtmp );
                },
                '_describeTo':function(msg){
                    if( !this.matchB )
                        throw new Error("the both..and matcher require an 'and' assertion");
                        
                    msg.appendText( "both" ).appendDescriptionOf( this.matchA )
                       .appendText( "and" ).appendDescriptionOf( this.matchB );
                }
            });
        },
        either:function(m){
            return new Matcher({
                'matchA':m instanceof Matcher ? m : equalTo( m ),
                'or':function(m){
                    this.matchB = m instanceof Matcher ? m : equalTo( m );
                    return this;
                },
                '_matches':function(v,msg){
                    msg.appendText("was").appendValue(v);                
                    if( !this.matchB )
                        throw new Error("the either..or matcher require an 'or' assertion");
                    
                    var msgtmp = new Description();
                    return this.matchA._matches.call( this.matchA, v, msgtmp) ||
                           this.matchB._matches.call( this.matchB, v, msgtmp );
                },
                '_describeTo':function(msg){
                    if( !this.matchB )
                        throw new Error("the either..or matcher require an 'or' assertion");
                    
                    msg.appendText( "either" ).appendDescriptionOf( this.matchA )
                       .appendText( "or" ).appendDescriptionOf( this.matchB );
                }
            });
        },
        isA:function( type ){
            return new Matcher({
                'type':type,
                '_matches':function(v, msg){
                    msg.appendText("was").appendValue(v); 
                    return typeof v == this.type;               
                },
                '_describeTo':function(msg){
                    msg.appendText( "aeiouy".indexOf( this.type.substr(0,1) ) != -1 ? "an" : "a").appendText(this.type); 
                }
            });
        },
        nanValue:function()
        {
            return new Matcher({
                '_matches':function(v,msg){
                    msg.appendText("was").appendValue(v); 
                    return isNaN(v);               
                },
                '_describeTo':function(msg){
                    msg.appendValue( NaN ); 
                },
            });
        },
        notNan:function(){
            return new Matcher({
                '_matches':function(v,msg){
                    msg.appendText("was").appendValue(v); 
                    return !isNaN(v); 
                },
                '_describeTo':function(msg){
                    msg.appendText("not").appendValue( NaN ); 
                },
            });
        },
        between:function(a,b){
            if( isNaN(a) )
                throw new Error("a must be a valid number");
            if( isNaN(b) )
                throw new Error("b must be a valid number");
            if( a >= b )
                throw new Error("b must be a greater number than a");
            return new Matcher({
                'a':a,
                'b':b,
                'included':false,
                'inclusive':function(){
                    this.included=true;
                    return this;
                },
                '_matches':function(v,msg){
                    if( this.included )
                    {
                        if( v >= this.a && v <= this.b )
                        {
                            msg.appendText("was").appendValue(v); 
                            return true;
                        }
                        else
                        {
                            if( v < this.a )
                                msg.appendValue(v).appendText("was lower than the min value").appendValue(this.a); 
                            else
                                msg.appendValue(v).appendText("was greater than the max value").appendValue(this.b);
                            return false;
                        }
                    }
                    else
                    {
                        if( v > this.a && v < this.b )
                        {
                            msg.appendText("was").appendValue(v); 
                            return true;
                        }
                        else
                        {
                            if( v <= this.a )
                                msg.appendValue(v).appendText("was lower or equal to the min value").appendValue(this.a); 
                            else
                                msg.appendValue(v).appendText("was greater or equal to the max value").appendValue(this.b);
                            return false;
                        }
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText("a Number between").appendValue(this.a).appendText("and").appendValue(this.b);
                    if( this.included )
                        msg.appendText("inclusive");
                    else
                        msg.appendText("exclusive");
                },
            });
        },
        closeTo:function(a,b){
            if( isNaN(a) )
                throw new Error("a must be a valid number");
            if( isNaN(b) )
                throw new Error("b must be a valid number");
            return new Matcher({
                'a':a,
                'b':b,
                '_matches':function(v,msg){
            
                    // required to solve the 2 - 1.9 = 0.1000000000000009 issue
                    function decimal11(n){
                        return Math.floor( n * 10000000000 ) / 10000000000;
                    }
                    
                    var delta = decimal11(Math.abs(this.a - v));
                    
                    console.log( this.a + "-" + v + " = " + delta );
                    
                    if( delta <= this.b )
                    {
                        msg.appendText("was").appendValue( v );
                        return true;
                    } 
                    else
                    {
                        msg.appendValue(v).appendText("differed by").appendValue( delta - this.b );
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText("a Number within")
                        .appendValue(this.b)
                        .appendText("of")
                        .appendValue(this.a);
                },
            });
        },
        atLeast:function(n){
            return greaterThanOrEqualTo(n);
        },
        greaterThanOrEqualTo:function(n){
            return greaterThan(n,true);
        },
        greaterThan:function(n,b){
            if( isNaN(n) )
                throw new Error( "The comparison value must be a valid number" );
            return new Matcher({
                'n':n,
                'included':b,
                'inclusive':function(){
                    this.included = true;
                    return this;  
                },
                '_matches':function(v,msg){
                    
                    if( this.included )
                    {
                        if( v >= this.n )
                        {
                             msg.appendText("was").appendValue( v );
                             return true;
                        }
                        else
                        {
                             msg.appendValue(v)
                                .appendText("was not greater than")
                                .appendText("or equal to")
                                .appendValue(this.n);
                            return false;
                        }
                    }
                    else
                    {
                        if( v > this.n )
                        {
                             msg.appendText("was").appendValue( v );
                             return true;
                        }
                        else
                        {
                             msg.appendValue(v)
                                .appendText("was not greater than")
                                .appendValue(this.n);
                            return false;
                        }
                    }
                    
                },
                '_describeTo':function(msg){
                    msg.appendText("a Number greater than");
                    if( this.included )
                        msg.appendText("or equal to");
                    msg.appendValue( this.n );
                },
            });
        },
        atMost:function(n){
            return lowerThanOrEqualTo(n);
        },
        lowerThanOrEqualTo:function(n){
            return lowerThan(n,true);
        },
        lowerThan:function(n,b){
            if( isNaN(n) )
                throw new Error( "The comparison value must be a valid number" );
            return new Matcher({
                'n':n,
                'included':b,
                'inclusive':function(){
                    this.included = true;
                    return this;  
                },
                '_matches':function(v,msg){
                    
                    if( this.included )
                    {
                        if( v <= this.n )
                        {
                             msg.appendText("was").appendValue( v );
                             return true;
                        }
                        else
                        {
                             msg.appendValue(v)
                                .appendText("was not lower than")
                                .appendText("or equal to")
                                .appendValue(this.n);
                            return false;
                        }
                    }
                    else
                    {
                        if( v < this.n )
                        {
                             msg.appendText("was").appendValue( v );
                             return true;
                        }
                        else
                        {
                             msg.appendValue(v)
                                .appendText("was not lower than")
                                .appendValue(this.n);
                            return false;
                        }
                    }
                    
                },
                '_describeTo':function(msg){
                    msg.appendText("a Number lower than");
                    if( this.included )
                        msg.appendText("or equal to");
                    msg.appendValue( this.n );
                },
            });
        },
        arrayWithLength:function(l){
            if( isNaN(l) )
                throw new Error("length argument must be a valid number");
            if( l < 0 )
                throw new Error("length argument must be greater than or equal to 0");
                
            return new Matcher({
                'length':l,
                '_matches':function(v,msg){
                    msg.appendText("was").appendValue(v);
                    return v != null && 
                           v instanceof Array && 
                           v.length == this.length;
                },
                '_describeTo':function(msg){
                    msg.appendText("an Array with").appendValue(this.length).appendText(this.length > 0 ? "items" : "item");
                },
            });
        },
        emptyArray:function(){
            return new Matcher({
                '_matches':function(v,msg){
                    msg.appendText("was").appendValue(v);
                    return v != null && 
                           v instanceof Array && 
                           v.length == 0;
                },
                '_describeTo':function(msg){
                    msg.appendText("an empty Array");
                },
            });
        },
        array:function(){
            var args = argumentsToArray(arguments);
            var matchers = [];
            var l = args.length;
            
            if(l == 0)
                return emptyArray();
            
            for(var i=0;i<l;i++)
            {
                var m = args[i];
                if( m instanceof Matcher )
                    matchers.push(m);
                else
                    matchers.push( equalTo(m) );
            }
            
            return new Matcher({
                'matchers':matchers,
                '_matches':function(v,msg){
                    var l = this.matchers.length;
                    
                    if( v == null )
                    {
                        msg.appendText("was").appendValue(null);
                        return false;
                    }
                    else if( !( v instanceof Array) )
                    {
                        msg.appendText("was").appendValue(v);
                        return false;
                    }
                    else if( v.length != l )
                    {
                        msg.appendText("was an Array with").appendValue(v.length).appendText(v.length > 0 ? "items" : "item");
                        return false;
                    }
                    else
                    {
                        var a = this.matchers;
                        var hasError = false;
                        msg.appendText("was [");
                        v.forEach( function(o,i){ 
                            var msgtmp = new Description();
                            var res = a[i]._matches.call( a[i], o, msgtmp ); 
                            
                            if( res )
                                msg.appendValue( o );
                            else
                            {
                                msg.appendText(msgtmp.message);
                                hasError = true;
                            }
                            if( i<l-1 )
                                msg.appendText(",");
                        } );
                         msg.appendText("]");
                         
                         return !hasError;
                    }
                },
                '_describeTo':function(msg){
                    var l = this.matchers.length;
                    msg.appendText("an Array with")
                       .appendValue(l)
                       .appendText(l > 0 ? "items" : "item")
                       .appendText("like [");
                    
                    for(var i=0;i<l;i++)
                    {
                        msg.appendDescriptionOf( this.matchers[i] );
                        if( i<l-1 )
                            msg.appendText(",");
                    }
                    msg.appendText("]");
                },
            });
        },
        everyItem:function( m ){
            if( !m )
                throw new Error( "everyItem must receive an argument" );
            if( !(m instanceof Matcher) )
                m = equalTo(m);
            
            return new Matcher({
                'matcher':m,
                '_matches':function(v,msg){
                    if( v == null )
                    {
                        msg.appendText("was").appendValue(null);
                        return false;
                    }
                    else if( !( v instanceof Array) )
                    {
                        msg.appendText("was").appendValue(v);
                        return false;
                    }
                    else
                    {
                        var l = v.length;
                        for( var i = 0;i<l;i++)
                        {
                            var msgtmp = new Description();
                            if( !this.matcher._matches.call(this.matcher,v[i],msgtmp) )
                            {
                                msg.appendText( msgtmp.message ).appendText("at index").appendValue(i);
                                return false;
                            }
                        }
                        msg.appendText("was").appendValue( v );
                        return true;
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText("an Array of which every item is").appendDescriptionOf( this.matcher );
                },
            });
        },
        hasItem:function(m){
            if( !m )
                throw new Error( "hasItem must receive an argument" );
            if( !(m instanceof Matcher) )
                m = equalTo(m);
            
            return new Matcher({
                'matcher':m,
                '_matches':function(v,msg){
                    if( v == null )
                    {
                        msg.appendText("was").appendValue(null);
                        return false;
                    }
                    else if( !( v instanceof Array) )
                    {
                        msg.appendText("was").appendValue(v);
                        return false;
                    }
                    else
                    {
                        var l = v.length;
                        for( var i = 0;i<l;i++)
                        {
                            var msgtmp = new Description();
                            if( this.matcher._matches.call(this.matcher,v[i],msgtmp) )
                            {
                                msg.appendText( "was" ).appendValue(v);
                                return true;
                            }
                        }
                        msg.appendText("can't find any");
                        return false;
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText("an Array containing").appendDescriptionOf( this.matcher );
                },
            });
        },
        hasItems:function(){
            var args = argumentsToArray( arguments );
            if( args.length == 0 )
                throw new Error( "hasItems must receive at least one argument" );
            
            var matchers = [];
            var l = args.length;
            for(var i =0;i<l;i++)
            {
                var m = args[i];
                if( m instanceof Matcher )
                    matchers.push( m );
                else
                    matchers.push( equalTo( m ) );
            }
            
            return new Matcher({
                'matchers':matchers,
                '_matches':function(v,msg){
                    if( v == null )
                    {
                        msg.appendText("was").appendValue(null);
                        return false;
                    }
                    else if( !( v instanceof Array) )
                    {
                        msg.appendText("was").appendValue(v);
                        return false;
                    }
                    else
                    {
                        var l = this.matchers.length;
                        var k = v.length;
                        var gres = true;
                        var mismsg = [];
                        var msgtmp = new Description();
                        for(var i=0;i<l;i++)
                        {
                            var m = this.matchers[i];
                            var res = false;
                            for( var j =0;j<k;j++ )
                            {
                                
                                res = m._matches.call(m,v[j],msgtmp) || res;
                            }
                            if(!res)
                            {
                                var d = new Description();
                                d.appendDescriptionOf( m );
                                mismsg.push( d );
                            }
                                
                            gres = res && gres;
                        }
                        if( gres )
                            msg.appendText("was").appendValue(v);
                        else
                        {
                            if( mismsg.length == 1 )
                                msg.appendText(  "can't find" ).appendText( mismsg );
                            else
                            {
                                var l = mismsg.length;
                                msg.appendText( "can't find neither" );
                                for(var i = 0;i<l;i++)
                                {
                                    if( i == l-1 )
                                        msg.appendText( "nor" );
                                    else if( i > 0 )
                                        msg.appendText( "," );
                                    
                                    msg.appendText( mismsg[i] );
                                }
                            }
                        }
                        return gres;
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText("an Array containing");
                    var l = this.matchers.length;
                    for( var i=0;i<l;i++ )
                    {
                        var m = this.matchers[i];
                        if( i == l-1 )
                            msg.appendText( "and" );
                        else if( i>0)
                            msg.appendText( "," );
                            
                        msg.appendDescriptionOf( m );
                    }
                },
            });
        } 
        
    }// end hamcrest
    
    extend(window, hamcrest);
    window.hamcrest = hamcrest;
    
    function extend(a, b) {
        for ( var prop in b ) {
            if ( b[prop] === undefined ) {
                delete a[prop];
            } else {
                a[prop] = b[prop];
            }
        }
        return a;
    }
    function argumentsToArray( args )
    {
        var l = args.length;
        var a = [];
        for(var i=0;i<l;i++)
            a.push( args[i] );
        
        return a;
    }
    function tokenReplace( s ) 
    {
        var f;
        var args = [];
        for(var i in arguments)
        args[i] = arguments[i];

        args.shift();
        if( args.length > 0 && args[0] instanceof Object )
        {
            var kwargs = args[0];
            f = function ()
            {
                var key = arguments[ 1 ];
                return kwargs.hasOwnProperty(key) ? kwargs[ key ] : arguments[0];
            };
            s = s.replace ( /\${([^}]+)}/g, f );
            args.shift();
        }
        f = function ()
        {
            var index = parseInt ( arguments[ 1 ] );
            return index < args.length ? args[ index ] : arguments[0];
        };
        return s.replace ( /\$([0-9]+)/g, f );
    }

})(this);
