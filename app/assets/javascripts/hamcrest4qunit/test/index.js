QUnit.jsDump.parsers["node"] = function(v){
    return nodeToString( v );
}

module("hamcrest core");

test( "assertThat polymorphism", function(){
    raises ( function(){ assertThat(); }, "assertThat should throw an error for empty assertions" );
    assertThat( true );
    assertThat( "foo", "foo" );
    assertThat( true, true, "assertThat with a custom message" );
});

test( "Matcher object", function(){
    raises( function(){
        new Matcher();
    }, "new Matcher without options in constructor" );
    raises( function(){
        new Matcher({'_matches':function(){} });
    }, "new Matcher with a missing handler");
    raises( function(){
        new Matcher({'_matches':"foo", '_describeTo':function(){} });
    }, "new Matcher with an invalid handler");
    raises( function(){
        new Matcher({'_matches':function(){}, '_describeTo':15 });
    }, "new Matcher with an invalid handler");

    notEqual( new Matcher({
            '_matches':function(){},
            '_describeTo':function(){}
        }),
        null );
});

test( "Description object", function(){
    var d = new Description()

    notEqual( d, null );
    notEqual( d.message, null );
    equals( d.diff, null );
    equals( d.hasDiff(), false );

    d.diff = "foo";
    equals( d.diff, "foo" );
    equals( d.hasDiff(), true );

    d.appendText("foo");
    equals( d.message, "foo" );
    d.appendText("foo");
    equals( d.message, "foo foo" );

    d.clearMessage();
    equals( d.message, "" );

    d.appendValue( "foo" );
    equals( d.message, "<span class='value'>\"foo\"</span>" );

    d.clearMessage();
    d.appendRawValue( "foo" );
    equals( d.message, "<span class='value'>foo</span>" );

    var m = new Matcher({'_matches':function(){}, '_describeTo':function(msg){
        msg.appendText( "foo" );
    }})
    d.clearMessage();
    d.appendDescriptionOf( m );

    equals( d.message, "foo" );
});

module( "hamcrest utilities");

test( "nodeToString function", function(){

    raises ( function(){
        nodeToString();
    }, "nodeToString fail when no argument");

    raises ( function(){
        nodeToString( "foo" );
    }, "nodeToString fail argument is not a node");

    var n;

    n = document.createElement( "div" );
    assertThat( nodeToString, returns( escapeHtml("<div></div>") ).withArgs( n ) );

    n = document.createElement( "div" );
    n.setAttribute( "class", "foo" )
    assertThat( nodeToString, returns( escapeHtml("<div class=\"foo\"></div>") ).withArgs( n ) );

    n = document.createElement( "div" );
    n.textContent = "abc"
    assertThat( nodeToString, returns( escapeHtml("<div>abc</div>") ).withArgs( n ) );

    n = document.createElement( "div" );
    n.innerHTML = "<h1>abc</h1>def";
    assertThat( nodeToString, returns( escapeHtml("<div>\n   <h1>abc</h1>\n   def\n</div>") ).withArgs( n ) );

    n = document.createElement( "div" );
    n.innerHTML = "<h1>abc</h1><h2>def</h2><h3><span>ghi</span>jkl<span>mno</span></h3>";
    assertThat( nodeToString, returns( escapeHtml("<div>\n   <h1>abc</h1>\n   <h2>def</h2>\n   <h3>\n      <span>ghi</span>\n      jkl\n      <span>mno</span>\n   </h3>\n</div>") ).withArgs( n ) );

    n = document.createElement( "div" );
    n.innerHTML = "<h1 class=\"foo\">abc</h1><h2 id=\"foo\" class=\"foo\">def</h2><h3><span>ghi</span>jkl<span class=\"foo\">mno</span></h3>";
    assertThat( nodeToString, returns( escapeHtml("<div>\n   <h1 class=\"foo\">abc</h1>\n   <h2 class=\"foo\" id=\"foo\">def</h2>\n   <h3>\n      <span>ghi</span>\n      jkl\n      <span class=\"foo\">mno</span>\n   </h3>\n</div>") ).withArgs( n ) );

});

module("hamcrest core matchers");
test("not matcher", function(){

    assertThat( true, not(false) );
    assertThat( 5, not(10) );
    assertThat( 5, not( equalTo( 10 ) ) );

    // forced fail
//    assertThat( 10, not( equalTo( 10 ) ) );
//    assertThat( "A sample text", equalTo( "A SamPLE TeXT" ) );
});

