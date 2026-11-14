export type FeatureCategoryId =
  | 'crop-soil'
  | 'plant-health'
  | 'market-weather'
  | 'agri-services'
  | 'ai-assistant';

export interface SubFeatureDefinition {
  id: string;
  categoryId: FeatureCategoryId;
  titleKey: string;
  descriptionKey: string;
  statusTagKey: string;
  integrationNoteKey: string;
  workflowStepsKeys: string[];
}

export interface FeatureCategoryDefinition {
  id: FeatureCategoryId;
  titleKey: string;
  subtitleKey: string;
  accentHex: string;
  subFeatures: SubFeatureDefinition[];
}
