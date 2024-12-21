// @ts-noCheck
import { useState } from 'react';
import { Text, View } from 'react-native';
import 'globals.css';
const Button = () => {
  return <View className='bg-[#000] last:hover:text-[20vw] odd:text-[10px] even:text-[30px]' _twinComponentID={"-789529047"} _twinOrd={0} _twinInjected={[{
    id: "-789529047",
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
      precedence: 805306368,
      style: {
        backgroundColor: "rgba(0,0,0,1)"
      }
    }],
    templateEntries: null
  }]}>
      <Text className='font-medium' _twinComponentID={"657433807"} _twinOrd={0} _twinInjected={[{
      id: "657433807",
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
        precedence: 805306368,
        style: {
          fontWeight: 500
        }
      }, {
        className: "odd:text-[10px]",
        declarations: [{
          prop: "fontSize",
          value: 10,
          _tag: "COMPILED"
        }],
        group: "base",
        important: false,
        precedence: 805437440,
        style: {
          fontSize: 10
        }
      }],
      templateEntries: null
    }]}>Text1</Text>
      <Text className='font-bold' _twinComponentID={"-367340754"} _twinOrd={1} _twinInjected={[{
      id: "-367340754",
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
        precedence: 805306368,
        style: {
          fontWeight: 700
        }
      }, {
        className: "even:text-[30px]",
        declarations: [{
          prop: "fontSize",
          value: 30,
          _tag: "COMPILED"
        }],
        group: "base",
        important: false,
        precedence: 805437440,
        style: {
          fontSize: 30
        }
      }],
      templateEntries: null
    }]}>Text2</Text>
      <Text className='font-medium' _twinComponentID={"662251405"} _twinOrd={2} _twinInjected={[{
      id: "662251405",
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
        precedence: 805306368,
        style: {
          fontWeight: 500
        }
      }, {
        className: "odd:text-[10px]",
        declarations: [{
          prop: "fontSize",
          value: 10,
          _tag: "COMPILED"
        }],
        group: "base",
        important: false,
        precedence: 805437440,
        style: {
          fontSize: 10
        }
      }],
      templateEntries: null
    }]}>Text2</Text>
      <Text className={`hover:text-[#000] ${true ? 'text-medium' : 'text-bold'}`} _twinComponentID={"-362523156"} _twinOrd={3} _twinInjected={[{
      id: "-362523156",
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
        precedence: 805307392,
        style: {
          color: "rgba(0,0,0,1)"
        }
      }, {
        className: "even:text-[30px]",
        declarations: [{
          prop: "fontSize",
          value: 30,
          _tag: "COMPILED"
        }],
        group: "base",
        important: false,
        precedence: 805437440,
        style: {
          fontSize: 30
        }
      }],
      templateEntries: `${true ? 'text-medium' : 'text-bold'}`
    }]}>Text3</Text>
      <View _twinComponentID={"-752763475"} _twinOrd={4} _twinInjected={[{
      id: "-752763475",
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
        precedence: 805438464,
        style: {}
      }, {
        className: "odd:text-[10px]",
        declarations: [{
          prop: "fontSize",
          value: 10,
          _tag: "COMPILED"
        }],
        group: "base",
        important: false,
        precedence: 805437440,
        style: {
          fontSize: 10
        }
      }],
      templateEntries: null
    }]}>
        <Span _twinComponentID={"322901193"} _twinOrd={0} _twinInjected={[{
        id: "322901193",
        target: "style",
        prop: "className",
        entries: [],
        templateEntries: null
      }]}>Hallo</Span>
      </View>
    </View>;
};
export { ChildProp };