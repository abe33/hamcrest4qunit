require "hamcrest4qunit/version"

module Hamcrest4qunit
  # Your code goes here...

  def self.setup
    yield self
  end
end

require 'hamcrest4qunit/engine'
