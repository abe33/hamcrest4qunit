h4q.hasProperty = (p, v) ->
  unless p?
    throw new Error message: "hasProperty must have at least a property name"

  v = equalTo v if v? and not (v instanceof Matcher)

  return new Matcher
    property: p
    value: v
    _matches: (v,msg) ->
      unless v? and typeof v is "object"
        msg.appendText("was").appendValue(v)
        false
      else unless v.hasOwnProperty @property
        msg.appendValue(v)
           .appendText( "don't have a property named" )
           .appendRawValue(@property)
        false
      else if @value?
        msgtmp = new Description()
        res = @value.matches v[@property], msgtmp

        if res then msg.appendText("was").appendValue(v)
        else
          msg.appendText msgtmp
          msg.diff = msgtmp.diff
        res
      else
        msg.appendText("was").appendValue(v)
        true

    _describeTo: (msg) ->
      msg.appendText("an Object with a property").appendRawValue(@property)
      if @value?
        msg.appendText("of which value is").appendDescriptionOf(@value)

h4q.hasProperties = ( kwargs ) ->
  unless kwargs?
    throw new Error message: "the hasProperties kwargs arguments is mandatory"

  for k, kwarg of kwargs
    kwargs[k] = equalTo kwarg unless kwarg instanceof Matcher

  new Matcher
    kwargs: kwargs
    _matches: (v,msg) ->
      unless v? and typeof v is "object"
        msg.appendText("was").appendValue(v)
        return false
      else
        hasError = false
        for p,m of @kwargs
          unless v.hasOwnProperty p
            if hasError
              msg.appendText ","

            msg.appendRawValue(p).appendText("was not defined")
            hasError = true
          else
            val = v[p]
            msgtmp = new Description()
            unless m.matches val, msgtmp
              msg.appendText(",") if hasError
              msg.appendRawValue(p).appendText(": ").appendText msgtmp
              hasError = true

        msg.appendText("was").appendValue(v) unless hasError
        return not hasError

    _describeTo: (msg) ->
      props = h4q.sortProperties @kwargs
      l = props.length
      msg.appendText("an Object which has properties")
      for p,i in props
        m = @kwargs[p]
        if i is l - 1 then msg.appendText("and")
        else if i > 0 then msg.appendText(",")

        msg.appendRawValue(p).appendText(":").appendDescriptionOf(m)

h4q.hasMethod = (f, r, a, t) ->
  unless f? and typeof f is "string"
    throw new Error message: "hasMethod expect a function name"

  r = equalTo r if r? and not (r instanceof Matcher)

  new Matcher
    method: f
    returnsMatcher: r
    throwsMatcher: t
    checkThrows: false
    noArgs: false
    arguments: a
    returns: (m) ->
      m = equalTo m unless m instanceof Matcher
      @returnsMatcher = m
      this
    withoutArgs: ->
      @noArgs = true
      this
    withArgs: ->
      @arguments = h4q.argumentsToArray arguments
      this
    throwsError: (m) ->
      m = h4q.notNullValue() unless m?
      m = h4q.equalTo m unless m instanceof Matcher
      @throwsMatcher = m
      @checkThrows = true
      this
    _matches: (v,msg) ->
      unless v? and typeof v is "object"
        msg.appendValue(v).appendText("is not an Object")
        false
      else
        if typeof v[@method] is "function"
          if @checkThrows
            res = null
            try
              v[ @method ].apply v, if @noArgs then [] else @arguments
            catch e
              if @throwsMatcher
                errorMsg = new Description()
                res = @throwsMatcher.matches e, errorMsg
                unless res
                  msg.appendText("an exception was thrown but")
                     .appendText(errorMsg)
                  msg.diff = errorMsg.diff
                else
                  msg.appendText("an exception was thrown and")
                     .appendText( errorMsg)
              else
                msg.appendValue(e).appendText( "was thrown" )
                res = true

            unless res?
              msg.appendText("no exception was thrown")
              res = false

            res

          else if @returnsMatcher
            res = v[@method].apply v, if @noArgs then [] else @arguments
            rmsg = new Description()
            mres = @returnsMatcher.matches res, rmsg

            msg.diff = rmsg.diff
            msg.appendText("was")
               .appendValue( v )
               .appendText("of which method")
               .appendRawValue(@method)
               .appendText("returns")
               .appendText( rmsg )
            mres
          else
            msg.appendText("was").appendValue(v)
            true
        else
          unless v[@method]?
            msg.appendValue(v)
               .appendText("do not have a")
               .appendRawValue(@method)
               .appendText("method")
            false
          else
            msg.appendValue(v)
               .appendText("have a")
               .appendRawValue(@method)
               .appendText("property, but it is not a ")
            false

    _describeTo: (msg) ->
      msg.appendText("an Object with a method").appendRawValue(@method)

      if @checkThrows
        if @throwsMatcher
          msg.appendText("which throw")
             .appendDescriptionOf(@throwsMatcher)
             .appendText("when called")
        else
          msg.appendText("which throw an exception when called")

        if not @noArgs and @arguments? and @arguments.length > 0
          msg.appendText("with")
             .appendValue(@arguments)
             .appendText("as arguments")
        else
          msg.appendText("without arguments")

      else if @returnsMatcher?
        msg.appendText("which returns")
           .appendDescriptionOf(@returnsMatcher)
           .appendText("when called")
        if not @noArgs and @arguments? and @arguments.length > 0
          msg.appendText("with")
             .appendValue(@arguments)
             .appendText("as arguments")
        else
          msg.appendText("without arguments")

h4q.propertiesCount = (l) ->
  if isNaN l
    throw new Error message: "length argument must be a valid number"
  if l < 0
    throw new Error message: "length argument must greater than or equal to 0"

  new Matcher
    length: l
    _matches: (v,msg) ->
      unless v? and typeof v is "object" and not (v instanceof Array)
        msg.appendText("was").appendValue(v)
        false
      else
        l = h4q.sortProperties(v).length
        if @length is l
          msg.appendText("was").appendValue(v)
          true
        else
          msg.appendText("was an Object with")
             .appendValue(l)
             .appendText(if l > 1 then "properties" else "property")
          false

    _describeTo: (msg) ->
      msg.appendText("an Object with")
         .appendValue(@length)
         .appendText(if @length > 1 then "properties" else "property")

h4q.instanceOf = (t) ->
  unless t?
    throw new Error message: "type argument is mandatory"

  new Matcher
    type: t
    _matches: (v,msg) ->
      vtype = h4q.getType v
      t = h4q.getTypeName @type
      if t is vtype
        msg.appendText("was #{aPrefix vtype}").appendRawValue(vtype)
        true
      else if v instanceof @type
        msg.appendText("was #{aPrefix t}").appendRawValue(t)
        true
      else
        msg.appendText("was #{aPrefix vtype}").appendRawValue(vtype)
        false

    _describeTo: (msg) ->
      msg.appendText(aPrefix getTypeName @type)
         .appendRawValue(getTypeName @type)