test("equalTo matcher", function(){
    assertThat( 10, equalTo( 10 ) );
    assertThat( "10", equalTo( 10 ) );
    assertThat( 5, not( equalTo( 10 ) ) );
    assertThat( [1,"foo",false], equalTo( [1,"foo",false] ) );

    // forced fail
//    assertThat( 5, equalTo( 10 ) );
//    assertThat( [1,"foo",true], equalTo( [14,"foo",false] ) );
});

test("nullValue matcher", function(){

    assertThat( null, nullValue() );
    assertThat( {}, not(nullValue()) );

    // forced fail
//    assertThat( {}, nullValue() );
});

test("notNullValue matcher", function(){

    assertThat( null, not(notNullValue()) );
    assertThat( {}, notNullValue() );

    // forced fail
//    assertThat( null, notNullValue() );
});

test("anything matcher", function(){

    assertThat( 10, anything() );
    assertThat( true, anything() );
    assertThat( null, anything() );
    assertThat( {}, anything() );
});
test("isA matcher", function(){

    assertThat( 10, isA( "number" ) );
    assertThat( "foo", isA( "string" ) );
    assertThat( false, isA( "boolean" ) );
    assertThat( null, not( isA( "number" ) ) );
});

test( "describedAs matcher", function(){

    raises( function(){
        describedAs();
    }, "describedAs expect two arguments" );

    raises( function(){
        describedAs( "foo", "foo" );
    }, "describedAs first argument must be a valid matcher" );

    raises( function(){
        describedAs( new Matcher({'_matches':function(){},'_describeTo':function(){} }) );
    }, "describedAs second argument must be a valid string" );

    var desc = new Description();
    var m = describedAs(anything(), "a message");
    assertThat( m, hasMethod( "matches" ).returns(true).withArgs("foo",new Description()) );
    m.describeTo( desc );
    assertThat( desc, hasProperty("message", equalTo("a message") ) );

    desc = new Description();
    m = describedAs(equalTo(5), "a message");
    assertThat( m, hasMethod( "matches" ).returns(false).withArgs(10,new Description()) );
    m.describeTo( desc );
    assertThat( desc, hasProperty("message", equalTo("a message") ) );

    desc = new Description();
    m = describedAs(anything(), "a message $0", "foo");
    m.describeTo( desc );
    assertThat( desc, hasProperty("message", equalTo("a message foo") ) );

    desc = new Description();
    m = describedAs(anything(), "a message ${foo}, $0", {'foo':"bar"}, "foo" );
    m.describeTo( desc );
    assertThat( desc, hasProperty("message", equalTo("a message bar, foo") ) );

});

module( "hamcrest compound matchers");

test( "allOf matcher", function(){
    assertThat( 10, allOf( notNullValue(), equalTo(10) ) );
    assertThat( 10, allOf( notNullValue(), 10 ) );
    assertThat( 10, not( allOf( nullValue(), equalTo(10) ) ) );
    assertThat( 5, allOf( notNullValue(), not( equalTo(10) ) ) );

    // forced fail
//    assertThat( 5, allOf( notNullValue(), not( equalTo(5) ) ) );
} );

test( "anyOf matcher", function(){
    assertThat( 10, anyOf( equalTo(10), not( equalTo(5) ) ) );
    assertThat( 10, anyOf( 1, 2, 3, 4, allOf(notNullValue(), 10 ) ) );
    assertThat( 10, not( anyOf( 1,2,3,4 ) ) );

    // forced fail
//    assertThat( 5, anyOf( 1, 2, 3, 4 ) );
});

test("both...and matcher",function(){

    raises( function(){ assertThat( 16, both(16) ); }, "calling both without the and fail" );

    assertThat( 16, both( notNullValue() ).and( equalTo(16) ) );
    assertThat( 16, both( notNullValue() ).and( 16 ) );

    assertThat( 16, not( both( notNullValue() ).and( closeTo( 12,1 ) ) ) );
    assertThat( null, not( both( notNullValue() ).and( 12 ) ) );

});

test("either...or matcher",function(){

    raises( function(){ assertThat( 16, either(16) ); }, "calling either without the or fail" );

    assertThat( 16, either( notNullValue() ).or( equalTo(16) ) );
    assertThat( 16, either( true ).or( 16 ) );
});

module( "hamcrest number matchers" );

test( "nanValue matcher", function(){
    assertThat( NaN, nanValue() );
    assertThat( 12, not( nanValue() ) );
    assertThat( "foo", nanValue() );
});
test( "notNanValue matcher", function(){
    assertThat( 12, notNanValue() );
    assertThat( NaN, not( notNanValue() ) );
});

