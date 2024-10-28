var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = App;
require("./global.css");
var _reactNative = require("react-native");
var _core = require("@native-twin/core");
var _tailwind = _interopRequireDefault(require("./tailwind.config"));
var _jsxRuntime = require("@native-twin/jsx/jsx-runtime");
(0, _core.setup)(_tailwind.default);
function App() {
  return (0, _jsxRuntime.jsx)(_reactNative.View, {
    className: "bg-blue-800 flex-1 items-center justify-center first:bg-green",
    children: (0, _jsxRuntime.jsxs)(_reactNative.View, {
      className: `
          w-[80vw] h-[20vh] rounded-full justify-center items-center
          last:bg-purple border-1 border-white
          ${true && 'h-[50vh]'}
        `,
      children: [(0, _jsxRuntime.jsx)(_reactNative.Text, {
        children: "asd"
      }), (0, _jsxRuntime.jsx)(_reactNative.View, {
        children: (0, _jsxRuntime.jsx)(_reactNative.Text, {
          children: "asdsad2"
        })
      })]
    })
  });
}