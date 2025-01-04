// @ts-noCheck
import { useState } from 'react';
import { Text, View } from 'react-native';
import 'globals.css';
import { StyleSheet222 as _Twin___StyleSheet } from "@native-twin/jsx/sheet";
const Button = () => {
  return <View _twinInjected={{
    id: "-950912315",
    index: -1,
    parentID: "NO_PARENT",
    parentSize: -1,
    metadata: {
      isGroupParent: false,
      hasGroupEvents: false,
      hasPointerEvents: true
    },
    templateEntries: []
  }}>
      <Text _twinInjected={{
      id: "657433807",
      index: 0,
      parentID: "-950912315",
      parentSize: 3,
      metadata: {
        isGroupParent: false,
        hasGroupEvents: false,
        hasPointerEvents: false
      },
      templateEntries: []
    }}>Text1</Text>
      <Text _twinInjected={{
      id: "-367340754",
      index: 1,
      parentID: "-950912315",
      parentSize: 3,
      metadata: {
        isGroupParent: false,
        hasGroupEvents: false,
        hasPointerEvents: false
      },
      templateEntries: [{
        prop: "className",
        target: "style",
        value: `${true ? 'text-medium' : 'text-bold'}`
      }]
    }}>Text3</Text>
      <View _twinInjected={{
      id: "322996843",
      index: 2,
      parentID: "-950912315",
      parentSize: 3,
      metadata: {
        isGroupParent: false,
        hasGroupEvents: false,
        hasPointerEvents: false
      },
      templateEntries: []
    }}>
        <Span _twinInjected={{
        id: "322901193",
        index: 0,
        parentID: "322996843",
        parentSize: 1,
        metadata: {
          isGroupParent: false,
          hasGroupEvents: false,
          hasPointerEvents: false
        },
        templateEntries: []
      }}>Hallo</Span>
      </View>
    </View>;
};
export { ChildProp };
__Twin___StyleSheet.inject([{
  id: "-950912315",
  index: -1,
  parentID: "NO_PARENT",
  parentSize: -1,
  metadata: {
    isGroupParent: false,
    hasGroupEvents: false,
    hasPointerEvents: true
  },
  props: [{
    target: "style",
    prop: "className",
    entries: [{
      className: "bg-[#000]",
      declarations: [{
        _tag: "COMPILED",
        prop: "backgroundColor",
        value: "rgba(0,0,0,1)"
      }],
      group: "base",
      important: false,
      inherited: false,
      precedence: 805306368
    }, {
      className: "hover:bg-red",
      declarations: [{
        _tag: "COMPILED",
        prop: "backgroundColor",
        value: "rgba(248,113,113,1)"
      }],
      group: "pointer",
      important: false,
      inherited: false,
      precedence: 805307392
    }]
  }],
  childStyles: [{
    className: "last:hover:text-[20vw]",
    declarations: [{
      _tag: "COMPILED",
      prop: "fontSize",
      value: "20vw"
    }],
    group: "last",
    important: false,
    inherited: false,
    precedence: 805438464
  }, {
    className: "odd:text-[10px]",
    declarations: [{
      _tag: "COMPILED",
      prop: "fontSize",
      value: 10
    }],
    group: "odd",
    important: false,
    inherited: false,
    precedence: 805437440
  }, {
    className: "even:text-[30px]",
    declarations: [{
      _tag: "COMPILED",
      prop: "fontSize",
      value: 30
    }],
    group: "even",
    important: false,
    inherited: false,
    precedence: 805437440
  }]
}, {
  id: "657433807",
  index: 0,
  parentID: "-950912315",
  parentSize: 3,
  metadata: {
    isGroupParent: false,
    hasGroupEvents: false,
    hasPointerEvents: false
  },
  props: [{
    target: "style",
    prop: "className",
    entries: [{
      className: "font-medium",
      declarations: [{
        _tag: "COMPILED",
        prop: "fontWeight",
        value: 500
      }],
      group: "base",
      important: false,
      inherited: false,
      precedence: 805306368
    }, {
      className: "odd:text-[10px]",
      declarations: [{
        _tag: "COMPILED",
        prop: "fontSize",
        value: 10
      }],
      group: "base",
      important: false,
      inherited: true,
      precedence: 805437440
    }]
  }],
  childStyles: []
}, {
  id: "-367340754",
  index: 1,
  parentID: "-950912315",
  parentSize: 3,
  metadata: {
    isGroupParent: false,
    hasGroupEvents: false,
    hasPointerEvents: false
  },
  props: [{
    target: "style",
    prop: "className",
    entries: [{
      className: "even:text-[30px]",
      declarations: [{
        _tag: "COMPILED",
        prop: "fontSize",
        value: 30
      }],
      group: "base",
      important: false,
      inherited: true,
      precedence: 805437440
    }]
  }],
  childStyles: []
}, {
  id: "322996843",
  index: 2,
  parentID: "-950912315",
  parentSize: 3,
  metadata: {
    isGroupParent: false,
    hasGroupEvents: false,
    hasPointerEvents: false
  },
  props: [{
    target: "style",
    prop: "className",
    entries: [{
      className: "last:hover:text-[20vw]",
      declarations: [{
        _tag: "COMPILED",
        prop: "fontSize",
        value: "20vw"
      }],
      group: "base",
      important: false,
      inherited: true,
      precedence: 805438464
    }, {
      className: "odd:text-[10px]",
      declarations: [{
        _tag: "COMPILED",
        prop: "fontSize",
        value: 10
      }],
      group: "base",
      important: false,
      inherited: true,
      precedence: 805437440
    }]
  }],
  childStyles: []
}, {
  id: "322901193",
  index: 0,
  parentID: "322996843",
  parentSize: 1,
  metadata: {
    isGroupParent: false,
    hasGroupEvents: false,
    hasPointerEvents: false
  },
  props: [{
    target: "style",
    prop: "className",
    entries: []
  }],
  childStyles: []
}]);