test( "between matcher", function(){
    raises( function(){
        assertThat( 12, between( 16, 4 ) );
    }, "first argument is lower than the second" );
    raises( function(){
        assertThat( 12, between( NaN, 4 ) );
    }, "first argument is NaN" );
    raises( function(){
        assertThat( 12, between( 4, NaN ) );
    }, "second argument is NaN" );


    assertThat( 16, between( 12, 18 ) );
    assertThat( 12, not( between( 12, 18 ) ) );
    assertThat( 12, between( 12, 18 ).inclusive() );
    assertThat( 18, between( 12, 18 ).inclusive() );
} )

test( "closeTo matcher", function(){
    raises( function(){
        assertThat( 12, closeTo( NaN, 4 ) );
    }, "first argument is NaN" );
    raises( function(){
        assertThat( 12, closeTo( 4, NaN ) );
    }, "second argument is NaN" );

    assertThat( 4, closeTo( 5, 1 ) );
    assertThat( 3, not( closeTo( 5, 1 ) ) );
    assertThat( 1.9, closeTo( 2, 0.1 ) );
})

test( "greaterThan matcher", function(){
    raises( function(){
        assertThat( 12, greaterThan( NaN ) );
    }, "comparison value is NaN" );

    assertThat( 12, greaterThan( 8 ) );
    assertThat( 12, greaterThan( 12 ).inclusive() );
    assertThat( 12, not(greaterThan( 18 )) );
})
test( "greaterThanOrEqualTo matcher", function(){
    raises( function(){
        assertThat( 12, greaterThanOrEqualTo( NaN ) );
    }, "comparison value is NaN" );

    assertThat( 12, greaterThanOrEqualTo( 12 ) );
    assertThat( 12, not( greaterThanOrEqualTo( 19 ) ) );
})
test( "atLeast matcher", function(){
    raises( function(){
        assertThat( 12, atLeast( NaN ) );
    }, "comparison value is NaN" );

    assertThat( 12, atLeast( 12 ) );
    assertThat( 12, not( atLeast( 19 ) ) );
})

test( "lowerThan matcher", function(){
    raises( function(){
        assertThat( 12, lowerThan( NaN ) );
    }, "comparison value is NaN" );

    assertThat( 12, lowerThan( 18 ) );
    assertThat( 12, lowerThan( 12 ).inclusive() );
    assertThat( 12, not(lowerThan( 11 )) );
})
test( "lowerThanOrEqualTo matcher", function(){
    raises( function(){
        assertThat( 12, lowerThanOrEqualTo( NaN ) );
    }, "comparison value is NaN" );

    assertThat( 12, lowerThanOrEqualTo( 12 ) );
    assertThat( 12, not( lowerThanOrEqualTo( 11 ) ) );
})
test( "atMost matcher", function(){
    raises( function(){
        assertThat( 12, atMost( NaN ) );
    }, "comparison value is NaN" );

    assertThat( 12, atMost( 12 ) );
    assertThat( 12, not( atMost( 11 ) ) );
})

module("hamcrest array matchers");

test( "emptyArray matcher", function(){
    assertThat( [], emptyArray() );
    assertThat( [5], not( emptyArray() ) );
    assertThat( null, not( emptyArray() ) );
    assertThat( "", not( emptyArray() ) );
    assertThat( "foo", not( emptyArray() ) );
})
test( "arrayWithLength matcher", function(){
    raises( function(){
        assertThat( [], arrayWithLength() );
    }, "length argument must be a valid number");
    raises( function(){
        assertThat( [], arrayWithLength(-10) );
    }, "length argument must be greater than or equal to 0");

    assertThat( [], arrayWithLength(0) );
    assertThat( [5], not( arrayWithLength(0) ) );
    assertThat( [], not( arrayWithLength(4) ) );
    assertThat( [1,2,3,4], arrayWithLength(4) );
})

test( "array matcher", function(){
    assertThat( [], array() );
    assertThat( [1, 1.9, 4], array( equalTo(1), closeTo(2, 0.1), equalTo(4) ) );
    assertThat( [1,2,3], array(1,2,3) );
    assertThat( [], not( array(1,2,3) ) );
    assertThat( [1,2], not( array(4,6) ) );
    assertThat( null, not( array(4,6) ) );
    assertThat( "46", not( array(4,6) ) );
})

test( "everyItem matcher", function(){
    raises( function(){
        assertThat([1,2,3], everyItem() );
    }, "everyItem must have an argument" );

    assertThat( [1,2,3], everyItem(isA("number")) );
    assertThat( [1,2,"foo"], not( everyItem(isA("number"))) );
    assertThat( [1,1,1,1], everyItem(1) );
    assertThat( null, not(everyItem(isA("number"))) );
    assertThat( "foo", not(everyItem(isA("number"))) );
})

