class hamcrest.Description
  constructor: (@messages="", @diff=null) ->

  toString: -> @message
  hasDiff: -> @diff?
  clearMessage: -> @message = ""; this
  appendText: (msg) -> @append msg; this

  appendValue: (val) ->
    @append "<span class='value'>#{QUnit.jsDump.parse val}</span>",
    this

  appendRawValue: (val) ->
    @append "<span class='value'>#{val}</span>", val
    this

  appendDescriptionOf: (matcher) ->
    matcher.describeTo this
    this

  append: (s) ->
    @message += " " if @message isnt ""
    @message += s
