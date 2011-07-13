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
    
    d.clearMessage();
    equals( d.message, "" );
    
    d.appendValue( 42 );
    equals( d.message, "<span class='value'>42</span>" );
    
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