test( "hasItem matcher", function(){
    raises( function(){
        assertThat([1,2,3], hasItem() );
    }, "hasItem must have an argument" );

    assertThat( [1,"foo",false], hasItem(isA("number")) );
    assertThat( ["foo","bar"], not( hasItem(isA("number"))) );
    assertThat( [1,2,3,4], hasItem(1) );
    assertThat( null, not(hasItem(isA("number"))) );
    assertThat( "foo", not(hasItem(isA("number"))) );
})

test( "hasItems matcher", function(){
    raises( function(){
        assertThat([1,2,3], hasItems() );
    }, "hasItems must have at least one argument" );

    assertThat( [ 1, "foo", false], hasItems( isA("number"), "foo" ) );
    assertThat( [ 1, "foo", false], not( hasItems( isA("number"), isA("object") ) ) );
    assertThat( [ "bla", "foo", false], not( hasItems( isA("number"), isA("object") ) ) );
    assertThat( null, not( hasItems( isA("number"), isA("object") ) ) );
    assertThat( false, not( hasItems( isA("number"), isA("object") ) ) );
})

module("hamcrest string matchers")

test( "startsWith matcher", function(){
    raises( function(){
        assertThat( "foo", startsWith() );
    }, "startsWith must have an argument");

    assertThat( "hello world", startsWith("hello") );
    assertThat( "Hello World", not( startsWith("hello") ) );
    assertThat( null, not( startsWith("hello") ) );
    assertThat( [1,2,3], not( startsWith("hello") ) );
})

test( "endsWith matcher", function(){
    raises( function(){
        assertThat( "foo", endsWith() );
    }, "endsWith must have an argument");

    assertThat( "hello world", endsWith("world") );
    assertThat( "Hello World", not( endsWith("world") ) );
    assertThat( null, not( endsWith("world") ) );
    assertThat( [1,2,3], not( endsWith("world") ) );
})

test( "contains matcher", function(){
    raises( function(){
        assertThat( "foo", contains() );
    }, "contains must have an argument");

    assertThat( "hello world", contains( "o w" ) );
    assertThat( "Hello World", not( contains( "o w" ) ) );
    assertThat( null, not( contains( "ull" ) ) );
    assertThat( [1,2,3], not( contains( "1,2" ) ) );
})

test( "emptyString matcher", function(){

    assertThat( "", emptyString() );
    assertThat( "foo", not( emptyString() ) );
    assertThat( null, not( emptyString() ) );
    assertThat( [], not( emptyString() ) );
})

test( "stringWithLength matcher", function(){
    raises( function(){
        assertThat( 'foo', stringWithLength() );
    }, "length argument must be a valid number");
    raises( function(){
        assertThat( 'foo', stringWithLength(-10) );
    }, "length argument must be a valid number");

    assertThat( "", stringWithLength(0) );
    assertThat( "foo", stringWithLength( 3 ) );
    assertThat( "foo", not( stringWithLength( 2 ) ) );
})

test( "matchRe matcher", function(){
    raises( function(){
        assertThat( "foo", matchRe() );
    }, "matchRe must receive an argument");
    raises( function(){
        assertThat( "foo", matchRe(15) );
    }, "matchRe must receive either a string or a regexp");

    assertThat( "foo", matchRe( "^foo$" ) )
    assertThat( "foo", matchRe( new RegExp( "^foo$" ) ) );
    assertThat( null, not( matchRe( new RegExp( "ull$" ) ) ) );
    assertThat( [1,2,3], not( matchRe( new RegExp( "1,2" ) ) ) );
})

module( "hamcrest object matchers" )
test( "strictlyEqualTo matcher", function(){
    assertThat( 10, strictlyEqualTo( 10 ) );
    assertThat( "foo", strictlyEqualTo( "foo" ) );

    var o1 = {'foo':"bar",id:0};
    var o2 = {'foo':"bar",id:0};
    var a1 = ["foo",15,false];
    var a2 = ["foo",15,false];

    assertThat( o1, strictlyEqualTo(o1) );
    assertThat( o1, not(strictlyEqualTo(o2)) );
    assertThat( a1, strictlyEqualTo(a1) );
    assertThat( a1, not(strictlyEqualTo(a2)) );
})

test( "hasProperty matcher", function(){
    var o = {
                'foo':"bar",
                'id':1
            };

    raises( function(){
        assertThat( o, hasProperty() )
    }, "hasProperty must receive at least the property name" );


    assertThat( o, hasProperty("foo") );
    assertThat( o, hasProperty("foo","bar") );
    assertThat( o, hasProperty("id",isA("number") ) );
    assertThat( o, not( hasProperty( "foo", "foo" ) ) );
    assertThat( o, not( hasProperty( "bar" ) ) );
    assertThat( o, not( hasProperty( "id", closeTo(10,2) ) ) );
    assertThat( null, not( hasProperty( "bar" ) ) );
    assertThat( "foo", not( hasProperty( "bar" ) ) );
})

