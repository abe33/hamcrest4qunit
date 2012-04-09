# -*- encoding: utf-8 -*-
require File.expand_path('../lib/hamcrest4qunit/version', __FILE__)

Gem::Specification.new do |gem|
  gem.authors       = ["Cédric Néhémie"]
  gem.email         = ["cedric.nehemie@wopata.com"]
  gem.description   = %q{Hamcrest matchers for QUnit}
  gem.summary       = %q{A port of the Hamcrest matchers for QUnit}
  gem.homepage      = ""

  gem.executables   = `git ls-files -- bin/*`.split("\n").map{ |f| File.basename(f) }
  gem.files         = `git ls-files`.split("\n")
  gem.test_files    = `git ls-files -- {test,spec,features}/*`.split("\n")
  gem.name          = "hamcrest4qunit"
  gem.require_paths = ["lib"]
  gem.version       = Hamcrest4qunit::VERSION

  gem.add_dependency "rails", "> 3.1.0"
  gem.add_development_dependency "coffee-rails", "> 3.1.0"
end
