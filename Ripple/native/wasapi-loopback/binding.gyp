{
  "targets": [
    {
      "target_name": "wasapi_loopback",
      "sources": [ "src/loopback_capture.cc" ],
      "include_dirs": [ "<!@(node -p \"require('node-addon-api').include\")" ],
      "dependencies": [ "<!(node -p \"require('node-addon-api').gyp\")" ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS", "_WIN32_WINNT=0x0602" ],
      "cflags_cc": [ "/EHsc" ],
      "conditions": [
        ['OS=="win"', {
          "libraries": [ "ole32.lib", "avrt.lib" ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "AdditionalOptions": [ "/std:c++17" ]
            }
          }
        }, {
          # Non-Windows platforms: skip building (loopback capture is
          # Windows-only via WASAPI). The JS side detects this and falls
          # back to a metadata-driven visualizer instead.
          "type": "none"
        }]
      ]
    }
  ]
}