test( "hasProperties matcher", function(){
    var o = {
                'foo':"bar",
                'id':1,
                'name':"John Doe",
                'age':35
            };

    raises( function(){
        assertThat( o, hasProperties() );
    }, "hasProperties expect a list of matchers");

    assertThat( o, hasProperties( { "foo":"bar", "id":1 } ) );
    assertThat( o, hasProperties( { "name":startsWith("Joh"), "age":greaterThan(30) } ) );
    assertThat( o, not( hasProperties( { "name":contains("Bill"), "age":closeTo(30,3) } ) ) );
    assertThat( o, not( hasProperties( { "bar":65, "age":isA("string") } ) ) );
    assertThat( null, not( hasProperties( { "name":contains("Bill"), "age":closeTo(30,3) } ) ) );
    assertThat( 'foo', not( hasProperties( { "name":contains("Bill"), "age":closeTo(30,3) } ) ) );

})

test( "hasMethod matcher", function(){

    var objectWithFunction = {
        'foo':function(a,b,c){
            return a == 1 && b == 2 && c == 3;
        }
    };
    var objectWithFunctionThatThrowAnError = {
        'foo':function(a,b,c){
            if( a == 1 && b == 2 && c == 3 )
                return true;
            else
                throw "foo";
        }
    };
    var objectWithDynamicallySetFunction = {};
    objectWithDynamicallySetFunction["foo"] = function(){ return "foo"; };

    var objectWithProperty = {
        'foo':"bar"
    };
    var objectWithoutFunction = {};

    function TestObject (){

    }
    TestObject.prototype = {
        'foo':function(){ return "foo"; }
    }

    raises( function(){
        assertThat( o, hasMethod() );
    }, "hasMethod expect a function name");

    assertThat( objectWithFunction, hasMethod( "foo" ) );
    assertThat( objectWithFunction, hasMethod( "foo" ).returns( false ) );
    assertThat( objectWithFunction, hasMethod( "foo" ).returns( false ).withoutArgs() );

    assertThat( objectWithFunction, hasMethod( "foo" ).returns( false ).withArgs(1,2,3).withoutArgs() );
    assertThat( objectWithFunction, hasMethod( "foo" ).returns( false ).withoutArgs().withArgs(1,2,3) );
    assertThat( objectWithFunction, hasMethod( "foo" ).returns( equalTo(false) ) );
    assertThat( objectWithFunction, hasMethod( "foo" ).returns( true ).withArgs( 1,2,3 ) );

    assertThat( objectWithDynamicallySetFunction, hasMethod( "foo" ) );
    assertThat( objectWithDynamicallySetFunction, hasMethod( "foo" ).returns("foo") );

    assertThat( new TestObject(), hasMethod( "foo" ) );
    assertThat( new TestObject(), hasMethod( "foo" ).returns("foo") );


    assertThat( objectWithFunctionThatThrowAnError, hasMethod( "foo" ).throwsError() );
    assertThat( objectWithFunctionThatThrowAnError, hasMethod( "foo" ).throwsError().withoutArgs() );
    assertThat( objectWithFunctionThatThrowAnError, hasMethod( "foo" ).throwsError( "foo" ).withArgs(4,5,6) );
    assertThat( objectWithFunctionThatThrowAnError, not( hasMethod( "foo" ).throwsError( "foo" ).withArgs(1,2,3) ) );
    assertThat( objectWithFunctionThatThrowAnError, not( hasMethod( "foo" ).throwsError( isA( "object" ) ) ) );

    assertThat( objectWithProperty, not( hasMethod("foo") ) )
    assertThat( objectWithoutFunction, not( hasMethod( "foo" ) ) );
    assertThat( null, not( hasMethod( "foo" ) ) );
    assertThat( "foo", not( hasMethod( "foo" ) ) );

})

test( "propertiesCount matcher", function(){
    var o = {
                'foo':"bar",
                'id':1,
                'name':"John Doe",
                'age':35
            };

    raises( function(){
        assertThat( o, propertiesCount() );
    }, "length argument is mandatory");
    raises( function(){
        assertThat( o, propertiesCount(-10) );
    }, "length argument must be greater than or equal to 0");

    assertThat( o, propertiesCount(4) );
    assertThat( o, not( propertiesCount( 2 ) ) );
    assertThat( {}, propertiesCount(0) );
    assertThat( null, not( propertiesCount(2) ) );
    assertThat( [1,2], not( propertiesCount(2) ) );
})

