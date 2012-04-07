hamcrest.argumentsToArray = (args) -> arg for arg in args

hamcrest.sortProperties = (o) ->
  b = (k for k of o)
  b.sort()
  b

hamcrest.tokenReplace = (s) ->
  args = argumentsToArray arguments
  args.shift()

  if args.length > 0 and args[0] instanceof Object

    kwargs = args[0]
    s = s.replace /\${([^}]+)}/g, ->
      key = arguments[1]
      if kwargs.hasOwnProperty(key) then kwargs[key] else arguments[0]
    args.shift()

  s.replace /\$([0-9]+)/g, ->
    index = parseInt arguments[1]
    if index < args.length then args[index] else arguments[0]

hamcrest.getType = (thing) ->
  return "Null" unless thing?

  results = /\[object (.{1,})\]/.exec Object.prototype.toString.call thing

  if results and results.length > 1 then results[1] else ""

hamcrest.getTypeName = (type) ->

  results = /function (.{1,})\(/.exec type.toString()
  if results and results.length > 1 then results[1] else ""

hamcrest.aPrefix = (s) -> if s.substr(0,1) in "aeiouAEIOU" then "an" else "a"

hamcrest.escapeHtml = (s) ->
  return "" unless s?

  s = String(s)
  s.replace /[\&"<>\\]/g, (s) ->
    switch s
      when "&"  then "&amp"
      when "\\" then "\\\\"
      when '"'  then '\"'
      when "<"  then "&lt"
      when ">"  then "&gt"
      else s

TAB_STRING = "  "

hamcrest.nodeToString = (node, indent) ->

  unless node? and node instanceof Node
    throw new Error
      message: "nodeToString expect a valid node as argument"

  isRootCall = not indent?
  indent = "" if isRootCall

  s = tokenReplace "${indent}<${tag}${attr}>${content}</${tag}>",
        tag: String( node.nodeName ).toLowerCase()
        attr: attrToString node
        content: contentToString node, indent
        indent: indent

  if isRootCall then escapeHtml s else s

hamcrest.attrToString = (node) ->
  exludedAttrs = [
    "length",          "item",             "getNamedItem",
    "setNamedItem",    "removeNamedItem",  "getNamedItemNS",
    "setNamedItemNS",  "removeNamedItemNS"
  ]

  s = ""
  alreadyPrinted = []
  for attr of node.attributes
    name = node.attributes[attr].name

    if attr of exludedAttrs and name of alreadyPrinted
      s += " #{name}=\"#{node.attributes[attr].value}\""
      alreadyPrinted.push name

  return s

hamcrest.contentToString = (node, indent) ->
  s = ""
  nodes = node.childNodes
  return "" unless a?

  l = a.length
  contentIsOnlyText = true
  res = []
  for node in nodes

    if node.nodeType is 3 then res.push node.textContent
    else
      res.push nodeToString node, indent + TAB_STRING
      contentIsOnlyText = false

  if contentIsOnlyText then s += res.join ""
  else
    res = res.map (o, i) ->
      if /</.exec o then o else indent + TAB_STRING + o

    s += "\n#{res.join "\n"}"

  s + ( if l > 0 and not contentIsOnlyText? then "\n#{indent}" else "" )

