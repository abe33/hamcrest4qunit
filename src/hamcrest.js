/**
 ***** BEGIN LICENSE BLOCK *****
 Version: MPL 1.1
 
 The contents of this file are subject to the Mozilla Public License Version 
 1.1 (the "License"); you may not use this file except in compliance with 
 the License. You may obtain a copy of the License at 
 http://www.mozilla.org/MPL/
 
 Software distributed under the License is distributed on an "AS IS" basis,
 WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 for the specific language governing rights and limitations under the
 License.
 
 All Rights Reserved.
 
 Author(s):Cédric Néhémie
 
 ***** END LICENSE BLOCK *****
*/
(function(window){

    function Description(msg)
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
        appendRawValue:function( val ){
            
            this.append(_$("<span class='value'>$0</span>", val ) );
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
    
    function Matcher(o){
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
        matches:function(v, mismatchMsg ){
            return this._matches.call( this, v, mismatchMsg );;
        },
        describeTo:function( msg ){
            this._describeTo.call( this, msg );
        }
    };
    
    var hamcrest = {
        // provides a visibility for testing purpose
        Matcher:Matcher,
        Description:Description,
        nodeToString:nodeToString,
        escapeHtml:escapeHtml,
        //
        _$:tokenReplace,
/*---------------------------------------------------------------
    ASSERT THAT
 *---------------------------------------------------------------*/
        assertThat:function()
        {
            var args = argumentsToArray( arguments );
            var message = null;
            var matcher = null;
            var v = null;
            var expectedMsg = new Description();
            var mismatchMsg = new Description();
            switch( args.length )
            {
                case 1 :
                    v = args[0];
                    matcher = equalTo(true);
                    break;
                case 3 : 
                    if( typeof args[2] == 'string' )
                        message = args[2];
                case 2 : 
                    v = args[0];
                    var m = args[1];
                    if( m instanceof Matcher )
                        matcher = m
                    else
                        matcher = equalTo(m);
                    break;
                case 0 :
                    throw new Error("Empty assertion");
                default : 
                    throw new Error("Unsupported assertion");
            }
            
            expectedMsg.appendDescriptionOf( matcher );
            var result = matcher.matches( v, mismatchMsg );
            
            hamcrest.push( result, 
                       mismatchMsg, 
                       expectedMsg, 
                       message != null ? message : 
                          ( result ? "okay" : "failed" ) );
        },
        push:function( result, mismatchMsg, expectedMsg, message )
        {
            var details = {
                result: result,
                message: message
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
                message: output
            });
        },
/*---------------------------------------------------------------
    CORE MATCHERS
 *---------------------------------------------------------------*/
        equalTo:function( m ){
            return new Matcher({
                'value':m,
                '_matches':function( v, msg ){
                
                    msg.appendText( "was").appendValue(v);
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
                        return !this.submatch.matches( v, msg );
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
        notNullValue:function()
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
        isA:function( type ){
            return new Matcher({
                'type':type,
                '_matches':function(v, msg){
                    msg.appendText("was").appendValue(v); 
                    return typeof v == this.type;               
                },
                '_describeTo':function(msg){
                    msg.appendText( aPrefix( this.type ) ).appendRawValue(this.type); 
                }
            });
        },
        describedAs:function( m, t ){
            if( m == null || !(m instanceof Matcher))
                throw "describedAs first argument must be a valid Matcher instance";
            else if( t == null || typeof t != "string" )
                throw "describedAs second argument must be a valid string";
        
            var extraArgs = argumentsToArray( arguments );
            extraArgs.shift();
            extraArgs.shift();
            
            return new Matcher({
                'description':t,
                'matcher':m,
                'extraArgs':extraArgs,
                '_matches':function(v,msg){
                    return this.matcher.matches(v,msg);
                },
                '_describeTo':function(msg){
                    msg.appendText( _$.apply( null, [ this.description ].concat( extraArgs ) ) );
                }
            });
        },
/*---------------------------------------------------------------
    COMPOUND MATCHERS
 *---------------------------------------------------------------*/
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
                        var res = m.matches(v,msgtmp);
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
                        var res = m.matches(v,msgtmp);
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
                    if( !this.matchB )
                        throw new Error("the both..and matcher require an 'and' assertion");
                    var msgtmp1 = new Description();
                    var msgtmp2 = new Description();
                    
                    var res1 = this.matchA.matches( v, msgtmp1 );
                    var res2 = this.matchB.matches( v, msgtmp2 );
                    
                    if( res1 && res2 )
                        msg.appendText( "was" ).appendValue( v );
                    else
                    {
                        if( !res1 )
                            msg.appendText( msgtmp1 );
                        
                        if( !res1 && !res2 )
                            msg.appendText("and");
                        
                        if( !res2 )
                            msg.appendText( msgtmp2 );
                    }
                    
                    return res1 && res2;
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
                    return this.matchA.matches( v, msgtmp) ||
                           this.matchB.matches( v, msgtmp );
                },
                '_describeTo':function(msg){
                    if( !this.matchB )
                        throw new Error("the either..or matcher require an 'or' assertion");
                    
                    msg.appendText( "either" ).appendDescriptionOf( this.matchA )
                       .appendText( "or" ).appendDescriptionOf( this.matchB );
                }
            });
        },
/*---------------------------------------------------------------
    NUMBER MATCHERS
 *---------------------------------------------------------------*/
        nanValue:function()
        {
            return new Matcher({
                '_matches':function(v,msg){
                    msg.appendText("was").appendValue(v); 
                    return isNaN(v);               
                },
                '_describeTo':function(msg){
                    msg.appendValue( NaN ); 
                }
            });
        },
        notNanValue:function(){
            return new Matcher({
                '_matches':function(v,msg){
                    msg.appendText("was").appendValue(v); 
                    return !isNaN(v); 
                },
                '_describeTo':function(msg){
                    msg.appendText("not").appendValue( NaN ); 
                }
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
                }
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
                }
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
                }
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
                }
            });
        },