test( "instanceOf matcher", function(){
    raises( function(){
        assertThat( "foo", instanceOf() );
    }, "type argument is mandatory" );

    assertThat( new String("foo"), instanceOf( String ) );
    assertThat( new Number(10), instanceOf( Number ) );
    assertThat( new RegExp("foo"), instanceOf( RegExp ) );
    assertThat( new Description(), instanceOf( Description ) );

    assertThat( "foo", instanceOf( String ) );
    assertThat( 10, instanceOf( Number ) );
    assertThat( true, instanceOf( Boolean ) );

    assertThat( true, not( instanceOf( String ) ) );
})

module("hamcrest date matchers")

test( "dateAfter matcher", function(){
    raises( function(){
        assertThat( new Date(), dateAfter() );
    }, "dateAfter must have a valid comparison date" );
    raises( function(){
        assertThat( new Date(), dateAfter( 15 ) );
    }, "dateAfter must have a valid comparison date" );

    assertThat( new Date( 2000, 0, 1 ), dateAfter( new Date( 1999, 11, 31 ) ) );
    assertThat( new Date( 2000, 0, 1 ), dateAfter( new Date( 2000, 0, 1 ) ).inclusive() );
    assertThat( new Date( 2000, 0, 1 ), not( dateAfter( new Date( 2001, 11, 31 ) ) ) );
    assertThat( new Date( 2000, 0, 1 ), not( dateAfter( new Date( 2001, 11, 31 ) ).inclusive() ) );
    assertThat( null, not( dateAfter( new Date( 2001, 11, 31 ) ).inclusive() ) );
    assertThat( "foo", not( dateAfter( new Date( 2001, 11, 31 ) ).inclusive() ) );
})
test( "dateAfterOrEqualTo matcher", function(){
    raises( function(){
        assertThat( new Date(), dateAfterOrEqualTo() );
    }, "dateAfterOrEqualTo must have a valid comparison date" );
    raises( function(){
        assertThat( new Date(), dateAfterOrEqualTo( 15 ) );
    }, "dateAfterOrEqualTo must have a valid comparison date" );

    assertThat( new Date( 2000, 0, 1 ), dateAfterOrEqualTo( new Date( 2000, 0, 1 ) ) );
    assertThat( new Date( 2000, 0, 1 ), not( dateAfterOrEqualTo( new Date( 2001, 11, 31 ) ) ) );
    assertThat( null, not( dateAfterOrEqualTo( new Date( 2001, 11, 31 ) ) ) );
    assertThat( "foo", not( dateAfterOrEqualTo( new Date( 2001, 11, 31 ) ) ) );
})

test( "dateBefore matcher", function(){
    raises( function(){
        assertThat( new Date(), dateBefore() );
    }, "dateBefore must have a valid comparison date" );
    raises( function(){
        assertThat( new Date(), dateBefore(15) );
    }, "dateBefore must have a valid comparison date" );

    assertThat( new Date( 2000, 0, 1 ), dateBefore( new Date( 2001, 11, 31 ) ) );
    assertThat( new Date( 2000, 0, 1 ), dateBefore( new Date( 2000, 0, 1 ) ).inclusive() );
    assertThat( new Date( 2000, 0, 1 ), not( dateBefore( new Date( 1999, 11, 31 ) ) ) );
    assertThat( new Date( 2000, 0, 1 ), not( dateBefore( new Date( 1999, 11, 31 ) ).inclusive() ) );
    assertThat( null, not( dateBefore( new Date( 1999, 11, 31 ) ).inclusive() ) );
    assertThat( "foo", not( dateBefore( new Date( 1999, 11, 31 ) ).inclusive() ) );
})
test( "dateBeforeOrEqualTo matcher", function(){
    raises( function(){
        assertThat( new Date(), dateBeforeOrEqualTo() );
    }, "dateBeforeOrEqualTo must have a valid comparison date" );
    raises( function(){
        assertThat( new Date(), dateBeforeOrEqualTo(15) );
    }, "dateBeforeOrEqualTo must have a valid comparison date" );

    assertThat( new Date( 2000, 0, 1 ), dateBeforeOrEqualTo( new Date( 2000, 0, 1 ) ) );
    assertThat( new Date( 2000, 0, 1 ), not( dateBeforeOrEqualTo( new Date( 1999, 11, 31 ) ) ) );
    assertThat( null, not( dateBeforeOrEqualTo( new Date( 1999, 11, 31 ) ) ) );
    assertThat( "foo", not( dateBeforeOrEqualTo( new Date( 1999, 11, 31 ) ) ) );
})

