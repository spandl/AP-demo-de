export interface IDataSet {
  [key: string]: any;
}

export interface IDataAccessors {
  [key: string]: string | string[] | null;
}

export interface IVizSize {
    width: number
    height: number
}


export interface IGenericVizStyles {
  [key: string]:
    | number
    | string
    | string[]
    | boolean
    | object
    | Date
    | IGenericVizStyles
    | IVizSize
    | IGenericSpacing;
}

export interface IStyleConfiguration {
  sectionName: string;
  sectionId: string;
  elements: IStyleConfigurationElement[];
}

export interface IStyleConfigurationElement {
  id: string;
  label: string;
  inputType:
    | "color"
    | "range"
    | "boolean"
    | "selector"
    | "textInput"
    | "numberInput"
    | "hidden"
    | "fontSelector"
    | "fontSize";
  list?: string[];
  range?: [number, number]; // Tuple of exactly two numbers
  rangeStep?: number;
  defaultValue: string | number | boolean | string[];
}

export interface IVizSize {
  margin: IGenericSpacing;
  boundingBox: IGenericBox;
}

export interface IGenericSpacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface IGenericSpacingMirrored {
  vertical: number;
  horizontal: number;
}

export interface IGenericBox {
  width: number;
  height: number;
}
