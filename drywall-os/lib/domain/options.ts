import {
  BoardType,
  CodeAssetType,
  CrewRole,
  CustomerType,
  DrywallThickness,
  FinishLevel,
  JobStatus,
  JobType,
  PayType,
  PhotoCategory,
  TextureType
} from "@prisma/client";

export const customerTypes = Object.values(CustomerType);
export const jobTypes = Object.values(JobType);
export const jobStatuses = Object.values(JobStatus);
export const drywallThicknesses = Object.values(DrywallThickness);
export const boardTypes = Object.values(BoardType);
export const finishLevels = Object.values(FinishLevel);
export const textureTypes = Object.values(TextureType);
export const crewRoles = Object.values(CrewRole);
export const payTypes = Object.values(PayType);
export const photoCategories = Object.values(PhotoCategory);
export const codeAssetTypes = Object.values(CodeAssetType);

export const estimateTemplates = [
  "smallPatchRepair",
  "singleRoomDrywall",
  "garageDrywall",
  "basementDrywall",
  "commercialOfficeBuildout",
  "ceilingTextureRepair",
  "waterDamageRepair",
  "fullHouseDrywallPackage"
] as const;

export type EstimateTemplateKey = (typeof estimateTemplates)[number];