/*---------------------------------------------------------------
    ARRAY MATCHERS
 *---------------------------------------------------------------*/
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
                    msg.appendText("an Array with").appendValue(this.length).appendText(this.length > 1 ? "items" : "item");
                }
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
                }
            });
        },
        array:function(){
            var args = argumentsToArray(arguments);
            var matchers = [];
            var l = args.length;
            
            if(l == 0) {
                return emptyArray();
            }
            for(var i=0;i<l;i++)
            {
                var m = args[i];
                if( m instanceof Matcher ) {
                    matchers.push(m);
                }
                else {
                    matchers.push( equalTo(m) );
                }
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
                        msg.appendText("was an Array with").appendValue(v.length).appendText(v.length > 1 ? "items" : "item");
                        return false;
                    }
                    else
                    {
                        var a = this.matchers;
                        var hasError = false;
                        msg.appendText("was").appendRawValue("[").appendText("\n");
                        v.forEach( function(o,i){ 
                            var msgtmp = new Description();
                            var res = a[i].matches( o, msgtmp ); 
                            msg.appendText("  ");
                            if( res ) {
                                msg.appendValue( o );
                            }
                            else {
                                msg.appendText(msgtmp.message);
                                hasError = true;
                            }
                            if( i<l-1 ) {
                                msg.appendText(",\n");
                            }
                        } );
                         msg.appendRawValue("\n]");
                         
                         return !hasError;
                    }
                },
                '_describeTo':function(msg){
                    var l = this.matchers.length;
                    msg.appendText("an Array with")
                       .appendValue(l)
                       .appendText(l > 1 ? "items" : "item")
                       .appendText("like").appendRawValue("[").appendText("\n   ");
                    
                    for(var i=0;i<l;i++)
                    {
                        msg.appendDescriptionOf( this.matchers[i] );
                        if( i<l-1 ) {
                            msg.appendText(",\n   ");
                        }
                    }
                    msg.appendRawValue("\n]");
                }
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
                            if( !this.matcher.matches(v[i],msgtmp) )
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
                }
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
                            if( this.matcher.matches(v[i],msgtmp) )
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
                }
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
                                
                                res = m.matches(v[j],msgtmp) || res;
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
                }
            });
        },
