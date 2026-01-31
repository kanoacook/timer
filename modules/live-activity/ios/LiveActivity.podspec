Pod::Spec.new do |s|
  s.name           = 'LiveActivity'
  s.version        = '1.0.0'
  s.summary        = 'Live Activity module for Study Timer'
  s.description    = 'Expo module for iOS Live Activities integration'
  s.author         = 'Kanoa'
  s.homepage       = 'https://github.com/kanoa/timer'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => 'https://github.com/kanoa/timer.git', :tag => "v#{s.version}" }
  s.static_framework = true
  s.source_files   = '**/*.swift'
  s.dependency 'ExpoModulesCore'
  s.swift_version  = '5.4'
end
