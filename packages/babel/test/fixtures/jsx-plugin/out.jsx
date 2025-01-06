Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = App;
var _reactNative = require("react-native");
var _jsxRuntime = require("@native-twin/jsx/jsx-runtime");
function App() {
  return (0, _jsxRuntime.jsxs)(_reactNative.View, {
    className: `group flex-1 first:bg-red-200`,
    children: [(0, _jsxRuntime.jsx)(_reactNative.Text, {
      className: `${true && 'text-lg'} text-md`,
      children: "Hello World"
    }), (0, _jsxRuntime.jsx)(_reactNative.Text, {
      children: "Hello World"
    }), (0, _jsxRuntime.jsxs)(_reactNative.View, {
      className: "flex-1",
      children: [(0, _jsxRuntime.jsx)(_reactNative.Text, {
        className: "text-lg",
        children: "Test Text"
      }), (0, _jsxRuntime.jsx)(_reactNative.Text, {
        className: "text-lg",
        children: "Test Text2"
      })]
    })]
  });
}