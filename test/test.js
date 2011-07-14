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

test("notNull matcher", function(){

    assertThat( null, not(notNull()) );
    assertThat( {}, notNull() );
    
    // forced fail
//    assertThat( null, notNull() );
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

module( "hamcrest compound matchers");

test( "allOf matcher", function(){
    assertThat( 10, allOf( notNull(), equalTo(10) ) );
    assertThat( 10, allOf( notNull(), 10 ) );
    assertThat( 10, not( allOf( nullValue(), equalTo(10) ) ) );
    assertThat( 5, allOf( notNull(), not( equalTo(10) ) ) );
    
    // forced fail
//    assertThat( 5, allOf( notNull(), not( equalTo(5) ) ) );
} );

test( "anyOf matcher", function(){
    assertThat( 10, anyOf( equalTo(10), not( equalTo(5) ) ) );
    assertThat( 10, anyOf( 1, 2, 3, 4, allOf(notNull(), 10 ) ) );
    assertThat( 10, not( anyOf( 1,2,3,4 ) ) );
    
    // forced fail
//    assertThat( 5, anyOf( 1, 2, 3, 4 ) );
});

test("both...and matcher",function(){

    raises( function(){ assertThat( 16, both(16) ); }, "calling both without the and fail" );
    
    assertThat( 16, both( notNull() ).and( equalTo(16) ) );
    assertThat( 16, both( notNull() ).and( 16 ) );
});

test("either...or matcher",function(){

    raises( function(){ assertThat( 16, either(16) ); }, "calling either without the or fail" );
    
    assertThat( 16, either( notNull() ).or( equalTo(16) ) );
    assertThat( 16, either( true ).or( 16 ) );
});

module( "hamcrest number matchers" );

test( "nanValue matcher", function(){
    assertThat( NaN, nanValue() );
    assertThat( 12, not( nanValue() ) );
    assertThat( "foo", nanValue() );
});
test( "notNan matcher", function(){
    assertThat( 12, notNan() );
    assertThat( NaN, not( notNan() ) );    
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
    }, "hasProperties must receive an argument object");
    
    assertThat( o, hasProperties( { "foo":"bar", "id":1 } ) );
    assertThat( o, hasProperties( { "name":startsWith("Joh"), "age":greaterThan(30) } ) );
    assertThat( o, not( hasProperties( { "name":contains("Bill"), "age":closeTo(30,3) } ) ) );
    assertThat( o, not( hasProperties( { "bar":65, "age":isA("string") } ) ) );
    assertThat( null, not( hasProperties( { "name":contains("Bill"), "age":closeTo(30,3) } ) ) );
    assertThat( 'foo', not( hasProperties( { "name":contains("Bill"), "age":closeTo(30,3) } ) ) );
    
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
    assertThat( new Description, instanceOf( Description ) );
    
    assertThat( "foo", instanceOf( String ) );
    assertThat( 10, instanceOf( Number ) );
    assertThat( true, instanceOf( Boolean ) );
    
    assertThat( true, not( instanceOf( String ) ) );
})