test( "dateBetween matcher", function(){
    raises( function(){
        assertThat( new Date(), dateBetween() );
    }, "dateBetween must have a valid first date" );
    raises( function(){
        assertThat( new Date(), dateBetween(new Date()) );
    }, "dateBetween must have a valid second date" );
    raises( function(){
        assertThat( new Date(), dateBetween(new Date(), new Date(2000,0,1)) );
    }, "dateBetween first date must be before the second date");
    raises( function(){
        assertThat( new Date(), dateBetween( 15, new Date() ) );
    }, "dateBetween must have a valid first date" );
    raises( function(){
        assertThat( new Date(), dateBetween( new Date(), 15 ) );
    }, "dateBetween must have a valid second date" );

    assertThat( new Date(2000, 0, 1), dateBetween( new Date(1999,0,1), new Date(2001,0,1) ) );
    assertThat( new Date(2000, 0, 1), dateBetween( new Date(1999,0,1), new Date(2000,0,1) ).inclusive() );

    assertThat( new Date(2000, 0, 1), not( dateBetween( new Date(1999,0,1), new Date(2000,0,1) ) ) );
    assertThat( new Date(2001, 0, 1), not( dateBetween( new Date(1999,0,1), new Date(2000,0,1) ) ) );

    assertThat( new Date(1998, 0, 1), not( dateBetween( new Date(1999,0,1), new Date(2000,0,1) ).inclusive() ) );
    assertThat( new Date(2000, 0, 2), not( dateBetween( new Date(1999,0,1), new Date(2000,0,1) ).inclusive() ) );

    assertThat( null, not( dateBetween( new Date(1999,0,1), new Date(2000,0,1) ).inclusive() ) );
    assertThat( "foo", not( dateBetween( new Date(1999,0,1), new Date(2000,0,1) ).inclusive() ) );
})

test( "dateEquals matcher", function(){

    raises( function(){
        assertThat( new Date(), dateEquals() );
    }, "dateEquals must have a valid comparison date" );
    raises( function(){
        assertThat( new Date(), dateEquals( 15 ) );
    }, "dateEquals must have a valid comparison date" );

    assertThat( new Date(2000,0,1), dateEquals( new Date(2000,0,1) ) );

    assertThat( new Date(2000,0,1), not( dateEquals( new Date(2001,0,1) ) ) );
    assertThat( null, not( dateEquals( new Date(2001,0,1) ) ) );
    assertThat( "foo", not( dateEquals( new Date(2001,0,1) ) ) );

})

module ( "hamcrest function matchers" )

test( "throwsError matcher", function(){
    var errorMsg = "This is an error";
    var scopeObject = {"foo":"bla"};
    var errorScopeObject = {};

    var arguments0 = "foo";
    var arguments1 = 25;
    var arguments2 = true;

    function functionThatNotThrowAnError(){}
    function functionThatThrowAnErrorMessage(){
        throw errorMsg;
    }
    function functionThatThrowAnErrorObject(){
        throw new Error(errorMsg);
    }
    function functionThatThrowAnErrorIfInvalidScope(){
        if( this.hasOwnProperty( "foo") )
            return;
        else
            throw errorMsg;
    }
    function functionThatThrowAnErrorIfInvalidArguments(){
        if( arguments[0] != arguments0 )
            throw errorMsg;
        else if( arguments[1] != arguments1 )
            throw errorMsg;
        else if( arguments[2] != arguments2 )
            throw errorMsg;
    }

    assertThat( functionThatThrowAnErrorMessage, throwsError() );
    assertThat( functionThatThrowAnErrorMessage, throwsError().withoutArgs() );
    assertThat( functionThatThrowAnErrorMessage, throwsError( errorMsg ) );

    assertThat( functionThatThrowAnErrorObject, throwsError() );
    assertThat( functionThatThrowAnErrorObject, throwsError().withoutArgs() );
    assertThat( functionThatThrowAnErrorObject, throwsError( isA( "object" ) ) );

    assertThat( functionThatThrowAnErrorIfInvalidScope, throwsError().withScope( errorScopeObject ) );
    assertThat( functionThatThrowAnErrorIfInvalidScope, throwsError().withScope( errorScopeObject ).withoutArgs() );
    assertThat( functionThatThrowAnErrorIfInvalidScope, not( throwsError().withScope( scopeObject ) ) );

    assertThat( functionThatThrowAnErrorIfInvalidArguments, throwsError() );
    assertThat( functionThatThrowAnErrorIfInvalidArguments, throwsError().withArgs() );
    assertThat( functionThatThrowAnErrorIfInvalidArguments, throwsError().withoutArgs() );
    assertThat( functionThatThrowAnErrorIfInvalidArguments, not( throwsError().withArgs( arguments0, arguments1, arguments2 ) ) );
    assertThat( functionThatThrowAnErrorIfInvalidArguments, throwsError().withoutArgs().withArgs( arguments0, arguments1, arguments2 ) );
    assertThat( functionThatThrowAnErrorIfInvalidArguments, throwsError().withArgs( arguments0, arguments1, arguments2 ).withoutArgs() );

    assertThat( functionThatNotThrowAnError, not( throwsError() ) );
    assertThat( functionThatNotThrowAnError, not( throwsError().withoutArgs() ) );

    assertThat( null, not( throwsError() ) );
    assertThat( "foo", not( throwsError() ) );
})

