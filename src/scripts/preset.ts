import _ from "lodash";
import type { IGenericVizStyles, IStyleConfiguration } from "./visuals/types";

interface SectionConfig {
    [key: string]: any; // or a more specific type
  }

export const presetTools = {
  defaultStyleConfiguration: (
    defaultStyleConfiguration: IStyleConfiguration[]
  ) =>
   defaultStyleConfiguration.reduce((acc: Record<string, SectionConfig>, section) => {
    const { sectionId } = section;
    const newSection = (acc[sectionId] = {} as Record<string, unknown>);
      section.elements.forEach((prop) => {
        newSection[prop.id] = prop.defaultValue;
      });
      return acc;
    }, {}),

  deepMergeWithPreset: (
    preset: IGenericVizStyles,
    customStyles: IGenericVizStyles
  ) =>
    _.mergeWith(
      _.cloneDeep(preset),
      customStyles,
      (presetValue, configValue) => {
        if (_.isNull(configValue)) {
          return presetValue;
        }
        if (_.isObject(presetValue) && _.isObject(configValue)) {
          // If both values are objects, deep merge them
          return presetTools.deepMergeWithPreset(
            presetValue as IGenericVizStyles,
            configValue as IGenericVizStyles
          );
        }
        return configValue;
      }
    ),
};