/*---------------------------------------------------------------
    STRING MATCHERS
 *---------------------------------------------------------------*/
        startsWith:function(s){
            if( !s )
                throw new Error("startsWith must receive an argument");
        
            return new Matcher({
                'start':s,
                '_matches':function(v,msg){
                    msg.appendText("was").appendValue( v );
                    if( v == null || typeof v != "string" )
                        return false;
                    else
                        return v.indexOf( this.start ) == 0;
                },
                '_describeTo':function(msg){
                    msg.appendText("a String starting with").appendValue( this.start );
                }
            });
        },
        endsWith:function(s){
            if( !s )
                throw new Error("endsWith must receive an argument");
            
            return new Matcher({
                'end':s,
                '_matches':function(v,msg){
                    msg.appendText("was").appendValue( v );
                    if( v == null || typeof v != "string" )
                        return false;
                    else
                        return v.indexOf( this.end ) == v.length - this.end.length;
                },
                '_describeTo':function(msg){
                    msg.appendText("a String ending with").appendValue( this.end );
                }
            });
        },
        contains:function(s){
            if( !s )
                throw new Error("endsWith must receive an argument");
            
            return new Matcher({
                'search':s,
                '_matches':function(v,msg){
                    msg.appendText("was").appendValue( v );
                    if( v == null || typeof v != "string" )
                        return false;
                    else
                        return v.indexOf( this.search ) != -1;
                },
                '_describeTo':function(msg){
                    msg.appendText("a String containing").appendValue( this.search );
                }
            });
        },
        stringWithLength:function(l){
            
            if( isNaN(l) )
                throw new Error("length argument must be a valid number");
            if( l < 0 )
                throw new Error("length argument must be greater than or equal to 0");
            
            if( l == 0 )
                return emptyString();
            
            return new Matcher({
                'length':l,
                '_matches':function(v,msg){
                    if( v == null )
                    {
                        msg.appendText("was").appendValue( v );
                        return false;
                    }
                    else if( typeof v != "string" )
                    {
                        msg.appendText("was").appendValue( v );
                        return false;
                    }
                    else
                    {
                        if( v.length == this.length )
                        {
                            msg.appendText("was").appendValue( v );
                            return true;
                        }
                        else
                        {
                            msg.appendValue( v ).appendText("is a String of length").appendValue( v.length );
                            return false;
                        }
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText("a String with a length of").appendValue(this.length);
                }
            });
        },
        emptyString:function(){
            return new Matcher({
                '_matches':function(v,msg){
                   
                    if( v == null )
                    {
                        msg.appendText("was").appendValue( v );
                        return false;
                    }
                    else if( typeof v != "string" )
                    {
                        msg.appendText("was").appendValue( v );
                        return false;
                    }
                    else
                    {
                        if( v.length == 0 )
                        {
                            msg.appendText("was").appendValue( v );
                            return true;
                        }
                        else
                        {
                            msg.appendValue( v ).appendText("is a String of length").appendValue( v.length );
                            return false;
                        }
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText("an empty String");
                }
            });
        },
        matchRe:function(re){
            if( !re )
                throw new Error("the re argument cannot be null");
            if( !(re instanceof RegExp) && typeof re != "string" )
                throw new Error("the re argument must be a regexp or a string");
            
            if( typeof re == "string" )
                re = new RegExp( re, "gi" );
                
            return new Matcher({
                're':re,
                '_matches':function(v,msg){
                    msg.appendText("was").appendValue( v );
                    if( v == null || typeof v != "string" )
                        return false;
                    else 
                        return this.re.exec( v );
                },
                '_describeTo':function(msg){
                    msg.appendText( "a String which match" ).appendRawValue( String(this.re) );
                }
            });
        },
/*---------------------------------------------------------------
    OBJECT MATCHERS
 *---------------------------------------------------------------*/
        strictlyEqualTo:function(m){
            return new Matcher({
                'value':m,
                '_matches':function( v, msg ){
                
                    msg.appendText( "was ").appendValue(v);
                    if( v === this.value )
                        return true;
                    else
                    {
                        msg.diff = QUnit.diff( QUnit.jsDump.parse(m),
                                               QUnit.jsDump.parse(v) );
                        return false;
                    }
                },
                '_describeTo':function( msg ){
                    msg.appendText("a value strictly equal to").appendValue(this.value);
                }
            });
        },
        hasProperty:function(p,v){
            if( !p )
                throw new Error( "hasProperty must have at least a property name" );
            if( v != null && !(v instanceof Matcher) )
                v = equalTo(v);
            
            return new Matcher({
                'property':p,
                'value':v,
                '_matches':function(v,msg){
                    if( v == null || typeof v != "object" )
                    {
                        msg.appendText( "was" ).appendValue(v);
                        return false;
                    }
                    else if( !v.hasOwnProperty(this.property) )
                    {
                        msg.appendValue( v ).appendText( "don't have a property named" ).appendRawValue(this.property);
                        return false;
                    }
                    else if( this.value != null )
                    {
                        var msgtmp = new Description();
                        var res = this.value.matches(v[this.property],msgtmp);
                        
                        if( res )
                        {
                            msg.appendText( "was" ).appendValue(v);
                        }
                        else
                        {
                            msg.appendText(msgtmp);
                            msg.diff = msgtmp.diff;
                        }
                        return res; 
                    }
                    else
                    {
                        msg.appendText( "was" ).appendValue(v);
                        return true;
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText( "an Object with a property" ).appendRawValue(this.property);
                    if( this.value != null )
                        msg.appendText( "of which value is" ).appendDescriptionOf(this.value);
                }
            });
        },
        hasProperties:function( kwargs ){
            if( !kwargs )
                throw new Error("the hasProperties kwargs arguments is mandatory");
            
            for( var i in kwargs )
                if( !( kwargs[i] instanceof Matcher ) )
                    kwargs[i] = equalTo( kwargs[i] );
            
            return new Matcher({
                'kwargs':kwargs,
                '_matches':function(v,msg){
                    if( v == null || typeof v != "object" )
                    {
                        msg.appendText("was").appendValue(v);
                        return false;
                    }
                    else
                    {
                        var hasError = false;
                        for( var p in this.kwargs )
                        {
                            var m = this.kwargs[p];
                            if( !v.hasOwnProperty( p ) )
                            {
                                if( hasError )
                                    msg.appendText(",");
                                
                                msg.appendRawValue(p).appendText('was not defined');
                                hasError = true;
                            }
                            else
                            {
                                var val = v[p];
                                var msgtmp = new Description();
                                if( !m.matches(val,msgtmp) )
                                {
                                    if( hasError )
                                        msg.appendText(",");
                                    
                                   msg.appendRawValue(p).appendText(':').appendText(msgtmp);
                                   hasError = true; 
                                }
                            }
                        }
                        if( !hasError )
                            msg.appendText("was").appendValue(v);
                        return !hasError;
                    }
                },
                '_describeTo':function(msg){
                    var props = sortProperties( this.kwargs );
                    var l = props.length;
                    msg.appendText( "an Object which has properties");
                    for( var i=0;i<l;i++ )
                    {
                        var p = props[i];
                        var m = this.kwargs[p];
                        if( i == l-1 )
                            msg.appendText("and");
                        else if(i>0)
                            msg.appendText(",");
                            
                        
                        msg.appendRawValue(p).appendText(":").appendDescriptionOf( m );
                    }                                
                }
            });
        },
        hasMethod:function( f, r, a, t ){
            if( !f || typeof f != "string")
                throw new Error("hasMethod expect a function name");
            
            if( r != null && !(r instanceof Matcher ) )
                r = equalTo( r );
            
            
            return new Matcher({
                'method':f, 
                'returnsMatcher':r,
                'throwsMatcher':t,
                'checkThrows':false,
                'noArgs':false,
                'arguments':a,
                'returns':function( m ){
                    if( m != null && !(m instanceof Matcher ) )
                    m = equalTo( m );
                    
                    this.returnsMatcher = m;
                    return this;
                },
                'withoutArgs':function(){ 
                    this.noArgs = true; 
                    return this; 
                },
                'withArgs':function(){
                    this.arguments = argumentsToArray( arguments );
                    return this;
                },
                'throwsError':function(m){
                    if( m && !(m instanceof Matcher) )
                        m = equalTo( m );
                        
                    this.throwsMatcher = m;
                    this.checkThrows = true;
                    return this;
                },
                '_matches':function(v,msg){
                    if( v == null || typeof v != "object" )
                    {
                        msg.appendValue(v).appendText("is not an Object");
                        return false;
                    }
                    else
                    {
                        if( typeof v[ this.method ] == "function" )
                        {
                            if( this.checkThrows )
                            {
                                var res = null;
                                try{
                                    v[ this.method ].apply( v, this.noArgs ? [] : this.arguments );
                                }
                                catch( e )
                                {
                                    if( this.throwsMatcher )
                                    {
                                        var errorMsg = new Description();
                                        res = this.throwsMatcher.matches( e, errorMsg );
                                        if( !res )
                                        {
                                            msg.appendText("an exception was thrown but").appendText( errorMsg );
                                            msg.diff = errorMsg.diff;
                                        }
                                        else
                                            msg.appendText("an exception was thrown and").appendText( errorMsg );
                                    }
                                    else
                                    {
                                        msg.appendValue( e ).appendText( "was thrown" );
                                        res = true;
                                    }
                                }
                                if( res == null )
                                {
                                    msg.appendText( "no exception was thrown" );
                                    res = false;
                                }
                                return res;
                            }
                            else if( this.returnsMatcher )
                            {
                                var res = v[ this.method ].apply( v, this.noArgs ? [] : this.arguments );
                                var rmsg = new Description();
                                var mres = this.returnsMatcher.matches( res, rmsg );
                                
                                msg.diff = rmsg.diff;
                                msg.appendText("was")
                                   .appendValue( v )
                                   .appendText("of which method")
                                   .appendRawValue(this.method).
                                   appendText("returns")
                                   .appendText( rmsg );
                                return mres;
                            }
                            else
                            {
                                msg.appendText("was").appendValue( v );
                                return true;                            
                            }
                        }
                        else
                        {
                            if( v[ this.method ] == undefined )
                            {
                                msg.appendValue( v ).appendText("do not have a").appendRawValue( this.method ).appendText("method");
                                return false;
                            }
                            else
                            {
                                msg.appendValue( v ).appendText("have a").appendRawValue( this.method ).appendText("property, but it is not a function");
                                return false;
                            
                            }
                        }
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText("an Object with a method").appendRawValue( this.method );
                    
                    if( this.checkThrows )
                    {
                        if( this.throwsMatcher )
                            msg.appendText("which throw")
                               .appendDescriptionOf( this.throwsMatcher )
                               .appendText("when called");
                        else
                            msg.appendText("which throw an exception when called");
                        
                        if( !this.noArgs && this.arguments && this.arguments.length > 0 )
                            msg.appendText("with").appendValue( this.arguments ).appendText("as arguments");
                        else
                            msg.appendText("without arguments");
                    }
                    else if( this.returnsMatcher != null )
                    {
                        msg.appendText( "which returns" )
                           .appendDescriptionOf( this.returnsMatcher )
                           .appendText("when called");
                        if( !this.noArgs && this.arguments && this.arguments.length > 0 )
                            msg.appendText("with").appendValue( this.arguments ).appendText("as arguments");
                        else
                            msg.appendText("without arguments");
                        
                    }
                }
            });
        },
        propertiesCount:function(l){
            if( isNaN(l) )
                throw new Error( "length argument must be a valid number");
            if( l < 0 )
                throw new Error( "length argument must greater than or equal to 0");
                
            return new Matcher({
                'length':l,
                '_matches':function(v,msg){
                    if( v == null || typeof v != "object" || v instanceof Array )
                    {
                        msg.appendText("was").appendValue(v);
                        return false;
                    }
                    else
                    {
                        var l = sortProperties( v ).length;
                        if( this.length == l )
                        {
                            msg.appendText("was").appendValue(v);
                            return true;
                        }
                        else
                        {
                            msg.appendText("was an Object with").appendValue( l ).appendText( l>1 ? "properties":"property" );
                            return false;
                        }
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText( "an Object with" ).appendValue(this.length).appendText(this.length > 1 ? "properties" : "property");
                }
            });
        },
        instanceOf:function(t){
            if( !t )
                throw new Error( "type argument is mandatory" );
            
            return new Matcher({
                'type':t,
                '_matches':function(v,msg){
                    var vtype = getType(v);
                    var t = getTypeName(this.type);
                    if( t == vtype )
                    {
                        msg.appendText("was " + aPrefix( vtype )).appendRawValue( vtype );
                        return true;
                    }
                    else if( v instanceof this.type )
                    {
                        msg.appendText("was " + aPrefix( t ) ).appendRawValue( t );
                        return true;
                    }
                    else
                    {
                        msg.appendText("was " + aPrefix( vtype )).appendRawValue( vtype );
                        return false;
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText( aPrefix( getTypeName(this.type) ) ).appendRawValue( getTypeName(this.type) );
                }
            });
        },
/*---------------------------------------------------------------
    DATE MATCHERS
 *---------------------------------------------------------------*/  
        dateAfterOrEqualTo:function(d){
            return dateAfter(d,true);
        },
        dateAfter:function(d,inclusive){
            
            if( !d || !(d instanceof Date) )
                throw new Error("dateAfter must have a valid comparison date");
            
            return new Matcher({
                'date':d,
                'included':inclusive,
                'inclusive':function(){
                    this.included = true;
                    return this;
                },
                '_matches':function(v,msg){
                    if( v == null || !( v instanceof Date ) )
                    {
                        msg.appendText( "was" ).appendValue( v );
                        return false;
                    }
                    else
                    {
                        if( this.included )
                        {
                            if( v >= this.date )
                            {                        
                                msg.appendText( "was" ).appendRawValue( v.toString() );
                                return true;
                            }
                            else
                            {
                                msg.appendRawValue( v.toString() )
                                   .appendText( "is not after or equal to" )
                                   .appendRawValue( this.date.toString() );
                                return false;
                            }
                        }
                        else
                        {
                            if( v > this.date )
                            {                        
                                msg.appendText( "was" ).appendRawValue( v.toString() );
                                return true;
                            }
                            else
                            {
                                msg.appendRawValue( v.toString() )
                                   .appendText( "is not after" )
                                   .appendRawValue( this.date.toString() );
                                return false;
                            }
                        }
                    }
                },
                '_describeTo':function(msg){
                    if( this.included )
                        msg.appendText("a date after or equal to").appendRawValue( this.date.toString() );
                    else
                        msg.appendText("a date after").appendRawValue( this.date.toString() );
                }
            });
        },
        dateBeforeOrEqualTo:function(d){
            return dateBefore(d,true);
        },
        dateBefore:function(d,inclusive){
            if( !d || !(d instanceof Date) )
                throw new Error("dateBefore must have a valid comparison date");
            
            return new Matcher({
                'date':d,
                'included':inclusive,
                'inclusive':function(){
                    this.included = true;
                    return this;
                },
                '_matches':function(v,msg){
                    if( v == null || !( v instanceof Date ) )
                    {
                        msg.appendText( "was" ).appendValue( v );
                        return false;
                    }
                    else
                    {
                        if( this.included )
                        {
                            if( v <= this.date )
                            {                        
                                msg.appendText( "was" ).appendRawValue( v.toString() );
                                return true;
                            }
                            else
                            {
                                msg.appendRawValue( v.toString() )
                                   .appendText( "is not before or equal to" )
                                   .appendRawValue( this.date.toString() );
                                return false;
                            }
                        }
                        else
                        {
                            if( v < this.date )
                            {                        
                                msg.appendText( "was" ).appendRawValue( v.toString() );
                                return true;
                            }
                            else
                            {
                                msg.appendRawValue( v.toString() )
                                   .appendText( "is not before" )
                                   .appendRawValue( this.date.toString() );
                                return false;
                            }
                        }
                    }
                },
                '_describeTo':function(msg){
                    if( this.included )
                        msg.appendText("a date before or equal to").appendRawValue( this.date.toString() );
                    else
                        msg.appendText("a date before").appendRawValue( this.date.toString() );
                }
            });
        },
        dateBetween:function(a,b,inclusive){
        
            if( !a || !(a instanceof Date))
                throw new Error( "dateBetween must have a valid first date" );
            if( !b || !(b instanceof Date))
                throw new Error( "dateBetween must have a valid first date" );
            if( b <= a )
                throw new Error( "dateBetween second date must be after the first date" );
        
            return new Matcher({
                'a':a,
                'b':b,
                'included':inclusive,
                'inclusive':function(){
                    this.included = true;
                    return this;
                },
                '_matches':function(v,msg){
                    if( !v || !(v instanceof Date ) )
                    {
                        msg.appendText("was").appendValue(v);
                        return false;
                    }
                    else 
                    {
                        if( this.included )
                        {
                            if( v < this.a )
                            {
                                msg.appendRawValue(v.toString())
                                   .appendText( "is before the min date" )
                                   .appendRawValue(this.a.toString());
                                return false;
                            }
                            else if( v > this.b )
                            {
                                msg.appendRawValue(v.toString())
                                   .appendText( "is after the max date" )
                                   .appendRawValue(this.b.toString());
                                return false;
                            }
                            else
                            {
                                msg.appendText("was").appendRawValue(v.toString());
                                return true;
                            }
                        }
                        else
                        {
                            if( v <= this.a )
                            {
                                msg.appendRawValue(v.toString())
                                   .appendText( "is before or equal to the min date" )
                                   .appendRawValue(this.a.toString());
                                return false;
                            }
                            else if( v >= this.b )
                            {
                                msg.appendRawValue(v.toString())
                                   .appendText( "is after or equal to the max date" )
                                   .appendRawValue(this.b.toString());
                                return false;
                            }
                            else
                            {
                                msg.appendText("was").appendRawValue(v.toString());
                                return true;
                            }
                        }
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText("a date between")
                       .appendRawValue(this.a.toString())
                       .appendText("and")
                       .appendRawValue(this.b.toString());
                    if( this.included )
                        msg.appendText("inclusive");
                }
            });
        },
        dateEquals:function(d){
            if( !d || !(d instanceof Date) )
                throw new Error( "dateEquals expect a valid Date object as argument" );
              
            return new Matcher({
                'date':d,
                '_matches':function(v,msg){
                    if( !v || !(v instanceof Date) )
                    {
                        msg.appendText("was").appendValue(v);
                        return false;
                    }
                    else
                    {
                        msg.appendText( "was" ).appendRawValue( v.toString() );
                        return v.getTime() == this.date.getTime();
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText( "a Date equal to" ).appendRawValue( this.date.toString() );
                }
            });
        },
/*---------------------------------------------------------------
    FUNCTION MATCHERS
 *---------------------------------------------------------------*/
        throwsError:function(m, scope, args ){
        
            if( m && !( m instanceof Matcher ) )
                m = equalTo( m );  
                  
            return new Matcher({
                'errorMatcher':m,
                'scope':scope,
                'arguments':args,
                'noArgs':false,
                'withoutArgs':function(){ 
                    this.noArgs = true;
                    return this; 
                },
                'withArgs':function(){
                    this.arguments = argumentsToArray( arguments );
                    return this;
                },
                'withScope':function( scope ){
                    this.scope = scope;
                    return this;
                },
                '_matches':function(v,msg){
                    if( !v || typeof v != "function" )
                    {
                        msg.appendValue( v ).appendText( "is not a function" );
                        return false;
                    }
                    else
                    {
                        var res = null;
                        try
                        {
                            v.apply( this.scope, this.noArgs ? [] : this.arguments );
                        }
                        catch(e) 
                        {
                            if( this.errorMatcher )
                            {
                                var errorMsg = new Description();
                                res = this.errorMatcher.matches( e, errorMsg );
                                if( !res )
                                {
                                    msg.appendText("an exception was thrown but").appendText( errorMsg );
                                    msg.diff = errorMsg.diff;
                                }
                                else
                                    msg.appendText("an exception was thrown and").appendText( errorMsg );
                            }
                            else
                            {
                                msg.appendValue( e ).appendText( "was thrown" );
                                res = true;
                            }
                        }
                        if( res === null )
                        {
                            res = false;
                            msg.appendValue(v).appendText("doesn't thrown");
                            if( this.errorMatcher )
                                msg.appendDescriptionOf( this.errorMatcher );
                            else
                                msg.appendText("any exception");
                        }
                            
                        return res;
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText("a Function which throws");
                    
                    if( this.errorMatcher )
                        msg.appendDescriptionOf( this.errorMatcher );
                    else
                        msg.appendText("an exception");
                        
                    if( this.scope || this.arguments || this.noArgs )
                        msg.appendText("when called");
                    
                    if( this.scope )
                        msg.appendText("with scope").appendValue( this.scope );
                    
                    if( this.scope && ( this.arguments || this.noArgs ) )
                        msg.appendText("and");
                    
                    if ( !this.noArgs && this.arguments && this.arguments.length > 0 )
                        msg.appendText( "with arguments" ).appendValue( this.arguments );
                    else if( this.noArgs )
                        msg.appendText( "without arguments");
                }
            });
        },
        returns:function(m,s,a){
            
            if( m != null && !(m instanceof Matcher) )
                m = equalTo( m );
        
            return new Matcher({
                'returnsMatcher':m,
                'arguments':a,
                'noArgs':false,
                'scope':s,
                'withoutArgs':function(){ 
                    this.noArgs = true;
                    return this; 
                },
                'withArgs':function(){
                    this.arguments = argumentsToArray( arguments );
                    return this;
                },
                'withScope':function(scope){
                    this.scope = scope;
                    return this;
                },
                '_matches':function(v,msg){
                    
                    if( v == null || typeof v != "function" )
                    {
                        msg.appendValue( v ).appendText("is not a Function");
                        return false;
                    }
                    else
                    {
                        var res = v.apply( this.scope, this.noArgs ? [] : this.arguments );
                        
                        if( this.returnsMatcher )
                        {
                            var mmsg = new Description();
                            var mres = this.returnsMatcher.matches(res,mmsg);
                            
                            msg.appendText( "was").appendValue(v).appendText("of which returns" ).appendText( mmsg );
                            msg.diff = mmsg.diff;
                            return mres;
                        }
                        else
                        {
                            if( res === undefined )
                            {
                                msg.appendText("was").appendValue(v).appendText("which returned nothing");
                                return false;
                            }
                            else
                            {
                                msg.appendText( "was").appendValue(v).appendText("of which returns was" ).appendValue(res);
                                return true;
                            }
                        }
                    }
                
                },
                '_describeTo':function(msg){
                    msg.appendText("a Function that returns");
                    
                    if( !this.returnsMatcher )
                        msg.appendText("anything");
                    else
                        msg.appendDescriptionOf( this.returnsMatcher );
                    
                    if( this.scope || this.arguments || this.noArgs )
                        msg.appendText("when called");
                    
                    if( this.scope )
                        msg.appendText("with scope").appendValue( this.scope );
                    
                    if( this.scope && ( this.arguments || this.noArgs ) )
                        msg.appendText("and");
                    
                    if ( !this.noArgs && this.arguments && this.arguments.length > 0 )
                        msg.appendText( "with arguments" ).appendValue( this.arguments );
                    else if( this.noArgs )
                        msg.appendText( "without arguments");
                        
                }
            });
        },
/*---------------------------------------------------------------
    DOM MATCHERS
 *---------------------------------------------------------------*/          
        equalToNode:function(node){
            if( node == null )
                throw "equalToNode expect an argument";
            else if( !(node instanceof Node) )
                throw "equalToNode except a Node object as argument";
            
            return new Matcher({
                'node':node,
                '_matches':function(v,msg){
                    if( v == null || !(v instanceof Node) )
                    {
                        msg.appendText("was").appendValue(v);
                        return false;
                    }
                    else
                    {
                        msg.appendText("was\n").appendRawValue( nodeToString( v ) );
                        if( v.isEqualNode( this.node ) )
                            return true;
                        else
                        {
                            msg.diff = QUnit.diff( nodeToString( this.node ), nodeToString( v ) );
                            return false;
                        }
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText("a Node equal to\n").appendRawValue( nodeToString( this.node ) );
                }
            });
        },
        hasAttribute:function( a, m ){
        
            if( a == null )
                throw "hasAttribute expect an attribute name";
            else if( typeof a != "string" )
                throw "attribute name must be a string";
            
            if( m != null && !(m instanceof Matcher) )
                m = equalTo( m );
        
            return new Matcher({
                'attribute':a,
                'matcher':m,
                '_matches':function(v,msg){
                    if( v == null || !(v instanceof Node))
                    {
                        msg.appendText("was").appendValue(v);
                        return false;
                    }
                    else
                    {
                        if( v.attributes[ this.attribute ] != undefined )
                        {
                            if( this.matcher )
                            {
                                var av = v.attributes[ this.attribute ].value;
                                var mismatchMsg = new Description();
                                if( !this.matcher.matches( av, mismatchMsg ) )
                                {
                                    msg.appendText("attribute").appendRawValue(this.attribute).appendText("value").appendText(mismatchMsg).appendText("in\n").appendRawValue(nodeToString(v));
                                    msg.diff = mismatchMsg.diff;
                                    return false;
                                }
                                else
                                {
                                    msg.appendText("was\n").appendRawValue(nodeToString(v));
                                    return true;
                                }
                            }
                            else
                            {
                                msg.appendText("was\n").appendRawValue(nodeToString(v));
                                return true;
                            }
                        }
                        else
                        {
                            msg.appendRawValue( nodeToString( v ) ).appendText("do not have an attribute").appendRawValue(this.attribute);
                        }
                        
                    }
                },
                '_describeTo':function(msg){
                    msg.appendText( "a Node with an attribute" ).appendRawValue( this.attribute );
                    
                    if( this.matcher )
                        msg.appendText( "of which value is" ).appendDescriptionOf( this.matcher );
                }
            });
        }
    }// end hamcrest
/*---------------------------------------------------------------
    MATCHERS END
 *---------------------------------------------------------------*/  
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
    function sortProperties( o )
    {
        var b = [];
        
        for( var i in o )
            b.push(i);
            
        b.sort();
        
        return b;
    }
    function tokenReplace( s ) 
    {
        var f;
        var args = argumentsToArray( arguments );

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
    function getType(thing)
    {
        if(thing===null)
            return "Null";
        
        var typeNameRegex = /\[object (.{1,})\]/; 
        var results = (typeNameRegex).exec(Object.prototype.toString.call(thing));
        return (results && results.length > 1) ? results[1] : "";
    }
    function getTypeName( type )
    {
        var funcNameRegex = /function (.{1,})\(/;
        var results = (funcNameRegex).exec(type.toString());
        return (results && results.length > 1) ? results[1] : "";
    }
    function aPrefix( s )
    {
        return "aeiouAEIOU".indexOf( s.substr(0,1) ) != -1 ? "an" : "a"
    }
    
    function escapeHtml(s) {
        if (!s) {
            return "";
        }
        s = s + "";
        return s.replace(/[\&"<>\\]/g, function(s) {
            switch(s) {
                case "&": return "&amp;";
                case "\\": return "\\\\";
                case '"': return '\"';
                case "<": return "&lt;";
                case ">": return "&gt;";
                default: return s;
            }
        });
    }
    
    var TAB_STRING = "   ";
    
    function nodeToString( node, indent )
    {
        if( node == null || !(node instanceof Node) )
            throw "nodeToString expect a valid node as argument";
    
        var isRootCall = !indent;
        if (isRootCall)
            indent = "";
        var s = _$( "${indent}<${tag}${attr}>${content}</${tag}>",
                {
                    'tag':String( node.nodeName ).toLowerCase(),
                    'attr':attrToString( node ),
                    'content':contentToString(node, indent ),
                    'indent':indent
                } );
        if( isRootCall )
            return escapeHtml( s );
        else
            return s;
    }
    function attrToString( node )
    {
        var exludedAttrs = [
                            "length",           "item",             "getNamedItem",
                            "setNamedItem",     "removeNamedItem",  "getNamedItemNS",
                            "setNamedItemNS",   "removeNamedItemNS"
                           ];
    
        var s = "";
        var alreadyPrinted = [];
        for( var i in node.attributes )
        {
            if( exludedAttrs.indexOf(i) == -1 && alreadyPrinted.indexOf(node.attributes[i].name) == -1 )
            {
                s+= " " + node.attributes[i].name +"=\""+node.attributes[i].value+"\"";
                alreadyPrinted.push( node.attributes[i].name );    
            }
        }
        return s;
    }
    function contentToString( node, indent )
    {
        var s = "";
        var a = node.childNodes;
        if(!a)
            return "";
        
        var l = a.length;
        var contentIsOnlyText = true;
        var res = [];
        for(var i=0;i<l;i++)
        {
            if( a[i].nodeType == 3 )
                res.push( a[i].textContent );
            else
            {
                res.push( nodeToString( a[i], indent+TAB_STRING ) );
                contentIsOnlyText = false;
            }
        }
        if( contentIsOnlyText )
            s += res.join("");
        else
        {
            res = res.map( function( o, i ){
                if( new RegExp("<").exec( o ) )
                    return o;
                else
                    return indent+TAB_STRING+o;
            } )
            s += "\n" + res.join( "\n" );
        }
        return s + ( ( l > 0 && !contentIsOnlyText ) ? "\n"+indent : "" );
    }

})(this);