test( "returns matcher", function(){

    var scopeObject = {'foo':"bar"};
    var errorScope = {};

    function functionWithScope()
    {
        return this.foo;
    }
    function functionWithScopeAndArgs( a, b )
    {
        return this.foo + a + b;
    }
    function functionWithReturn(a,b,c)
    {
        return a == 1 && b == 2 && c == 3;
    }
    function functionWithoutReturn(){}

    assertThat( functionWithReturn, returns() );
    assertThat( functionWithoutReturn, not( returns() ) );

    assertThat( functionWithReturn, returns( false ) );
    assertThat( functionWithReturn, returns( false ).withoutArgs() );

    assertThat( functionWithReturn, returns( false ).withoutArgs().withArgs( 1,2,3 ) );
    assertThat( functionWithReturn, returns( false ).withArgs( 1,2,3 ).withoutArgs() );

    assertThat( functionWithReturn, returns( true ).withArgs( 1,2,3 ) );
    assertThat( functionWithReturn, returns( false ).withArgs( 4,5,6 ) );

    assertThat( functionWithScope, returns( "bar" ).withScope( scopeObject ) );
    assertThat( functionWithScope, returns( "bar" ).withScope( scopeObject ).withoutArgs() );
    assertThat( functionWithScope, not( returns( "bar" ).withScope( errorScope ) ) );

    assertThat( functionWithScopeAndArgs, returns( both( isA("string") ).and("barabar") ).withScope( scopeObject ).withArgs("ab","ar") );

    assertThat( functionWithScopeAndArgs, not( returns( "barabar" ).withScope( scopeObject ).withArgs("ob","ar") ) );

    assertThat( null, not( returns() ) );
    assertThat( "foo", not( returns() ) );

})

module( "hamcrest DOM matchers" );
test( "equalToNode matcher", function(){

    raises( function(){
        equalToNode();
    }, "equalToNode expect an argument" );

    raises( function(){
        equalToNode( "foo" );
    }, "equalToNode expect a Node object as argument" );

    var nodeA = document.createElement("div");
    nodeA.innerHTML = "<h1>A sample node</h1>";

    var nodeB = document.createElement("div");
    nodeB.innerHTML = "<h1>A sample node</h1>";

    assertThat( nodeA, equalToNode( nodeB ) );

    nodeA = document.createElement("div");
    nodeA.setAttribute( "class", "foo" );
    nodeA.innerHTML = "<h1>A sample node</h1>";

    nodeB = document.createElement("div");
    nodeB.setAttribute( "class", "foo" );
    nodeB.innerHTML = "<h1>A sample node</h1>";

    assertThat( nodeA, equalToNode( nodeB ) );

    nodeA = document.createElement("div");
    nodeA.setAttribute( "class", "foo" );
    nodeA.innerHTML = "<h1>A sample node</h1>";

    nodeB = document.createElement("div");
    nodeB.innerHTML = "<h1>A sample node</h1>";
    assertThat( nodeA, not( equalToNode( nodeB ) ) );

    nodeA = document.createElement("a");
    nodeB = document.createElement("b");
    assertThat( nodeA, not( equalToNode( nodeB ) ) );

    assertThat( "foo", not( equalToNode( nodeB ) ) );
    assertThat( null, not( equalToNode( nodeB ) ) );
});

test("hasAttribute matcher", function(){
    raises( function(){
        hasAttribute();
    }, "hasAttribute expect at least an attribute name");

    var node = document.createElement( "div" );
    node.setAttribute("class", "foo");
    node.setAttribute("id", "foo");
    node.setAttribute("name", "bla");
    node.setAttribute("style", "border:1px solid yellow;");

    assertThat( node, hasAttribute( "class" ) )
    assertThat( node, hasAttribute( "id", "foo" ) )
    assertThat( node, hasAttribute( "name", "bla" ) )
    assertThat( node, hasAttribute( "style", contains( "border" ) ) );

    assertThat( node, not( hasAttribute( "href" ) ))
    assertThat( node, not( hasAttribute( "style", contains( "color" ) ) ))

    assertThat( "foo", not( hasAttribute( "foo" ) ))
    assertThat( null, not( hasAttribute( "foo" ) ))
})





