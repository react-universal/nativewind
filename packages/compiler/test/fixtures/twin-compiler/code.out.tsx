// @ts-noCheck
import { useState } from 'react';
import { Text, View } from 'react-native';
import 'globals.css';
const Button = () => {
  return <View className='bg-[#000] last:hover:text-[20vw] odd:text-[10px] even:text-[30px]' _twinInjected={{
    id: "-789529047",
    index: 0,
    props: [{
      target: "style",
      prop: "className",
      entries: [{
        className: "bg-[#000]",
        declarations: [{
          prop: "backgroundColor",
          value: "rgba(0,0,0,1)",
          _tag: "COMPILED"
        }],
        group: "base",
        important: false,
        inherited: false,
        precedence: 805306368
      }],
      templateEntries: null
    }]
  }}>
      <Text className='font-medium' _twinInjected={{
      id: "657433807",
      index: 0,
      props: [{
        target: "style",
        prop: "className",
        entries: [{
          className: "font-medium",
          declarations: [{
            prop: "fontWeight",
            value: 500,
            _tag: "COMPILED"
          }],
          group: "base",
          important: false,
          inherited: false,
          precedence: 805306368
        }, {
          className: "odd:text-[10px]",
          declarations: [{
            prop: "fontSize",
            value: 10,
            _tag: "COMPILED"
          }],
          group: "base",
          important: false,
          inherited: true,
          precedence: 805437440
        }],
        templateEntries: null
      }]
    }}>Text1</Text>
      <Text className='font-bold' _twinInjected={{
      id: "-367340754",
      index: 1,
      props: [{
        target: "style",
        prop: "className",
        entries: [{
          className: "font-bold",
          declarations: [{
            prop: "fontWeight",
            value: 700,
            _tag: "COMPILED"
          }],
          group: "base",
          important: false,
          inherited: false,
          precedence: 805306368
        }, {
          className: "even:text-[30px]",
          declarations: [{
            prop: "fontSize",
            value: 30,
            _tag: "COMPILED"
          }],
          group: "base",
          important: false,
          inherited: true,
          precedence: 805437440
        }],
        templateEntries: null
      }]
    }}>Text2</Text>
      <Text className='font-medium' _twinInjected={{
      id: "662251405",
      index: 2,
      props: [{
        target: "style",
        prop: "className",
        entries: [{
          className: "font-medium",
          declarations: [{
            prop: "fontWeight",
            value: 500,
            _tag: "COMPILED"
          }],
          group: "base",
          important: false,
          inherited: false,
          precedence: 805306368
        }, {
          className: "odd:text-[10px]",
          declarations: [{
            prop: "fontSize",
            value: 10,
            _tag: "COMPILED"
          }],
          group: "base",
          important: false,
          inherited: true,
          precedence: 805437440
        }],
        templateEntries: null
      }]
    }}>Text2</Text>
      <Text className={`hover:(text-[#000]) ${true ? 'text-medium' : 'text-bold'}`} _twinInjected={{
      id: "-362523156",
      index: 3,
      props: [{
        target: "style",
        prop: "className",
        entries: [{
          className: "hover:text-[#000]",
          declarations: [{
            prop: "color",
            value: "rgba(0,0,0,1)",
            _tag: "COMPILED"
          }],
          group: "pointer",
          important: false,
          inherited: false,
          precedence: 805307392
        }, {
          className: "even:text-[30px]",
          declarations: [{
            prop: "fontSize",
            value: 30,
            _tag: "COMPILED"
          }],
          group: "base",
          important: false,
          inherited: true,
          precedence: 805437440
        }],
        templateEntries: `${true ? 'text-medium' : 'text-bold'}`
      }]
    }}>Text3</Text>
      <View _twinInjected={{
      id: "-752763475",
      index: 4,
      props: [{
        target: "style",
        prop: "className",
        entries: [{
          className: "last:hover:text-[20vw]",
          declarations: [{
            prop: "fontSize",
            value: "20vw",
            _tag: "NOT_COMPILED"
          }],
          group: "base",
          important: false,
          inherited: true,
          precedence: 805438464
        }, {
          className: "odd:text-[10px]",
          declarations: [{
            prop: "fontSize",
            value: 10,
            _tag: "COMPILED"
          }],
          group: "base",
          important: false,
          inherited: true,
          precedence: 805437440
        }],
        templateEntries: null
      }]
    }}>
        <Span _twinInjected={{
        id: "322901193",
        index: 0,
        props: [{
          target: "style",
          prop: "className",
          entries: [],
          templateEntries: null
        }]
      }}>Hallo</Span>
      </View>
    </View>;
};
export { ChildProp };